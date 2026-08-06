/**
 * Unit tests for the Learning Analytics framework's statistics.
 *
 * These are pure functions by design (no Firestore), so the maths behind
 * every reported figure — normalized gain, item difficulty and
 * discrimination, the Kirkpatrick Level 3 behaviour measures, and
 * transfer — is testable directly. The cases below focus on the ways each
 * metric can be quietly wrong rather than on happy paths: missing pairs
 * counted as zeros, unmeasured durations averaged in, an item split on
 * too few attempts.
 */
import {
  behaviourMetrics,
  cohortNormalizedGain,
  itemAnalysis,
  topicMastery,
  transferAnalysis,
  type DecisionRow,
  type ResponseRow,
} from '../../src/modules/analytics/metrics'

describe('cohortNormalizedGain', () => {
  it('averages individual gains, not the gain of the averages', () => {
    // Two students with very different starting points. The gain of the
    // averages would be (75-40)/(100-40) = 0.58; the average of
    // individual gains is (0.5 + 0.75)/2 = 0.63. The latter is what
    // "did students improve" actually asks.
    const result = cohortNormalizedGain([
      { pre: 20, post: 60 }, // (60-20)/80  = 0.5
      { pre: 60, post: 90 }, // (90-60)/40  = 0.75
    ])
    expect(result.normalizedGain).toBeCloseTo(0.63, 2)
    expect(result.pairedCount).toBe(2)
  })

  it('excludes unpaired students instead of scoring them as zero gain', () => {
    const result = cohortNormalizedGain([
      { pre: 40, post: 80 },
      { pre: 50, post: null },
      { pre: null, post: 90 },
      { pre: undefined, post: undefined },
    ])
    expect(result.pairedCount).toBe(1)
    expect(result.normalizedGain).toBeCloseTo(0.67, 2)
  })

  it('excludes a perfect pre-test, where the gain ratio is undefined', () => {
    const result = cohortNormalizedGain([{ pre: 100, post: 100 }])
    // Still a paired result for reporting, but it contributes no gain.
    expect(result.pairedCount).toBe(1)
    expect(result.normalizedGain).toBeNull()
  })

  it('reports a negative gain rather than clamping it to zero', () => {
    const result = cohortNormalizedGain([{ pre: 80, post: 40 }])
    expect(result.normalizedGain).toBeLessThan(0)
  })

  it('returns nulls, not NaN, with no data at all', () => {
    const result = cohortNormalizedGain([])
    expect(result).toEqual({ avgPre: 0, avgPost: 0, normalizedGain: null, pairedCount: 0 })
  })
})

describe('topicMastery', () => {
  const responses: ResponseRow[] = [
    { topic: 'mfa', assessmentType: 'pretest', isCorrect: false },
    { topic: 'mfa', assessmentType: 'pretest', isCorrect: false },
    { topic: 'mfa', assessmentType: 'posttest', isCorrect: true },
    { topic: 'mfa', assessmentType: 'posttest', isCorrect: true },
    { topic: 'mfa', assessmentType: 'quiz', isCorrect: true },
    { topic: 'ransomware', assessmentType: 'quiz', isCorrect: false },
  ]

  it('reports pre, post, and quiz rates separately per topic', () => {
    const [mfa] = topicMastery(responses).filter((t) => t.topic === 'mfa')
    expect(mfa.preCorrectRate).toBe(0)
    expect(mfa.postCorrectRate).toBe(100)
    expect(mfa.quizCorrectRate).toBe(100)
    expect(mfa.gain).toBe(100)
  })

  it('leaves gain null for a topic measured at only one point', () => {
    const [ransomware] = topicMastery(responses).filter((t) => t.topic === 'ransomware')
    expect(ransomware.gain).toBeNull()
  })

  it('ignores untagged responses rather than bucketing them together', () => {
    const result = topicMastery([{ assessmentType: 'quiz', isCorrect: true }])
    expect(result).toEqual([])
  })
})

