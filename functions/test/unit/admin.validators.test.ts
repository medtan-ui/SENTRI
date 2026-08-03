import {
  validateQuizConfig,
  validateQuizQuestionItem,
  validateScenarioConfig,
  validateScenarioItem,
} from '../../src/modules/admin/validators'
import { QuizConfig, QuizQuestion, ScenarioConfig, ScenarioItem } from '../../src/modules/admin/models'

function makeChoice(overrides: Partial<ScenarioItem['choices'][number]> = {}) {
  return {
    scenario_choice_id: 'c1',
    target: 'link-btn',
    choice_text: 'Click the link',
    is_safe_choice: false,
    outcome_title: 'Credentials Captured',
    consequence_type: 'credential_compromise',
    feedback_text: 'That was risky.',
    feedback_media_url: null,
    ...overrides,
  }
}

function makeScenario(overrides: Partial<ScenarioItem> = {}): ScenarioItem {
  return {
    scenario_id: 'scenario-1',
    scenario_order: 1,
    scenario_title: 'A Suspicious Email',
    scenario_description: 'An unexpected email lands in your inbox.',
    videoAvailable: false,
    material_url: null,
    posterCaption: 'One email, one decision.',
    scene: 'InboxScene',
    choices: [
      makeChoice(),
      makeChoice({
        scenario_choice_id: 'c2',
        target: 'report-btn',
        choice_text: 'Report it',
        is_safe_choice: true,
        outcome_title: 'Well Handled',
        consequence_type: 'none',
        feedback_text: 'Well done.',
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
      choices: [makeChoice(), makeChoice({ scenario_choice_id: 'c2', target: 'report-btn' })],
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
        makeChoice({ is_safe_choice: true, consequence_type: 'none' }),
        makeChoice({
          scenario_choice_id: 'c2',
          target: 'report-btn',
          is_safe_choice: true,
          consequence_type: 'none',
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
        makeChoice({ scenario_choice_id: 'c2', is_safe_choice: true, consequence_type: 'none' }),
      ],
    })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'choice-c2-target')).toBe(true)
  })

  it('flags empty student-visible scenario copy', () => {
    const issues = validateScenarioItem(makeScenario({ scenario_title: '  ', posterCaption: '' }))
    expect(issues.some((i) => i.field === 'scenario_title')).toBe(true)
    expect(issues.some((i) => i.field === 'posterCaption')).toBe(true)
  })

  it('flags empty choice copy per field', () => {
    const scenario = makeScenario({
      choices: [
        makeChoice({ choice_text: '', outcome_title: '', feedback_text: '' }),
        makeChoice({
          scenario_choice_id: 'c2',
          target: 'report-btn',
          is_safe_choice: true,
          consequence_type: 'none',
        }),
      ],
    })
    const issues = validateScenarioItem(scenario)
    expect(issues.some((i) => i.field === 'choice-c1-choice_text')).toBe(true)
    expect(issues.some((i) => i.field === 'choice-c1-outcome_title')).toBe(true)
    expect(issues.some((i) => i.field === 'choice-c1-feedback_text')).toBe(true)
  })

  it('validateScenarioConfig aggregates issues across all scenarios', () => {
    const config: ScenarioConfig = {
      module_id: 'phishing-awareness',
      module_title: 'Phishing Awareness',
      coachLevel: 'full',
      scenarios: [makeScenario(), makeScenario({ scenario_id: 'scenario-2', choices: [] as any })],
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
