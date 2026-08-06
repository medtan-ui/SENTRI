/**
 * modules/analytics/metrics.ts
 * Pure computation for the Learning Analytics framework. No Firestore,
 * no side effects — every function here takes already-fetched documents
 * and returns a value, so each metric is unit-testable in isolation and
 * the service layer stays about IO and orchestration.
 *
 * The framework has four levels, and each maps to a group below:
 *
 *   Reaction/Learning  — normalized gain, per-topic mastery
 *   Item quality       — difficulty (p-value) and discrimination
 *   Behaviour (K-L3)   — first-attempt safe rate, consequence trigger
 *                        rate, time-to-decide, fast-wrong vs slow-wrong
 *   Transfer           — does a topic learned in one module hold up when
 *                        it reappears in a later one
 */

/** A `quizResponses` row, loosely typed at this boundary. */
export interface ResponseRow {
  userId?: string
  moduleId?: string
  assessmentType?: string
  attemptId?: string
  questionId?: string
  topic?: string | null
  selectedChoiceId?: string | null
  isCorrect?: boolean
  durationMs?: number | null
}


/** A `scenarioDecisionRecords` row. */
export interface DecisionRow {
  userId?: string
  moduleId?: string
  scenarioId?: string
  scenarioChoiceId?: string
  isSafeChoice?: boolean
  attemptNumber?: number
  durationMs?: number | null
}

function round(value: number, places = 2): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
}

// ── Learning: normalized gain ────────────────────────────────────────

/**
 * Hake's normalized gain over a cohort: the average of each individual's
 * gain, not the gain of the averages. Those differ whenever students
 * start at different levels, and the average of individual gains is the
 * one that answers "did students improve", which is the general objective
 * this metric exists to report.
 *
 * Pairs with no pre-test, no post-test, or a pre-test of 100 (no headroom
 * — the ratio is undefined, not zero) are excluded rather than counted as
 * a zero gain, and `pairedCount` reports how many actually contributed.
 */
export function cohortNormalizedGain(
  pairs: Array<{ pre: number | null | undefined; post: number | null | undefined }>,
): { avgPre: number; avgPost: number; normalizedGain: number | null; pairedCount: number } {
  const usable = pairs.filter(
    (p) => typeof p.pre === 'number' && typeof p.post === 'number',
  ) as Array<{ pre: number; post: number }>

  if (usable.length === 0) {
    return { avgPre: 0, avgPost: 0, normalizedGain: null, pairedCount: 0 }
  }

  const avgPre = Math.round(usable.reduce((sum, p) => sum + p.pre, 0) / usable.length)
  const avgPost = Math.round(usable.reduce((sum, p) => sum + p.post, 0) / usable.length)

  const gains = usable
    .filter((p) => p.pre < 100)
    .map((p) => Math.max(-1, Math.min(1, (p.post - p.pre) / (100 - p.pre))))

  return {
    avgPre,
    avgPost,
    normalizedGain: gains.length > 0 ? round(gains.reduce((s, g) => s + g, 0) / gains.length) : null,
    pairedCount: usable.length,
  }
}

/**
 * Per-module post-test scores, derived from `quizResponses` rather than
 * read off a progress row.
 *
 * There is no longer a per-module post-test — the six of them were
 * replaced by one end-of-curriculum final assessment. But that assessment
 * is seeded from the same six pre-test banks and every one of its answer
 * rows is written with the module its item came from, so a per-module
 * "after" score is still recoverable: take that student's posttest rows
 * for that module and score them. This is what keeps per-module gain
 * reportable after the change.
 *
 * @returns userId -> score (0-100), for one module
 */
export function postScoresByStudent(
  responses: FirebaseFirestore.DocumentData[],
  moduleId?: string,
): Map<string, number> {
  const tally = new Map<string, { correct: number; total: number }>()
  responses.forEach((r) => {
    if (r.assessmentType !== 'posttest') return
    if (moduleId && r.moduleId !== moduleId) return
    const userId = r.userId as string
    if (!userId) return
    const entry = tally.get(userId) ?? { correct: 0, total: 0 }
    entry.total += 1
    if (r.isCorrect === true) entry.correct += 1
    tally.set(userId, entry)
  })

  const scores = new Map<string, number>()
  tally.forEach((entry, userId) => {
    if (entry.total > 0) scores.set(userId, Math.round((entry.correct / entry.total) * 100))
  })
  return scores
}