describe('itemAnalysis', () => {
  it('computes difficulty as the proportion answering correctly', () => {
    const responses: ResponseRow[] = [
      { attemptId: 'a', questionId: 'q1', assessmentType: 'quiz', isCorrect: true },
      { attemptId: 'b', questionId: 'q1', assessmentType: 'quiz', isCorrect: false },
      { attemptId: 'c', questionId: 'q1', assessmentType: 'quiz', isCorrect: false },
      { attemptId: 'd', questionId: 'q1', assessmentType: 'quiz', isCorrect: false },
    ]
    const [item] = itemAnalysis(responses)
    expect(item.difficulty).toBe(0.25)
    expect(item.difficultyLabel).toBe('Very hard')
  })

  it('leaves discrimination null below the minimum attempt count', () => {
    const responses: ResponseRow[] = Array.from({ length: 4 }, (_, i) => ({
      attemptId: `a${i}`,
      questionId: 'q1',
      assessmentType: 'quiz',
      isCorrect: i % 2 === 0,
    }))
    const [item] = itemAnalysis(responses)
    expect(item.discrimination).toBeNull()
  })

  it('reports how short of the threshold a suppressed discrimination is', () => {
    // A null D has to be distinguishable from a failed computation, or the
    // dashboard can only say "n/a" and leave an instructor guessing.
    const responses: ResponseRow[] = Array.from({ length: 4 }, (_, i) => ({
      attemptId: `a${i}`,
      questionId: 'q1',
      assessmentType: 'quiz',
      isCorrect: i % 2 === 0,
    }))
    const [item] = itemAnalysis(responses)
    expect(item.attemptCount).toBe(4)
    expect(item.minAttemptsForDiscrimination).toBe(10)
    expect(item.attemptCount).toBeLessThan(item.minAttemptsForDiscrimination)
  })

  it('gives a well-behaved item positive discrimination', () => {
    // 20 attempts of a 2-item test. On q1, high scorers answer correctly
    // and low scorers don't — exactly what a discriminating item does.
    const responses: ResponseRow[] = []
    for (let i = 0; i < 20; i += 1) {
      const strong = i < 10
      responses.push(
        { attemptId: `a${i}`, questionId: 'q1', assessmentType: 'quiz', isCorrect: strong },
        { attemptId: `a${i}`, questionId: 'q2', assessmentType: 'quiz', isCorrect: strong },
      )
    }
    const q1 = itemAnalysis(responses).find((item) => item.questionId === 'q1')!
    expect(q1.discrimination).toBeGreaterThan(0.5)
  })

  it('keeps assessment types apart so a pre-test item is not merged with its quiz twin', () => {
    const responses: ResponseRow[] = [
      { attemptId: 'a', questionId: 'q1', assessmentType: 'pretest', isCorrect: false },
      { attemptId: 'b', questionId: 'q1', assessmentType: 'posttest', isCorrect: true },
    ]
    const result = itemAnalysis(responses)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.assessmentType).sort()).toEqual(['posttest', 'pretest'])
  })

  it('ignores unmeasured durations when taking the median', () => {
    const responses: ResponseRow[] = [
      { attemptId: 'a', questionId: 'q1', assessmentType: 'quiz', isCorrect: true, durationMs: 4000 },
      { attemptId: 'b', questionId: 'q1', assessmentType: 'quiz', isCorrect: true, durationMs: null },
      { attemptId: 'c', questionId: 'q1', assessmentType: 'quiz', isCorrect: true, durationMs: 6000 },
    ]
    const [item] = itemAnalysis(responses)
    expect(item.medianDurationMs).toBe(5000)
  })
})

