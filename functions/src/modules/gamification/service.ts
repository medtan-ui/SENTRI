/**
 * modules/gamification/service.ts
 * Points, badges, streaks, and the leaderboard.
 *
 * ── Why recompute instead of increment ───────────────────────────────
 * The obvious implementation of "award 20 points when a lesson is
 * finished" is an increment at the moment it happens. That version breaks
 * in four ordinary situations this app already has: a Cloud Function
 * trigger that retries, an admin granting a quiz retry (which flips
 * `quizCompleted` back to false and then true again), an admin resetting
 * a module, and every student who already existed before this feature
 * shipped.
 *
 * So nothing here increments. `recomputeFromProgress` reads a student's
 * six moduleProgress rows and derives the whole score from scratch. Run
 * it once or run it fifty times, the answer is identical, and a student
 * with two years of history gets a correct score the first time it runs
 * for them. The only cost is six document reads on a write that was
 * already happening.
 *
 * ── What isn't derived ───────────────────────────────────────────────
 * The streak, and the badge list.
 *
 * The streak depends on *when* a student showed up, which no progress
 * document records, so it is real stored state that `touchStreak`
 * advances. Days are Asia/Manila days: this is a Philippine school
 * project, and a streak that rolls over at 8am local time would be
 * nonsense to every student using it.
 *
 * Badges are unioned, never replaced. A badge marks something that
 * happened; if an admin later resets a module, the student does not
 * un-earn the moment they finished it the first time.
 */
import { admin } from '../../shared/admin'
import { ModuleProgressDoc } from '../progress/models'
import {
  BADGES,
  GamificationTotals,
  POINTS,
  badgeCatalogForClient,
  earnedBadgeIds,
  rankFor,
} from './catalog'
import { GamificationDoc, GetLeaderboardInput, LeaderboardEntry, LeaderboardResult } from './models'
import * as repo from './repository'
import { BehaviourRow, FinalAssessmentSummary } from './repository'

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000
const DEFAULT_LEADERBOARD_LIMIT = 10
const MAX_LEADERBOARD_LIMIT = 50

/**
 * `YYYY-MM-DD` for a moment, in Asia/Manila. The Philippines has not
 * observed daylight saving since 1978, so a fixed +08:00 shift is exact
 * rather than an approximation.
 */
export function manilaDate(at: Date = new Date()): string {
  return new Date(at.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10)
}