// ── Learning: per-topic mastery ──────────────────────────────────────

export interface TopicMastery {
  topic: string
  preCorrectRate: number
  postCorrectRate: number
  quizCorrectRate: number
  preCount: number
  postCount: number
  quizCount: number
  /** Percentage-point movement from pre to post. Null with no paired data. */
  gain: number | null
}

/**
 * Correct-rate per topic at each measurement point. This is what turns
 * "the class scored 72%" into "the class still doesn't understand that
 * HTTPS is not a trust signal" — the diagnosis an instructor can act on.
 */
export function topicMastery(responses: ResponseRow[]): TopicMastery[] {
  const byTopic = new Map<string, { pre: [number, number]; post: [number, number]; quiz: [number, number] }>()

  responses.forEach((row) => {
    const topic = row.topic
    if (!topic) return
    if (!byTopic.has(topic)) {
      byTopic.set(topic, { pre: [0, 0], post: [0, 0], quiz: [0, 0] })
    }
    const bucket = byTopic.get(topic)!
    const slot =
      row.assessmentType === 'pretest'
        ? bucket.pre
        : row.assessmentType === 'posttest'
          ? bucket.post
          : row.assessmentType === 'quiz'
            ? bucket.quiz
            : null
    if (!slot) return
    slot[1] += 1
    if (row.isCorrect) slot[0] += 1
  })

  return [...byTopic.entries()]
    .map(([topic, b]) => {
      const preRate = percent(b.pre[0], b.pre[1])
      const postRate = percent(b.post[0], b.post[1])
      return {
        topic,
        preCorrectRate: preRate,
        postCorrectRate: postRate,
        quizCorrectRate: percent(b.quiz[0], b.quiz[1]),
        preCount: b.pre[1],
        postCount: b.post[1],
        quizCount: b.quiz[1],
        gain: b.pre[1] > 0 && b.post[1] > 0 ? postRate - preRate : null,
      }
    })
    .sort((a, b) => a.topic.localeCompare(b.topic))
}

// ── Item quality: difficulty and discrimination ──────────────────────

export interface ItemAnalysis {
  questionId: string
  assessmentType: string
  topic: string | null
  responses: number
  correct: number
  /** Classical p-value: proportion answering correctly. Higher = easier. */
  difficulty: number
  difficultyLabel: 'Very easy' | 'Easy' | 'Moderate' | 'Hard' | 'Very hard'
  /**
   * Discrimination index D — the upper group's correct rate minus the
   * lower group's, split on total score. Positive means the item behaves
   * like the rest of the test; near zero or negative flags an item worth
   * rewriting, which is the whole point of running item analysis.
   * Null when there aren't enough attempts to split meaningfully.
   */
  discrimination: number | null
  /**
   * How many whole attempts of this item's assessment are on record, and
   * how many the upper/lower split needs before D is reported. Carried on
   * the item itself so a suppressed D can say *why* it is suppressed — a
   * bare "n/a" reads as a bug rather than as "not enough data yet".
   */
  attemptCount: number
  minAttemptsForDiscrimination: number
  medianDurationMs: number | null
  distractorCounts?: Record<string, number>
}

function difficultyLabel(p: number): ItemAnalysis['difficultyLabel'] {
  if (p >= 0.9) return 'Very easy'
  if (p >= 0.7) return 'Easy'
  if (p >= 0.5) return 'Moderate'
  if (p >= 0.3) return 'Hard'
  return 'Very hard'
}

/** Below this, an upper/lower split is noise rather than a signal. */
const MIN_ATTEMPTS_FOR_DISCRIMINATION = 10

/**
 * Item analysis over one assessment type's responses. Attempts are
 * grouped by attemptId to reconstruct each whole test performance, then
 * the top and bottom 27% (the conventional split) are compared per item.
 */
