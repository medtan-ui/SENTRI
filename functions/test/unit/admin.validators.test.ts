import {
  validateQuizConfig,
  validateQuizQuestionItem,
  validateScenarioConfig,
  validateScenarioItem,
} from '../../src/modules/admin/validators'
import { QuizConfig, QuizQuestion, ScenarioConfig, ScenarioItem } from '../../src/modules/admin/models'

function makeScenario(overrides: Partial<ScenarioItem> = {}): ScenarioItem {
  return {
    id: 'scenario-1',
    title: 'A Suspicious Email',
    order: 1,
    video: { videoUrl: '/video.mp4', videoAvailable: false, duration: 30 },
    pauseTimestamp: 10,
    choices: [
      { id: 'c1', text: 'Click the link', isSafe: false, feedbackTitle: 'Risky', feedbackText: 'That was risky.' },
      { id: 'c2', text: 'Report it', isSafe: true, feedbackTitle: 'Good', feedbackText: 'Well done.' },
    ],
    ...overrides,
  }
}

describe('modules/admin/validators — scenario business rules', () => {
  it('accepts a well-formed scenario', () => {
    expect(validateScenarioItem(makeScenario())).toEqual([])
  })

  it('flags zero safe choices', () => {
    const scenario = makeScenario({
      choices: [
        { id: 'c1', text: 'A', isSafe: false, feedbackTitle: 't', feedbackText: 'x' },
        { id: 'c2', text: 'B', isSafe: false, feedbackTitle: 't', feedbackText: 'x' },
      ],
    })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'safeChoice')).toBe(true)
  })

  it('flags more than one safe choice', () => {
    const scenario = makeScenario({
      choices: [
        { id: 'c1', text: 'A', isSafe: true, feedbackTitle: 't', feedbackText: 'x' },
        { id: 'c2', text: 'B', isSafe: true, feedbackTitle: 't', feedbackText: 'x' },
      ],
    })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'safeChoice')).toBe(true)
  })

  it('flags a pause timestamp at or past the video duration', () => {
    const scenario = makeScenario({ pauseTimestamp: 30, video: { videoUrl: '/v.mp4', videoAvailable: false, duration: 30 } })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'pauseTimestamp')).toBe(true)
  })

  it('flags empty choice text/feedback', () => {
    const scenario = makeScenario({
      choices: [
        { id: 'c1', text: '', isSafe: false, feedbackTitle: '', feedbackText: '' },
        { id: 'c2', text: 'B', isSafe: true, feedbackTitle: 't', feedbackText: 'x' },
      ],
    })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'choice-c1-text')).toBe(true)
    expect(issues.some((i) => i.field === 'choice-c1-feedbackTitle')).toBe(true)
    expect(issues.some((i) => i.field === 'choice-c1-feedbackText')).toBe(true)
  })

  it('validateScenarioConfig aggregates issues across all scenarios', () => {
    const config: ScenarioConfig = {
      id: 'm1',
      title: 'Module',
      surface: 'browser',
      scenarios: [makeScenario(), makeScenario({ id: 'scenario-2', choices: [] as any })],
    }
    const result = validateScenarioConfig(config)
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

function makeQuestion(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    id: 'q1',
    order: 1,
    text: 'What is phishing?',
    choices: [
      { id: 'ch1', text: 'A scam email' },
      { id: 'ch2', text: 'A firewall' },
      { id: 'ch3', text: 'An antivirus' },
      { id: 'ch4', text: 'A VPN' },
    ],
    correctChoiceId: 'ch1',
    explanation: 'Phishing is a scam email technique.',
    difficulty: 'Easy',
    ...overrides,
  }
}

describe('modules/admin/validators — quiz business rules', () => {
  it('accepts a well-formed question', () => {
    expect(validateQuizQuestionItem(makeQuestion())).toEqual([])
  })

  it('flags empty question text', () => {
    const issues = validateQuizQuestionItem(makeQuestion({ text: '  ' }))
    expect(issues.some((i) => i.field === 'text')).toBe(true)
  })

  it('flags fewer than two filled choices', () => {
    const question = makeQuestion({
      choices: [
        { id: 'ch1', text: 'A scam email' },
        { id: 'ch2', text: '' },
        { id: 'ch3', text: '' },
        { id: 'ch4', text: '' },
      ],
    })
    const issues = validateQuizQuestionItem(question)
    expect(issues.some((i) => i.field === 'choices' && i.message.includes('Less than two'))).toBe(true)
  })

  it('flags a correctChoiceId that does not reference a filled choice', () => {
    const issues = validateQuizQuestionItem(makeQuestion({ correctChoiceId: 'does-not-exist' }))
    expect(issues.some((i) => i.field === 'correctChoiceId')).toBe(true)
  })

  it('flags duplicate choice text', () => {
    const question = makeQuestion({
      choices: [
        { id: 'ch1', text: 'Same' },
        { id: 'ch2', text: 'same' },
        { id: 'ch3', text: 'Different' },
        { id: 'ch4', text: '' },
      ],
    })
    const issues = validateQuizQuestionItem(question)
    expect(issues.some((i) => i.field === 'choices' && i.message.includes('Duplicate'))).toBe(true)
  })

  it('flags a missing explanation', () => {
    const issues = validateQuizQuestionItem(makeQuestion({ explanation: '' }))
    expect(issues.some((i) => i.field === 'explanation')).toBe(true)
  })

  it('validateQuizConfig aggregates issues across all questions', () => {
    const config: QuizConfig = {
      moduleId: 'password-security',
      title: 'Quiz',
      settings: { passingScore: 80, timeLimitMinutes: 15, instructions: '', available: true },
      questions: [makeQuestion(), makeQuestion({ id: 'q2', explanation: '' })],
    }
    const result = validateQuizConfig(config)
    expect(result.valid).toBe(false)
    expect(result.issues).toEqual([{ field: 'explanation', message: 'Explanation is empty.' }])
  })
})
