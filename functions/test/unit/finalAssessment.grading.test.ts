/**
 * Unit tests for the end-of-curriculum final assessment's pure logic.
 *
 * This replaced six per-module post-tests with one test at the end, which
 * moved the learning-gain arithmetic from "one gain per module" to "one
 * gain per student, against the average of their six pre-tests". These
 * tests pin the boundaries where that average, or the gain derived from
 * it, could be silently misreported — which is exactly the number the
 * project's "did awareness improve?" claim rests on.
 */
import {
  averagePreTestScore,
  gradeFinalAssessment,
  normalizedGain,
} from '../../src/modules/finalAssessment/service'
import { FinalAssessmentConfig } from '../../src/modules/finalAssessment/models'

const config: FinalAssessmentConfig = {
  title: 'SENTRI Final Assessment',
  settings: {
    passingScore: 75,
    instructions: '',
    available: true,
    attemptsAllowed: 2,
  },
  questions: [
    {
      id: 'q1',
      order: 1,
      text: 'What makes a password stronger?',
      choices: [
        { id: 'q1c1', text: 'Being long and unique' },
        { id: 'q1c2', text: 'Adding a symbol' },
      ],
      correctChoiceId: 'q1c1',
      explanation: 'Length and uniqueness beat symbol substitution.',
      difficulty: 'Medium',
      topic: 'password-strength',
      sourceModuleId: 'password-security',
    },
    {
      id: 'q2',
      order: 2,
      text: 'Is a mismatched sender domain a phishing sign?',
      choices: [
        { id: 'q2c1', text: 'Yes' },
        { id: 'q2c2', text: 'No' },
      ],
      correctChoiceId: 'q2c1',
      explanation: 'Mismatched domains are among the most reliable signs.',
      difficulty: 'Medium',
      topic: 'sender-domain',
      sourceModuleId: 'phishing-awareness',
    },
  ],
}

describe('normalizedGain', () => {
  it('reports the share of available headroom that was closed', () => {
    expect(normalizedGain(40, 70)).toBeCloseTo(0.5, 2)
  })

  it('returns null for a perfect pre-test, where the ratio is undefined', () => {
    // Not zero: a student who already knew everything didn't fail to
    // improve, there was simply nothing left to improve on.
    expect(normalizedGain(100, 100)).toBeNull()
  })

  it('reports a regression as a negative gain', () => {
    expect(normalizedGain(80, 40)).toBeLessThan(0)
  })

  it('clamps to [-1, 1] so a single result cannot dominate a cohort average', () => {
    expect(normalizedGain(0, 100)).toBe(1)
    expect(normalizedGain(99, 0)).toBe(-1)
  })
})

describe('averagePreTestScore', () => {
  it('averages every pre-test the student actually took', () => {
    expect(averagePreTestScore([40, 60, 80])).toBe(60)
  })

  it('ignores modules with no pre-test rather than counting them as zero', () => {
    // The distinction that matters: a skipped pre-test is missing data,
    // not evidence the student knew nothing. Counting it as 0 would
    // manufacture an inflated gain.
    expect(averagePreTestScore([80, null, undefined, 100])).toBe(90)
  })

  it('returns null when there is no pre-test at all', () => {
    expect(averagePreTestScore([null, undefined])).toBeNull()
    expect(averagePreTestScore([])).toBeNull()
  })

  it('rounds to a whole percentage', () => {
    expect(averagePreTestScore([40, 41])).toBe(41)
  })
})

describe('gradeFinalAssessment', () => {
  it('scores a fully correct submission as 100', () => {
    const result = gradeFinalAssessment(config, { q1: 'q1c1', q2: 'q2c1' })
    expect(result.score).toBe(100)
    expect(result.correctCount).toBe(2)
    expect(result.total).toBe(2)
  })

  it('treats an unanswered question as wrong, not as absent', () => {
    const result = gradeFinalAssessment(config, { q1: 'q1c1' })
    expect(result.score).toBe(50)
    const unanswered = result.perQuestionResults.find((r) => r.questionId === 'q2')
    expect(unanswered?.selectedChoiceId).toBeNull()
    expect(unanswered?.correct).toBe(false)
  })

  it('carries each item back to the module it was seeded from', () => {
    // This is what keeps per-module and per-topic analysis working now
    // that there is one assessment instead of six post-tests — every
    // response row is attributable to the module its item came from.
    const result = gradeFinalAssessment(config, { q1: 'q1c1', q2: 'q2c2' })
    expect(result.perQuestionResults.map((r) => r.sourceModuleId)).toEqual([
      'password-security',
      'phishing-awareness',
    ])
    expect(result.perQuestionResults.map((r) => r.topic)).toEqual(['password-strength', 'sender-domain'])
  })

  it('records a duration only for questions that reported one', () => {
    const result = gradeFinalAssessment(config, { q1: 'q1c1', q2: 'q2c1' }, { q1: 4200 })
    expect(result.perQuestionResults.find((r) => r.questionId === 'q1')?.durationMs).toBe(4200)
    // Null, never 0 — an unmeasured item must not drag a cohort's average
    // time-to-answer down as though it were answered instantly.
    expect(result.perQuestionResults.find((r) => r.questionId === 'q2')?.durationMs).toBeNull()
  })

  it('scores an empty question set as 0 without dividing by zero', () => {
    const empty: FinalAssessmentConfig = { ...config, questions: [] }
    expect(gradeFinalAssessment(empty, {}).score).toBe(0)
  })
})