export function itemAnalysis(responses: ResponseRow[]): ItemAnalysis[] {
  const byType = new Map<string, ResponseRow[]>()
  responses.forEach((row) => {
    const type = row.assessmentType || 'unknown'
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type)!.push(row)
  })

  const results: ItemAnalysis[] = []

  byType.forEach((rows, assessmentType) => {
    // Reconstruct each attempt's total score, so items can be judged
    // against overall performance rather than in isolation.
    const attempts = new Map<string, { correct: number; total: number; rows: ResponseRow[] }>()
    rows.forEach((row) => {
      const key = row.attemptId || `${row.userId}-${row.moduleId}`
      if (!attempts.has(key)) attempts.set(key, { correct: 0, total: 0, rows: [] })
      const attempt = attempts.get(key)!
      attempt.total += 1
      if (row.isCorrect) attempt.correct += 1
      attempt.rows.push(row)
    })

    const ranked = [...attempts.values()].sort(
      (a, b) => b.correct / (b.total || 1) - a.correct / (a.total || 1),
    )
    const groupSize = Math.floor(ranked.length * 0.27)
    const canDiscriminate = ranked.length >= MIN_ATTEMPTS_FOR_DISCRIMINATION && groupSize > 0
    const upper = canDiscriminate ? ranked.slice(0, groupSize) : []
    const lower = canDiscriminate ? ranked.slice(-groupSize) : []

    const correctRateIn = (group: typeof ranked, questionId: string): number => {
      let correct = 0
      let total = 0
      group.forEach((attempt) => {
        attempt.rows.forEach((row) => {
          if (row.questionId !== questionId) return
          total += 1
          if (row.isCorrect) correct += 1
        })
      })
      return total > 0 ? correct / total : 0
    }

    const byQuestion = new Map<string, ResponseRow[]>()
    rows.forEach((row) => {
      const id = row.questionId || 'unknown'
      if (!byQuestion.has(id)) byQuestion.set(id, [])
      byQuestion.get(id)!.push(row)
    })

    byQuestion.forEach((questionRows, questionId) => {
      const total = questionRows.length
      const correct = questionRows.filter((r) => r.isCorrect).length
      const p = total > 0 ? correct / total : 0
      const durations = questionRows
        .map((r) => r.durationMs)
        .filter((d): d is number => typeof d === 'number')

      const distractorCounts: Record<string, number> = {}
      questionRows.forEach((r) => {
        if (r.selectedChoiceId) {
          distractorCounts[r.selectedChoiceId] = (distractorCounts[r.selectedChoiceId] || 0) + 1
        }
      })

      results.push({
        questionId,
        assessmentType,
        topic: questionRows.find((r) => r.topic)?.topic ?? null,
        responses: total,
        correct,
        difficulty: round(p),
        difficultyLabel: difficultyLabel(p),
        discrimination: canDiscriminate
          ? round(correctRateIn(upper, questionId) - correctRateIn(lower, questionId))
          : null,
        attemptCount: ranked.length,
        minAttemptsForDiscrimination: MIN_ATTEMPTS_FOR_DISCRIMINATION,
        medianDurationMs: median(durations),
        distractorCounts,
      })
    })
  })

  return results.sort((a, b) => a.difficulty - b.difficulty)
}

// ── Behaviour: Kirkpatrick Level 3 ───────────────────────────────────

export interface BehaviourMetrics {
  totalDecisions: number
  /**
   * Of the scenarios a student reached, how often the *first* thing they
   * did was the safe thing. This is the headline behavioural measure:
   * unlike an eventual-success rate it can't be inflated by retrying
   * until the simulation lets you through.
   */
  firstAttemptSafeRate: number
  firstAttemptCount: number
  /** How often a risky choice actually fired a consequence beat. */
  consequenceTriggerRate: number
  avgTimeToDecideMs: number | null
  medianTimeToDecideMs: number | null
  /**
   * Fast-wrong vs slow-wrong: a risky choice made well below the median
   * decision time reads as not-looking; one made above it reads as
   * looking and still misjudging. They call for different interventions,
   * which is why they're reported apart rather than as one error count.
   */
  fastWrongCount: number
  slowWrongCount: number
}

export function behaviourMetrics(decisions: DecisionRow[]): BehaviourMetrics {
  const total = decisions.length
  const firstAttempts = decisions.filter((d) => (d.attemptNumber ?? 1) === 1)
  const riskyCount = decisions.filter((d) => d.isSafeChoice === false).length

  const durations = decisions
    .map((d) => d.durationMs)
    .filter((d): d is number => typeof d === 'number' && d >= 0)

  const medianDuration = median(durations)
  const avgDuration =
    durations.length > 0 ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : null

  let fastWrongCount = 0
  let slowWrongCount = 0
  if (medianDuration !== null) {
    decisions.forEach((d) => {
      if (d.isSafeChoice !== false) return
      const duration = d.durationMs
      if (typeof duration !== 'number') return
      if (duration < medianDuration) fastWrongCount += 1
      else slowWrongCount += 1
    })
  }

  return {
    totalDecisions: total,
    firstAttemptSafeRate: percent(
      firstAttempts.filter((d) => d.isSafeChoice === true).length,
      firstAttempts.length,
    ),
    firstAttemptCount: firstAttempts.length,
    consequenceTriggerRate: percent(riskyCount, total),
    avgTimeToDecideMs: avgDuration,
    medianTimeToDecideMs: medianDuration,
    fastWrongCount,
    slowWrongCount,
  }
}