function previousDate(isoDate: string): string {
  const asUtc = new Date(`${isoDate}T00:00:00.000Z`)
  return new Date(asUtc.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/**
 * Pure streak arithmetic. Same day is a no-op (so opening the dashboard
 * five times in an afternoon is still one day), the day before continues
 * the run, and anything older starts over at one.
 */
export function nextStreak(
  lastActiveDate: string | null,
  currentStreak: number,
  longestStreak: number,
  today: string,
): { currentStreak: number; longestStreak: number; lastActiveDate: string; extended: boolean } {
  if (lastActiveDate === today) {
    return { currentStreak, longestStreak, lastActiveDate: today, extended: false }
  }
  const continues = lastActiveDate === previousDate(today)
  const next = continues ? currentStreak + 1 : 1
  return {
    currentStreak: next,
    longestStreak: Math.max(longestStreak, next),
    lastActiveDate: today,
    extended: true,
  }
}

/** What one module's progress row is worth, on its own. */
export function pointsForModule(progress: ModuleProgressDoc): number {
  let points = 0
  if (progress.preTestCompleted) points += POINTS.PRETEST
  if (progress.lessonCompleted) points += POINTS.LESSON
  if (progress.simulationCompleted) points += POINTS.SIMULATION
  if (progress.quizCompleted || typeof progress.score === 'number') {
    const score = typeof progress.score === 'number' ? progress.score : 0
    points += POINTS.QUIZ_BASE + Math.round(score * POINTS.QUIZ_SCORE_MULTIPLIER)
    if (score === 100) points += POINTS.QUIZ_PERFECT_BONUS
  }
  if (progress.moduleCompleted) points += POINTS.MODULE
  return points
}

/**
 * The end-of-curriculum final assessment is worth points too, but it is a
 * single event rather than part of any one module — so it's scored here,
 * separately, from its own document.
 */
export function pointsForFinalAssessment(finalDoc: FinalAssessmentSummary | null): number {
  if (!finalDoc?.completed) return 0
  let points = POINTS.FINAL_ASSESSMENT
  if (finalDoc.passed) points += POINTS.FINAL_ASSESSMENT_PASS_BONUS
  return points
}

/**
 * Note the quiz condition: `quizCompleted || score is a number`. An
 * admin-granted retry sets `quizCompleted` back to false while the score
 * from the first attempt stays on the document, and a student mid-appeal
 * should not watch their points drop as the price of appealing.
 */
export function totalsFrom(
  progressRows: ModuleProgressDoc[],
  currentStreak: number,
  longestStreak: number,
  behaviourRows: BehaviourRow[] = [],
  finalDoc: FinalAssessmentSummary | null = null,
): GamificationTotals {
  const scores = progressRows
    .map((row) => row.score)
    .filter((score): score is number => typeof score === 'number')

  // A flawless run is a module whose simulation is finished AND that was
  // got through without a risky choice. Two sources say so, and either is
  // enough. The decision records are the first run's evidence: zero risky
  // choices on a simulation nobody has started is vacuous, and a finished
  // simulation with no behaviour row at all (decision recording fails
  // soft by design) is not evidence of a clean run. `simulationFlawless`
  // covers the replay case, where nothing is recorded on purpose but a
  // student who comes back and gets it perfectly right has still done the
  // thing the badge is for.
  const behaviourByModule = new Map(behaviourRows.map((row) => [row.moduleId, row]))
  const flawlessSimulations = progressRows.filter((row) => {
    if (!row.simulationCompleted) return false
    if (row.simulationFlawless) return true
    const behaviour = behaviourByModule.get(row.moduleId)
    return Boolean(behaviour) && behaviour!.riskyChoices === 0 && behaviour!.safeChoices > 0
  }).length

  return {
    flawlessSimulations,
    // One gain now, not a best-of-six: the final assessment is the only
    // post measurement, so there is exactly one gain per student.
    bestNormalizedGain: typeof finalDoc?.normalizedGain === 'number' ? finalDoc.normalizedGain : null,
    lessonsCompleted: progressRows.filter((row) => row.lessonCompleted).length,
    simulationsCompleted: progressRows.filter((row) => row.simulationCompleted).length,
    quizzesCompleted: progressRows.filter((row) => row.quizCompleted || typeof row.score === 'number').length,
    modulesCompleted: progressRows.filter((row) => row.moduleCompleted).length,
    pretestsCompleted: progressRows.filter((row) => row.preTestCompleted).length,
    finalAssessmentCompleted: Boolean(finalDoc?.completed),
    finalAssessmentPassed: Boolean(finalDoc?.passed),
    perfectQuizzes: scores.filter((score) => score === 100).length,
    bestQuizScore: scores.length > 0 ? Math.max(...scores) : null,
    averageQuizScore:
      scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
    currentStreak,
    longestStreak,
  }
}

export function pointsFrom(
  progressRows: ModuleProgressDoc[],
  finalDoc: FinalAssessmentSummary | null = null,
): number {
  return (
    progressRows.reduce((sum, row) => sum + pointsForModule(row), 0) + pointsForFinalAssessment(finalDoc)
  )
}

/**
 * Rebuilds one student's whole gamification document from their progress.
 * Idempotent by construction — see the file header.
 *
 * @param touchStreakToo when true, this run also counts as activity for
 *   today. Set by the progress trigger (finishing a lesson is unambiguous
 *   activity) and cleared by a plain read, which must not manufacture a
 *   streak day just because a page loaded.
 */
export async function recomputeFromProgress(
  userId: string,
  touchStreakToo = false,
): Promise<GamificationDoc> {
  const [existing, progressRows, profile, behaviourRows, finalDoc] = await Promise.all([
    repo.getGamification(userId),
    repo.listProgressForUser(userId),
    repo.getProfileSummary(userId),
    repo.listBehaviourForUser(userId),
    repo.getFinalAssessmentSummary(userId),
  ])

  let currentStreak = existing?.currentStreak ?? 0
  let longestStreak = existing?.longestStreak ?? 0
  let lastActiveDate = existing?.lastActiveDate ?? null

  if (touchStreakToo) {
    const advanced = nextStreak(lastActiveDate, currentStreak, longestStreak, manilaDate())
    currentStreak = advanced.currentStreak
    longestStreak = advanced.longestStreak
    lastActiveDate = advanced.lastActiveDate
  }

  const totals = totalsFrom(progressRows, currentStreak, longestStreak, behaviourRows, finalDoc)
  const points = pointsFrom(progressRows, finalDoc)
  const rank = rankFor(points)

  // Union, never replace — a badge already earned stays earned.
  const previousBadges = existing?.badges ?? []
  const qualifying = earnedBadgeIds(totals)
  const badges = [...new Set([...previousBadges, ...qualifying])]

  const previousLog = existing?.badgeLog ?? []
  const loggedIds = new Set(previousLog.map((entry) => entry.id))
  const now = admin.firestore.Timestamp.now()
  const badgeLog = [
    ...previousLog,
    ...badges.filter((id) => !loggedIds.has(id)).map((id) => ({ id, earnedAt: now })),
  ]

  const doc: GamificationDoc = {
    userId,
    displayName: profile.displayName,
    points,
    level: rank.level,
    rankName: rank.rankName,
    rankFloor: rank.rankFloor,
    nextRankAt: rank.nextRankAt,
    nextRankName: rank.nextRankName,
    badges,
    badgeLog,
    currentStreak,
    longestStreak,
    lastActiveDate,
    totals,
    createdAt: existing?.createdAt ?? admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  await repo.saveGamification(userId, doc)
  return doc
}

/**
 * Marks today as active for this student and returns the refreshed
 * document. Called when a student opens their dashboard: showing up is
 * the behaviour a streak is meant to reward, and a student who reads a
 * lesson without finishing it would otherwise lose a day they earned.
 *
 * Recomputing rather than patching keeps a streak badge from lagging a
 * day behind the streak that earned it.
 */
export async function recordDailyVisit(userId: string): Promise<GamificationDoc> {
  return recomputeFromProgress(userId, true)
}

/**
 * A student's own gamification state, self-healing on first read: an
 * account that predates this feature has no document, so one is built
 * from the progress they already have instead of showing them a zero.
 */
export async function getMine(userId: string): Promise<GamificationDoc> {
  const existing = await repo.getGamification(userId)
  if (existing) return existing
  return recomputeFromProgress(userId, false)
}

function toEntry(doc: GamificationDoc, rank: number, callerUid: string): LeaderboardEntry {
  return {
    userId: doc.userId,
    displayName: doc.displayName || 'Student',
    points: doc.points ?? 0,
    level: doc.level ?? 1,
    rankName: doc.rankName ?? 'Trainee',
    currentStreak: doc.currentStreak ?? 0,
    badgeCount: doc.badges?.length ?? 0,
    rank,
    isYou: doc.userId === callerUid,
  }
}

/**
 * The board itself, across every ranked student.
 *
 * A caller who placed outside the returned rows still gets their own
 * standing back as `you`, computed with a count aggregation rather than by
 * paging the collection — a leaderboard that just says "you're not on it"
 * is the version students stop opening.
 */
export async function getLeaderboard(
  callerUid: string,
  input: GetLeaderboardInput = {},
): Promise<LeaderboardResult> {
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LEADERBOARD_LIMIT, 1), MAX_LEADERBOARD_LIMIT)

  const me = await repo.getGamification(callerUid)

  const [top, ahead, totalRanked] = await Promise.all([
    repo.topByPoints(limit),
    repo.countAhead(me?.points ?? 0),
    repo.countRanked(),
  ])

  const entries = top.map((doc, i) => toEntry(doc, i + 1, callerUid))
  const mine = entries.find((entry) => entry.isYou)

  return {
    entries,
    you: mine ?? (me ? toEntry(me, ahead + 1, callerUid) : null),
    totalRanked,
  }
}

/** The badge catalog, so the client can show locked badges and what earns them. */
export async function getBadgeCatalog(): Promise<{
  badges: Array<
    ReturnType<typeof badgeCatalogForClient>[number] & {
      earnedCount: number | null
      earnedPct: number | null
    }
  >
  total: number
}> {
  // Rarity comes from the cohort rollup, so it is as fresh as the last
  // aggregation run (nightly, or whenever an admin refreshes). Null, not
  // zero, when that rollup has never been built: "nobody has this" and
  // "nobody has counted yet" are different statements and the shelf
  // should only make the first one when it is true.
  let distribution: Array<{ badgeId: string; earnedCount: number; earnedPct: number }> = []
  try {
    distribution = await repo.getBadgeDistribution()
  } catch {
    distribution = []
  }
  const byId = new Map(distribution.map((row) => [row.badgeId, row]))

  return {
    badges: badgeCatalogForClient().map((badge) => {
      const row = byId.get(badge.id)
      return {
        ...badge,
        earnedCount: row ? row.earnedCount : null,
        earnedPct: row ? row.earnedPct : null,
      }
    }),
    total: BADGES.length,
  }
}
