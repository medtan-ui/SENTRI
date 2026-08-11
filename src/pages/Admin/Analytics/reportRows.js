/**
 * reportRows.js
 * Shapes the analytics aggregates into CSV row sets. Pure functions —
 * given the same summary documents they always produce the same rows, so
 * the exports are unit-testable without a browser, a download, or
 * Firestore.
 *
 * Nothing here computes a statistic. Every cell is a field copied out of a
 * server-computed document (see functions/src/modules/analytics/metrics.ts
 * for where each one is actually derived); the only transformation allowed
 * is formatting a null into a readable blank.
 */

/** A missing statistic reads as blank, never as 0 — a 0 would be a claim. */
function cell(value) {
  return value === null || value === undefined ? '' : value
}

function gainCell(gain) {
  return gain === null || gain === undefined ? '' : gain.toFixed(2)
}

/**
 * Stored assessment types, in the words the rest of the app uses.
 *
 * `posttest` is the stored value for the end-of-curriculum final
 * assessment: its per-question rows are written under that type so the
 * pre/post item analysis keeps comparing identical items without a change
 * to any query. Exporting the raw value would put a word in the paper for
 * an artefact that no longer exists as a student-facing thing.
 */
const ASSESSMENT_LABELS = {
  pretest: 'Pre-test',
  quiz: 'Quiz',
  posttest: 'Final assessment',
}

function assessmentLabel(type) {
  return ASSESSMENT_LABELS[type] ?? type ?? ''
}

/**
 * The one-page cohort summary: the figures the capstone's own objectives
 * are reported against, as label/value pairs rather than a wide table,
 * because that is the shape they get pasted into a document as.
 * @param {object} cohort aggregateCohortAnalytics result
 * @returns {Array<Array<unknown>>}
 */
export function cohortSummaryRows(cohort) {
  if (!cohort) return [['Metric', 'Value'], ['No cohort data', 'Not yet aggregated']]

  const b = cohort.behaviour || {}
  const t = cohort.transfer || {}

  return [
    ['Metric', 'Value'],
    ['Students in scope', cell(cohort.totalStudents)],
    ['Students with activity', cell(cohort.activeStudents)],
    ['Students who finished every module', cell(cohort.studentsCompletedAll)],
    ['Average modules completed', cell(cohort.avgModulesCompleted)],
    ['Average pre-test score (%)', cell(cohort.avgPreTestScore)],
    ['Average final assessment score (%)', cell(cohort.avgPostTestScore)],
    ['Normalized gain (Hake g)', gainCell(cohort.normalizedGain)],
    ['Students with both a pre-test and a final assessment', cell(cohort.pairedCount)],
    ['First-attempt safe rate (%)', cell(b.firstAttemptSafeRate)],
    ['Consequence trigger rate (%)', cell(b.consequenceTriggerRate)],
    ['Total simulation decisions', cell(b.totalDecisions)],
    [
      'Median time to decide (s)',
      b.medianTimeToDecideMs === null || b.medianTimeToDecideMs === undefined
        ? ''
        : Math.round(b.medianTimeToDecideMs / 1000),
    ],
    ['Risky choices made faster than the median', cell(b.fastWrongCount)],
    ['Risky choices made slower than the median', cell(b.slowWrongCount)],
    ['Behavioural transfer (percentage points, late vs. early)', cell(t.behaviouralTransfer)],
  ]
}

/**
 * Per-module completion and gain, in curriculum order — the table an
 * instructor scans to find which module a class is stuck on.
 * @param {object} cohort
 * @returns {Array<Array<unknown>>}
 */
export function moduleBreakdownRows(cohort) {
  const header = [
    'Order',
    'Module ID',
    'Module',
    'Students started',
    'Students completed',
    'Completion rate (%)',
    'Average quiz score (%)',
    'Normalized gain',
    'First-attempt safe rate (%)',
  ]
  const points = cohort?.moduleBreakdown || []
  return [
    header,
    ...points.map((p) => [
      p.moduleOrder,
      p.moduleId,
      p.title,
      p.studentsStarted,
      p.studentsCompleted,
      p.completionRate,
      p.avgScore,
      gainCell(p.normalizedGain),
      cell(p.firstAttemptSafeRate),
    ]),
  ]
}

/**
 * Per-topic mastery at each measurement point. Cohort-level, so this is
 * the "what does the class still not understand" table.
 * @param {object} cohort
 * @returns {Array<Array<unknown>>}
 */