// ── Transfer ─────────────────────────────────────────────────────────

export interface TransferPoint {
  moduleId: string
  moduleOrder: number
  firstAttemptSafeRate: number
  firstAttemptCount: number
}

export interface TransferAnalysis {
  /** First-attempt safe rate per module, in curriculum order. */
  byModule: TransferPoint[]
  /**
   * Percentage-point difference between the second half of the
   * curriculum and the first. Positive means students arrive at later
   * modules already behaving more safely — the training generalizing
   * rather than each module being learned in isolation.
   */
  behaviouralTransfer: number | null
  /**
   * Topics measured in more than one module (see the shared 'public-wifi'
   * item), with how the correct rate moved between the earlier and later
   * module. This is the direct, item-level transfer measure.
   */
  sharedTopics: Array<{
    topic: string
    earlierModuleId: string
    laterModuleId: string
    earlierCorrectRate: number
    laterCorrectRate: number
    delta: number
  }>
}

export function transferAnalysis(
  decisions: DecisionRow[],
  responses: ResponseRow[],
  moduleOrderById: Record<string, number>,
): TransferAnalysis {
  const byModule = new Map<string, DecisionRow[]>()
  decisions.forEach((d) => {
    if (!d.moduleId) return
    if (!byModule.has(d.moduleId)) byModule.set(d.moduleId, [])
    byModule.get(d.moduleId)!.push(d)
  })

  const points: TransferPoint[] = [...byModule.entries()]
    .map(([moduleId, rows]) => {
      const firstAttempts = rows.filter((d) => (d.attemptNumber ?? 1) === 1)
      return {
        moduleId,
        moduleOrder: moduleOrderById[moduleId] ?? 0,
        firstAttemptSafeRate: percent(
          firstAttempts.filter((d) => d.isSafeChoice === true).length,
          firstAttempts.length,
        ),
        firstAttemptCount: firstAttempts.length,
      }
    })
    .filter((p) => p.firstAttemptCount > 0)
    .sort((a, b) => a.moduleOrder - b.moduleOrder)

  let behaviouralTransfer: number | null = null
  if (points.length >= 2) {
    const half = Math.floor(points.length / 2)
    const early = points.slice(0, half)
    const late = points.slice(points.length - half)
    const mean = (list: TransferPoint[]) =>
      list.reduce((s, p) => s + p.firstAttemptSafeRate, 0) / list.length
    behaviouralTransfer = Math.round(mean(late) - mean(early))
  }

  // Item-level transfer: a topic that appears in two different modules.
  const topicModule = new Map<string, Map<string, [number, number]>>()
  responses.forEach((row) => {
    if (!row.topic || !row.moduleId) return
    if (!topicModule.has(row.topic)) topicModule.set(row.topic, new Map())
    const modules = topicModule.get(row.topic)!
    if (!modules.has(row.moduleId)) modules.set(row.moduleId, [0, 0])
    const slot = modules.get(row.moduleId)!
    slot[1] += 1
    if (row.isCorrect) slot[0] += 1
  })

  const sharedTopics: TransferAnalysis['sharedTopics'] = []
  topicModule.forEach((modules, topic) => {
    if (modules.size < 2) return
    const ordered = [...modules.entries()].sort(
      (a, b) => (moduleOrderById[a[0]] ?? 0) - (moduleOrderById[b[0]] ?? 0),
    )
    const [earlierId, earlier] = ordered[0]
    const [laterId, later] = ordered[ordered.length - 1]
    const earlierRate = percent(earlier[0], earlier[1])
    const laterRate = percent(later[0], later[1])
    sharedTopics.push({
      topic,
      earlierModuleId: earlierId,
      laterModuleId: laterId,
      earlierCorrectRate: earlierRate,
      laterCorrectRate: laterRate,
      delta: laterRate - earlierRate,
    })
  })

  return { byModule: points, behaviouralTransfer, sharedTopics }
}
