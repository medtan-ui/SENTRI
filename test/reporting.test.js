import { describe, expect, it } from 'vitest'
import { cohortDocId, normalizeSectionKey } from '../src/utils/sections'
import { filenameSlug, toCsv } from '../src/utils/exportCsv'
import {
  activityTrendRows,
  cohortSummaryRows,
  itemAnalysisRows,
  moduleBreakdownRows,
  topicMasteryRows,
} from '../src/pages/Admin/Analytics/reportRows'

/**
 * Cohort segmentation and report export — the two places where a quiet
 * wrong answer produces a confidently wrong document rather than a
 * visible failure.
 *
 * The section helpers have a second, sharper reason to be tested here:
 * they are a deliberate duplication of functions/src/shared/sections.ts,
 * so the cases below are written against the same inputs the backend test
 * uses. A drift between the two would mean the frontend reads one
 * section's rollup under a different section's name — silently.
 */

describe('normalizeSectionKey', () => {
  it('treats case and separator variations as one section', () => {
    const variants = ['BSIT-3A', 'bsit 3a', 'BSIT_3A', '  bsit-3a  ', 'BSIT--3A']
    const keys = new Set(variants.map(normalizeSectionKey))
    expect(keys).toEqual(new Set(['bsit-3a']))
  })

  it('collapses every flavour of "no section" to null', () => {
    expect(normalizeSectionKey(null)).toBeNull()
    expect(normalizeSectionKey(undefined)).toBeNull()
    expect(normalizeSectionKey('')).toBeNull()
    expect(normalizeSectionKey('   ')).toBeNull()
    // Punctuation alone carries no identity — it would otherwise produce a
    // section keyed on the empty string.
    expect(normalizeSectionKey('---')).toBeNull()
    expect(normalizeSectionKey(42)).toBeNull()
  })
})

describe('cohortDocId', () => {
  it('sends an absent section to the whole-cohort document', () => {
    expect(cohortDocId(null)).toBe('current')
    expect(cohortDocId('')).toBe('current')
  })

  it('gives a section its own document, stable across how it was typed', () => {
    expect(cohortDocId('BSIT-3A')).toBe('section__bsit-3a')
    expect(cohortDocId('bsit 3a')).toBe(cohortDocId('BSIT-3A'))
  })

  it('never produces a document id containing a path separator', () => {
    expect(cohortDocId('BSIT-3A / evening')).not.toContain('/')
  })
})

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

describe('filenameSlug', () => {
  it('falls back to a named scope rather than an empty filename', () => {
    expect(filenameSlug(null)).toBe('all-sections')
    expect(filenameSlug('///')).toBe('all-sections')
  })

  it('strips characters that would break a download path', () => {
    expect(filenameSlug('BSIT-3A / evening')).toBe('bsit-3a-evening')
  })
})

describe('report rows', () => {
  const cohort = {
    section: 'BSIT-3A',
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

  it('names the scope a cohort export was computed over', () => {
    const rows = cohortSummaryRows(cohort)
    expect(rows[1]).toEqual(['Section', 'BSIT-3A'])
    expect(cohortSummaryRows({ ...cohort, section: null })[1]).toEqual(['Section', 'All sections'])
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
