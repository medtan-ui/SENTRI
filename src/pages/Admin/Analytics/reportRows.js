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
    ['Average post-test score (%)', cell(cohort.avgPostTestScore)],
    ['Normalized gain (Hake g)', gainCell(cohort.normalizedGain)],
    ['Students with a paired pre/post', cell(cohort.pairedCount)],
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
    'Post-test correct (%)',
    'Quiz correct (%)',
    'Gain (percentage points)',
    'Pre-test responses',
    'Post-test responses',
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
        item.assessmentType,
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
