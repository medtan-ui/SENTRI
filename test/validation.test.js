import { describe, expect, it } from 'vitest'
import { validateScenario } from '../src/features/admin/scenario-config/hooks/validateScenarioConfig'
import { SCENARIO_CONFIG_REGISTRY } from '../src/features/scenario/configs'
import { parseYouTubeId } from '../src/components/VideoPlayer/YouTubePlayer'
import { deriveModuleStatus, MODULE_STATUS } from '../src/services/moduleProgressService'
import { validatePassword } from '../src/utils/passwordPolicy'

/**
 * The rules that decide whether admin-authored content is publishable,
 * what a student is allowed to reach, and what counts as an acceptable
 * password. All pure functions, all consequential — a wrong answer here
 * either blocks a valid save or ships a broken module.
 */

function scenarioWith(overrides = {}) {
  return {
    scenario_id: 's1',
    scenario_order: 1,
    scene: 'InboxScene',
    scenario_title: 'A Title',
    scenario_description: 'A description.',
    posterCaption: 'A caption.',
    choices: [
      {
        scenario_choice_id: 'c1',
        target: 't1',
        is_safe_choice: false,
        choice_text: 'Risky thing',
        outcome_title: 'Bad outcome',
        consequence_type: 'credential_compromise',
        feedback_text: 'Here is why.',
      },
      {
        scenario_choice_id: 'c2',
        target: 't2',
        is_safe_choice: true,
        choice_text: 'Safe thing',
        outcome_title: 'Good outcome',
        consequence_type: 'none',
        feedback_text: 'Well done.',
      },
    ],
    ...overrides,
  }
}

describe('validateScenario', () => {
  it('accepts a fully authored scenario', () => {
    expect(validateScenario(scenarioWith()).isValid).toBe(true)
  })

  it('accepts more than one safe choice', () => {
    // A scene may offer several acceptable endings with different
    // feedback — Password Security's sign-up scenario does exactly this.
    const scenario = scenarioWith()
    scenario.choices[0].is_safe_choice = true
    expect(validateScenario(scenario).isValid).toBe(true)
  })

  it('rejects a scenario with no safe choice at all', () => {
    const scenario = scenarioWith()
    scenario.choices[1].is_safe_choice = false
    const result = validateScenario(scenario)
    expect(result.isValid).toBe(false)
    expect(result.issues.some((i) => i.field === 'safeChoice')).toBe(true)
  })

  it('rejects empty student-visible copy', () => {
    const result = validateScenario(scenarioWith({ scenario_title: '   ', posterCaption: '' }))
    const fields = result.issues.map((i) => i.field)
    expect(fields).toContain('scenario_title')
    expect(fields).toContain('posterCaption')
  })

  it('rejects a consequence type the engine cannot illustrate', () => {
    const scenario = scenarioWith()
    scenario.choices[0].consequence_type = 'made_up_type'
    const result = validateScenario(scenario)
    expect(result.isValid).toBe(false)
    expect(result.issues.some((i) => i.field.endsWith('-consequence_type'))).toBe(true)
  })

  it('flags each empty choice field individually so an admin can fix them all at once', () => {
    const scenario = scenarioWith()
    scenario.choices[0].feedback_text = ''
    scenario.choices[0].outcome_title = ''
    const fields = validateScenario(scenario).issues.map((i) => i.field)
    expect(fields).toContain('choice-c1-feedback_text')
    expect(fields).toContain('choice-c1-outcome_title')
  })

  it('passes every authored scenario shipped with the app', () => {
    // Guards against an authored config drifting into a state the admin
    // editor would refuse to save — which would leave that module
    // permanently uneditable.
    Object.entries(SCENARIO_CONFIG_REGISTRY).forEach(([moduleId, config]) => {
      config.scenarios.forEach((scenario) => {
        const result = validateScenario(scenario)
        expect(
          result.isValid,
          `${moduleId}/${scenario.scenario_id}: ${result.issues.map((i) => i.message).join('; ')}`,
        ).toBe(true)
      })
    })
  })
})

describe('parseYouTubeId', () => {
  it('accepts a bare 11-character video id', () => {
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('accepts the URL forms an admin is likely to paste', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('keeps extra query parameters from breaking the id', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ')
  })

  it('returns empty for anything unrecognizable, so the player shows its placeholder', () => {
    expect(parseYouTubeId('')).toBe('')
    expect(parseYouTubeId(null)).toBe('')
    expect(parseYouTubeId('not a url')).toBe('')
    expect(parseYouTubeId('https://vimeo.com/12345')).toBe('')
  })
})

describe('deriveModuleStatus', () => {
  it('locks a module with no progress record', () => {
    expect(deriveModuleStatus(null)).toBe(MODULE_STATUS.LOCKED)
  })

  it('locks a module that exists but is not unlocked', () => {
    expect(deriveModuleStatus({ isUnlocked: false, lessonStarted: true })).toBe(MODULE_STATUS.LOCKED)
  })

  it('reports a freshly unlocked module as available', () => {
    expect(deriveModuleStatus({ isUnlocked: true })).toBe(MODULE_STATUS.AVAILABLE)
  })

  it('reports a started lesson as in progress', () => {
    expect(deriveModuleStatus({ isUnlocked: true, lessonStarted: true })).toBe(MODULE_STATUS.IN_PROGRESS)
  })

  it('reports a finished simulation as quiz-available', () => {
    expect(
      deriveModuleStatus({ isUnlocked: true, lessonStarted: true, simulationCompleted: true }),
    ).toBe(MODULE_STATUS.QUIZ_AVAILABLE)
  })

  it('lets completion win over every earlier state', () => {
    expect(
      deriveModuleStatus({ isUnlocked: true, lessonStarted: true, simulationCompleted: true, moduleCompleted: true }),
    ).toBe(MODULE_STATUS.COMPLETED)
  })
})

describe('validatePassword', () => {
  it('accepts a password meeting every rule', () => {
    expect(validatePassword('Str0ng!Passphrase').valid).toBe(true)
  })

  it('rejects an empty or missing password with a reason', () => {
    const result = validatePassword('')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('reports every unmet rule at once rather than one at a time', () => {
    const result = validatePassword('abc')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })
})