describe('behaviourMetrics', () => {
  const decisions: DecisionRow[] = [
    { isSafeChoice: false, attemptNumber: 1, durationMs: 1000 },
    { isSafeChoice: true, attemptNumber: 2, durationMs: 9000 },
    { isSafeChoice: true, attemptNumber: 1, durationMs: 5000 },
    { isSafeChoice: false, attemptNumber: 1, durationMs: 8000 },
  ]

  it('measures first-attempt safety only over first attempts', () => {
    const result = behaviourMetrics(decisions)
    // Three first attempts; one of them was safe.
    expect(result.firstAttemptCount).toBe(3)
    expect(result.firstAttemptSafeRate).toBe(33)
  })

  it('is not inflated by a retry that eventually succeeds', () => {
    // Every scenario ends safely in the engine, so an eventual-success
    // rate would always read 100%. First-attempt rate must not.
    const result = behaviourMetrics([
      { isSafeChoice: false, attemptNumber: 1 },
      { isSafeChoice: true, attemptNumber: 2 },
    ])
    expect(result.firstAttemptSafeRate).toBe(0)
  })

  it('splits risky choices into fast-wrong and slow-wrong around the median', () => {
    const result = behaviourMetrics(decisions)
    expect(result.medianTimeToDecideMs).toBe(6500)
    expect(result.fastWrongCount).toBe(1) // the 1000ms risky choice
    expect(result.slowWrongCount).toBe(1) // the 8000ms risky choice
  })

  it('reports the consequence trigger rate over all decisions', () => {
    expect(behaviourMetrics(decisions).consequenceTriggerRate).toBe(50)
  })

  it('returns null timings rather than zero when nothing was measured', () => {
    const result = behaviourMetrics([{ isSafeChoice: true, attemptNumber: 1 }])
    expect(result.medianTimeToDecideMs).toBeNull()
    expect(result.avgTimeToDecideMs).toBeNull()
    expect(result.fastWrongCount).toBe(0)
  })

  it('handles an empty decision set without dividing by zero', () => {
    const result = behaviourMetrics([])
    expect(result.firstAttemptSafeRate).toBe(0)
    expect(result.consequenceTriggerRate).toBe(0)
  })
})

describe('transferAnalysis', () => {
  const moduleOrder = { 'safe-browsing': 4, 'online-safety': 6, 'password-security': 1 }

  it('orders per-module behaviour by curriculum position, not insertion order', () => {
    const decisions: DecisionRow[] = [
      { moduleId: 'online-safety', isSafeChoice: true, attemptNumber: 1 },
      { moduleId: 'password-security', isSafeChoice: false, attemptNumber: 1 },
    ]
    const result = transferAnalysis(decisions, [], moduleOrder)
    expect(result.byModule.map((p) => p.moduleId)).toEqual(['password-security', 'online-safety'])
  })

  it('reports positive behavioural transfer when later modules start safer', () => {
    const decisions: DecisionRow[] = [
      { moduleId: 'password-security', isSafeChoice: false, attemptNumber: 1 },
      { moduleId: 'password-security', isSafeChoice: false, attemptNumber: 1 },
      { moduleId: 'online-safety', isSafeChoice: true, attemptNumber: 1 },
      { moduleId: 'online-safety', isSafeChoice: true, attemptNumber: 1 },
    ]
    const result = transferAnalysis(decisions, [], moduleOrder)
    expect(result.behaviouralTransfer).toBe(100)
  })

  it('pairs a topic measured in two modules, earlier module first', () => {
    const responses: ResponseRow[] = [
      { moduleId: 'safe-browsing', topic: 'public-wifi', isCorrect: false },
      { moduleId: 'safe-browsing', topic: 'public-wifi', isCorrect: false },
      { moduleId: 'online-safety', topic: 'public-wifi', isCorrect: true },
      { moduleId: 'online-safety', topic: 'public-wifi', isCorrect: true },
    ]
    const [shared] = transferAnalysis([], responses, moduleOrder).sharedTopics
    expect(shared.topic).toBe('public-wifi')
    expect(shared.earlierModuleId).toBe('safe-browsing')
    expect(shared.laterModuleId).toBe('online-safety')
    expect(shared.delta).toBe(100)
  })

  it('ignores topics that only appear in one module', () => {
    const responses: ResponseRow[] = [
      { moduleId: 'safe-browsing', topic: 'scam-sites', isCorrect: true },
    ]
    expect(transferAnalysis([], responses, moduleOrder).sharedTopics).toEqual([])
  })

  it('leaves behavioural transfer null with only one module of data', () => {
    const result = transferAnalysis(
      [{ moduleId: 'password-security', isSafeChoice: true, attemptNumber: 1 }],
      [],
      moduleOrder,
    )
    expect(result.behaviouralTransfer).toBeNull()
  })
})
