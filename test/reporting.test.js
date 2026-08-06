import { describe, expect, it } from 'vitest'
import { toCsv } from '../src/utils/exportCsv'
import {
  activityTrendRows,
  cohortSummaryRows,
  itemAnalysisRows,
  moduleBreakdownRows,
  topicMasteryRows,
} from '../src/pages/Admin/Analytics/reportRows'

/**
 * Report export — where a quiet wrong answer produces a confidently wrong
 * document rather than a visible failure.
 */

describe('toCsv', () => {
  it('quotes fields containing a comma, so a label cannot split a column', () => {
    expect(toCsv([['BSIT-3A, evening', 12]])).toBe('"BSIT-3A, evening",12')
  })

  it('doubles embedded quotes rather than terminating the field', () => {
    expect(toCsv([['He said "hi"']])).toBe('"He said ""hi"""')
  })

  it('writes an empty cell for a missing value, never the string null', () => {
    expect(toCsv([[null, undefined, 0]])).toBe(',,0')
  })

  it('separates rows with CRLF, which is what spreadsheets expect', () => {
    expect(toCsv([['a'], ['b']])).toBe('a\r\nb')
  })
})

describe('report rows', () => {
  const cohort = {
    totalStudents: 30,
    activeStudents: 24,
    studentsCompletedAll: 5,
    avgModulesCompleted: 3.2,
    avgPreTestScore: 48,
    avgPostTestScore: 76,
    normalizedGain: 0.538,
    pairedCount: 21,
    behaviour: {
      totalDecisions: 400,
      firstAttemptSafeRate: 62,
      consequenceTriggerRate: 31,
      medianTimeToDecideMs: 8400,
      fastWrongCount: 70,
      slowWrongCount: 54,
    },
    transfer: { behaviouralTransfer: 9, byModule: [], sharedTopics: [] },
    topicMastery: [
      { topic: 'public-wifi', preCorrectRate: 40, postCorrectRate: 80, quizCorrectRate: 72, gain: 40, preCount: 20, postCount: 20, quizCount: 25 },
      { topic: 'mfa', preCorrectRate: 55, postCorrectRate: 85, quizCorrectRate: 80, gain: null, preCount: 0, postCount: 20, quizCount: 25 },
    ],
    moduleBreakdown: [
      { moduleId: 'password-security', moduleOrder: 1, title: 'Password Security', studentsStarted: 24, studentsCompleted: 18, completionRate: 75, avgScore: 81, normalizedGain: 0.51, firstAttemptSafeRate: 66 },
      { moduleId: 'online-safety', moduleOrder: 6, title: 'Online Safety', studentsStarted: 8, studentsCompleted: 2, completionRate: 25, avgScore: 74, normalizedGain: null, firstAttemptSafeRate: null },
    ],
    completionTrend: [
      { date: '2026-08-01', modulesCompleted: 3, quizzesSubmitted: 5, activeStudents: 4 },
      { date: '2026-08-02', modulesCompleted: 0, quizzesSubmitted: 0, activeStudents: 0 },
    ],
  }

  it('leads with the population the export was computed over', () => {
    expect(cohortSummaryRows(cohort)[1]).toEqual(['Students in scope', 30])
  })

  it('converts the median decision time to whole seconds', () => {
    const row = cohortSummaryRows(cohort).find((r) => r[0] === 'Median time to decide (s)')
    expect(row[1]).toBe(8)
  })

  it('exports an unmeasurable gain as blank, never as zero', () => {
    // A 0 in this column would claim "no learning happened"; the honest
    // reading of a null is "not measurable yet".
    const rows = moduleBreakdownRows(cohort)
    const onlineSafety = rows.find((r) => r[1] === 'online-safety')
    expect(onlineSafety[7]).toBe('')
    expect(onlineSafety[8]).toBe('')

    const passwordSecurity = rows.find((r) => r[1] === 'password-security')
    expect(passwordSecurity[7]).toBe('0.51')
  })

  it('keeps a topic with no paired pre/post rather than dropping it', () => {
    const rows = topicMasteryRows(cohort)
    const mfa = rows.find((r) => r[0] === 'mfa')
    expect(mfa).toBeDefined()
    expect(mfa[4]).toBe('')
  })

  it('emits header-only tables instead of throwing on a never-aggregated cohort', () => {
    expect(moduleBreakdownRows(null)).toHaveLength(1)
    expect(topicMasteryRows(undefined)).toHaveLength(1)
    expect(activityTrendRows(null)).toHaveLength(1)
    expect(cohortSummaryRows(null)[0]).toEqual(['Metric', 'Value'])
  })

  it('exports a suppressed discrimination as blank, with the shortfall alongside it', () => {
    const modules = [{ id: 'password-security', name: 'Password Security' }]
    const summaries = {
      'password-security': {
        itemAnalysis: [
          {
            questionId: 'q1',
            assessmentType: 'quiz',
            topic: 'mfa',
            responses: 4,
            correct: 1,
            difficulty: 0.25,
            difficultyLabel: 'Very hard',
            discrimination: null,
            attemptCount: 4,
            minAttemptsForDiscrimination: 10,
            medianDurationMs: 12000,
          },
        ],
      },
    }
    const [, row] = itemAnalysisRows(modules, summaries)
    expect(row[8]).toBe('')
    expect(row[9]).toBe(4)
    expect(row[10]).toBe(10)
    expect(row[11]).toBe(12)
  })

  it('skips modules that have never been aggregated instead of failing the export', () => {
    const modules = [
      { id: 'password-security', name: 'Password Security' },
      { id: 'online-safety', name: 'Online Safety' },
    ]
    expect(itemAnalysisRows(modules, {})).toHaveLength(1)
  })
})
