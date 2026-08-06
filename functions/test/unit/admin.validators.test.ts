import {
  validateQuizConfig,
  validateQuizQuestionItem,
  validateScenarioConfig,
  validateScenarioItem,
} from '../../src/modules/admin/validators'
import { QuizConfig, QuizQuestion, ScenarioConfig, ScenarioItem } from '../../src/modules/admin/models'

function makeChoice(overrides: Partial<ScenarioItem['choices'][number]> = {}) {
  return {
    scenarioChoiceId: 'c1',
    target: 'link-btn',
    choiceText: 'Click the link',
    isSafeChoice: false,
    outcomeTitle: 'Credentials Captured',
    consequenceType: 'credential_compromise',
    feedbackText: 'That was risky.',
    feedbackMediaUrl: null,
    ...overrides,
  }
}

function makeScenario(overrides: Partial<ScenarioItem> = {}): ScenarioItem {
  return {
    scenarioId: 'scenario-1',
    scenarioOrder: 1,
    scenarioTitle: 'A Suspicious Email',
    scenarioDescription: 'An unexpected email lands in your inbox.',
    videoAvailable: false,
    materialUrl: null,
    posterCaption: 'One email, one decision.',
    scene: 'InboxScene',
    choices: [
      makeChoice(),
      makeChoice({
        scenarioChoiceId: 'c2',
        target: 'report-btn',
        choiceText: 'Report it',
        isSafeChoice: true,
        outcomeTitle: 'Well Handled',
        consequenceType: 'none',
        feedbackText: 'Well done.',
      }),
    ],
    ...overrides,
  }
}

describe('modules/admin/validators — scenario business rules', () => {
  it('accepts a well-formed scenario', () => {
    expect(validateScenarioItem(makeScenario())).toEqual([])
  })

  it('flags zero safe choices, which would leave the scenario unwinnable', () => {
    const scenario = makeScenario({
      choices: [makeChoice(), makeChoice({ scenarioChoiceId: 'c2', target: 'report-btn' })],
    })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'safeChoice')).toBe(true)
  })

  it('accepts more than one safe choice', () => {
    // A scene may offer several acceptable endings with different
    // feedback — Password Security's sign-up scenario does exactly this,
    // distinguishing unique-and-strong from unique-but-weak passwords.
    const scenario = makeScenario({
      choices: [
        makeChoice({ isSafeChoice: true, consequenceType: 'none' }),
        makeChoice({
          scenarioChoiceId: 'c2',
          target: 'report-btn',
          isSafeChoice: true,
          consequenceType: 'none',
        }),
      ],
    })
    expect(validateScenarioItem(scenario)).toEqual([])
  })

  it('flags two choices bound to the same interactive target', () => {
    // The scene resolves a target to exactly one choice, so a duplicate
    // makes one of them permanently unreachable.
    const scenario = makeScenario({
      choices: [
        makeChoice(),
        makeChoice({ scenarioChoiceId: 'c2', isSafeChoice: true, consequenceType: 'none' }),
      ],
    })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'choice-c2-target')).toBe(true)
  })

  it('flags empty student-visible scenario copy', () => {
    const issues = validateScenarioItem(makeScenario({ scenarioTitle: '  ', posterCaption: '' }))
    expect(issues.some((i) => i.field === 'scenarioTitle')).toBe(true)
    expect(issues.some((i) => i.field === 'posterCaption')).toBe(true)
  })

  it('flags empty choice copy per field', () => {
    const scenario = makeScenario({
      choices: [
        makeChoice({ choiceText: '', outcomeTitle: '', feedbackText: '' }),
        makeChoice({
          scenarioChoiceId: 'c2',
          target: 'report-btn',
          isSafeChoice: true,
          consequenceType: 'none',
        }),
      ],
    })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'choice-c1-choiceText')).toBe(true)
    expect(issues.some((i) => i.field === 'choice-c1-outcomeTitle')).toBe(true)
    expect(issues.some((i) => i.field === 'choice-c1-feedbackText')).toBe(true)
  })

  it('validateScenarioConfig aggregates issues across all scenarios', () => {
    const config: ScenarioConfig = {
      moduleId: 'phishing-awareness',
      moduleTitle: 'Phishing Awareness',
      coachLevel: 'full',
      scenarios: [makeScenario(), makeScenario({ scenarioId: 'scenario-2', choices: [] as any })],
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