export function topicMasteryRows(cohort) {
  const header = [
    'Topic',
    'Pre-test correct (%)',
    'Final assessment correct (%)',
    'Quiz correct (%)',
    'Gain (percentage points)',
    'Pre-test responses',
    'Final assessment responses',
    'Quiz responses',
  ]
  const topics = cohort?.topicMastery || []
  return [
    header,
    ...topics.map((t) => [
      t.topic,
      t.preCorrectRate,
      t.postCorrectRate,
      t.quizCorrectRate,
      cell(t.gain),
      t.preCount,
      t.postCount,
      t.quizCount,
    ]),
  ]
}

/**
 * Item analysis across every module, hardest item first. The
 * discrimination column stays blank rather than reading 0 when it is
 * suppressed for want of attempts — a 0 would say "this item does not
 * discriminate", which is a much stronger claim than "we can't tell yet",
 * and the two adjacent columns say exactly how far off the threshold it is.
 *
 * @param {Array<{ id: string, name: string }>} modules
 * @param {Record<string, object>} summaries moduleId -> moduleAnalytics doc
 * @returns {Array<Array<unknown>>}
 */
export function itemAnalysisRows(modules, summaries) {
  const header = [
    'Module',
    'Assessment',
    'Question ID',
    'Topic',
    'Responses',
    'Correct',
    'Difficulty (p)',
    'Difficulty label',
    'Discrimination (D)',
    'Attempts on record',
    'Attempts needed for D',
    'Median time (s)',
  ]

  const rows = []
  modules.forEach((m) => {
    const items = summaries?.[m.id]?.itemAnalysis || []
    items.forEach((item) => {
      rows.push([
        m.name,
        assessmentLabel(item.assessmentType),
        item.questionId,
        item.topic || '',
        item.responses,
        item.correct,
        item.difficulty,
        item.difficultyLabel,
        item.discrimination === null || item.discrimination === undefined
          ? ''
          : item.discrimination.toFixed(2),
        cell(item.attemptCount),
        cell(item.minAttemptsForDiscrimination),
        item.medianDurationMs === null || item.medianDurationMs === undefined
          ? ''
          : Math.round(item.medianDurationMs / 1000),
      ])
    })
  })

  return [header, ...rows]
}

/**
 * Where each item's answers actually went, one row per choice.
 *
 * A separate table rather than extra columns on the item analysis, for a
 * plain reason: items have different numbers of choices, so packing them
 * across a fixed set of columns would either truncate or leave most cells
 * empty. One row per choice is the shape that sorts, filters and pivots.
 *
 * The column an instructor is really looking for is the one where "Is
 * key" reads no and "Times chosen" beats the keyed row — that is a
 * distractor outdrawing the answer, which is a wording problem far more
 * often than a knowledge gap.
 *
 * @param {Array<{ id: string, name: string }>} modules
 * @param {Record<string, object>} summaries moduleId -> moduleAnalytics doc
 * @returns {Array<Array<unknown>>}
 */
export function distractorRows(modules, summaries) {
  const header = [
    'Module',
    'Assessment',
    'Question ID',
    'Topic',
    'Choice ID',
    'Choice text',
    'Is key',
    'Times chosen',
    'Share of responses (%)',
  ]

  const rows = []
  modules.forEach((m) => {
    const items = summaries?.[m.id]?.itemAnalysis || []
    items.forEach((item) => {
      ;(item.choiceDistribution || []).forEach((choice) => {
        rows.push([
          m.name,
          assessmentLabel(item.assessmentType),
          item.questionId,
          item.topic || '',
          choice.choiceId,
          // Blank, not the id again: the id is already its own column, and
          // repeating it here would read as if that were the choice text.
          choice.text || '',
          choice.isCorrect ? 'yes' : 'no',
          cell(choice.count),
          cell(choice.rate),
        ])
      })
    })
  })

  return [header, ...rows]
}

/**
 * Daily activity over the trailing window. Exported as its own file
 * because a time series pasted next to a summary table is the one thing
 * spreadsheets handle badly.
 * @param {object} cohort
 * @returns {Array<Array<unknown>>}
 */
export function activityTrendRows(cohort) {
  const header = ['Date', 'Modules completed', 'Quizzes submitted', 'Active students']
  const points = cohort?.completionTrend || []
  return [header, ...points.map((p) => [p.date, p.modulesCompleted, p.quizzesSubmitted, p.activeStudents])]
}
