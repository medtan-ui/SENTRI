/**
 * Unit tests for pre/post-test grading and normalized gain.
 *
 * Grading moved server-side specifically so a client can't influence a
 * reported learning gain, so these tests care most about the boundaries
 * where a gain could be silently misreported: a perfect pre-test, a
 * regression, an unanswered item, and an unmeasured duration.
 */
import { gradeAssessment, normalizedGain } from '../../src/modules/assessment/service'
import { AssessmentConfig } from '../../src/modules/assessment/models'

const config: AssessmentConfig = {
  moduleId: 'password-security',
  title: 'Password Security — Pre-Test',
  questions: [
    {
      id: 'q1',
      text: 'What makes a password stronger?',
      choices: [
        { id: 'q1c1', text: 'Being long and unique' },
        { id: 'q1c2', text: 'Adding a symbol at the end' },
      ],
      correctChoiceId: 'q1c1',
      explanation: 'Length and uniqueness dominate.',
      topic: 'password-strength',
    },
    {
      id: 'q2',
      text: 'Is password reuse safe?',
      choices: [
        { id: 'q2c1', text: 'Yes' },
        { id: 'q2c2', text: 'No' },
      ],
      correctChoiceId: 'q2c2',
      explanation: 'One breach exposes every account reusing it.',
      topic: 'password-reuse',
    },
  ],
}

describe('normalizedGain', () => {
  it('reports the share of available headroom that was closed', () => {
    expect(normalizedGain(40, 70)).toBeCloseTo(0.5, 2)
  })

  it('returns null for a perfect pre-test, where the ratio is undefined', () => {
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

describe('gradeAssessment', () => {
  it('grades against the stored answer key and scores as a percentage', () => {
    const result = gradeAssessment(config, { q1: 'q1c1', q2: 'q2c2' })
    expect(result.correctCount).toBe(2)
    expect(result.total).toBe(2)
    expect(result.score).toBe(100)
  })

  it('marks an unanswered question wrong rather than skipping it', () => {
    const result = gradeAssessment(config, { q1: 'q1c1' })
    expect(result.score).toBe(50)
    const q2 = result.perQuestionResults.find((r) => r.questionId === 'q2')!
    expect(q2.selectedChoiceId).toBeNull()
    expect(q2.correct).toBe(false)
  })

  it('carries each item topic through, so responses stay analysable', () => {
    const result = gradeAssessment(config, { q1: 'q1c1', q2: 'q2c1' })
    expect(result.perQuestionResults.map((r) => r.topic)).toEqual(['password-strength', 'password-reuse'])
  })

  it('records an unmeasured duration as null, never as zero', () => {
    const result = gradeAssessment(config, { q1: 'q1c1', q2: 'q2c2' }, { q1: 4200 })
    const [q1, q2] = result.perQuestionResults
    expect(q1.durationMs).toBe(4200)
    expect(q2.durationMs).toBeNull()
  })

  it('rejects a negative duration rather than storing it', () => {
    const result = gradeAssessment(config, { q1: 'q1c1' }, { q1: -50 })
    expect(result.perQuestionResults[0].durationMs).toBeNull()
  })

  it('scores an empty item bank as 0 without dividing by zero', () => {
    const result = gradeAssessment({ ...config, questions: [] }, {})
    expect(result.score).toBe(0)
    expect(result.total).toBe(0)
  })
})
