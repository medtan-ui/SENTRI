import { describe, expect, it } from 'vitest'
import { mergeScenarioConfig } from '../src/services/scenarioService'
import { SCENARIO_CONFIG_REGISTRY } from '../src/features/scenario/configs'
import { SCENE_REGISTRY } from '../src/features/scenario/scenes/sceneRegistry'

/**
 * The structural/editable split is the whole safety story for
 * admin-editable scenarios: an admin can rewrite every word a student
 * reads, but cannot touch the wiring that makes a scenario playable
 * (which scene renders it, which interactive target maps to which
 * choice, which choice is the safe one).
 *
 * These tests exist because that guarantee is invisible in the UI —
 * nothing on screen fails loudly if a stored document starts overriding
 * `scene`. A regression here would ship a simulation that silently can't
 * be completed.
 */
describe('mergeScenarioConfig', () => {
  const moduleId = 'password-security'
  const authored = SCENARIO_CONFIG_REGISTRY[moduleId]

  it('returns the authored config untouched when nothing is stored', () => {
    const result = mergeScenarioConfig(null, moduleId)
    expect(result.scenarios.map((s) => s.scenario_id)).toEqual(
      authored.scenarios.map((s) => s.scenario_id),
    )
    expect(result.scenarios[0].scenario_title).toBe(authored.scenarios[0].scenario_title)
  })

  it('returns null for a module that has no authored scenario', () => {
    expect(mergeScenarioConfig(null, 'not-a-real-module')).toBeNull()
  })

  it('applies stored edits to student-visible copy', () => {
    const stored = {
      scenarios: [
        {
          scenario_id: authored.scenarios[0].scenario_id,
          scenario_title: 'A Rewritten Title',
          scenario_description: 'Rewritten description.',
          posterCaption: 'Rewritten caption.',
        },
      ],
    }
    const result = mergeScenarioConfig(stored, moduleId)
    expect(result.scenarios[0].scenario_title).toBe('A Rewritten Title')
    expect(result.scenarios[0].scenario_description).toBe('Rewritten description.')
    expect(result.scenarios[0].posterCaption).toBe('Rewritten caption.')
  })

  it('ignores a stored attempt to change which scene renders a scenario', () => {
    const stored = {
      scenarios: [{ scenario_id: authored.scenarios[0].scenario_id, scene: 'SomeOtherScene' }],
    }
    const result = mergeScenarioConfig(stored, moduleId)
    expect(result.scenarios[0].scene).toBe(authored.scenarios[0].scene)
  })

  it('ignores a stored attempt to change which choice is safe', () => {
    const authoredChoice = authored.scenarios[0].choices[0]
    const stored = {
      scenarios: [
        {
          scenario_id: authored.scenarios[0].scenario_id,
          choices: [
            {
              scenario_choice_id: authoredChoice.scenario_choice_id,
              is_safe_choice: !authoredChoice.is_safe_choice,
              target: 'a-target-that-does-not-exist',
            },
          ],
        },
      ],
    }
    const result = mergeScenarioConfig(stored, moduleId)
    const merged = result.scenarios[0].choices[0]
    expect(merged.is_safe_choice).toBe(authoredChoice.is_safe_choice)
    expect(merged.target).toBe(authoredChoice.target)
  })

  it('applies stored edits to choice feedback while keeping its wiring', () => {
    const authoredChoice = authored.scenarios[0].choices[0]
    const stored = {
      scenarios: [
        {
          scenario_id: authored.scenarios[0].scenario_id,
          choices: [
            {
              scenario_choice_id: authoredChoice.scenario_choice_id,
              feedback_text: 'Rewritten feedback.',
              outcome_title: 'Rewritten outcome.',
            },
          ],
        },
      ],
    }
    const merged = mergeScenarioConfig(stored, moduleId).scenarios[0].choices[0]
    expect(merged.feedback_text).toBe('Rewritten feedback.')
    expect(merged.outcome_title).toBe('Rewritten outcome.')
    expect(merged.target).toBe(authoredChoice.target)
  })

  it('keeps the authored value for a field the stored document omits', () => {
    const stored = {
      scenarios: [{ scenario_id: authored.scenarios[0].scenario_id, scenario_title: 'Only a title' }],
    }
    const merged = mergeScenarioConfig(stored, moduleId).scenarios[0]
    expect(merged.scenario_description).toBe(authored.scenarios[0].scenario_description)
    expect(merged.posterCaption).toBe(authored.scenarios[0].posterCaption)
  })

  it('drops a stored scenario whose id no longer exists in code', () => {
    // The case that matters after a code change renames or removes a
    // scenario: stale stored entries must not resurrect it.
    const stored = {
      scenarios: [{ scenario_id: 'removed-in-a-later-refactor', scenario_title: 'Ghost' }],
    }
    const result = mergeScenarioConfig(stored, moduleId)
    expect(result.scenarios).toHaveLength(authored.scenarios.length)
    expect(result.scenarios.every((s) => s.scenario_title !== 'Ghost')).toBe(true)
  })

  it('never loses a choice the scene still expects, even if storage omits it', () => {
    const stored = {
      scenarios: [{ scenario_id: authored.scenarios[0].scenario_id, choices: [] }],
    }
    const result = mergeScenarioConfig(stored, moduleId)
    expect(result.scenarios[0].choices).toHaveLength(authored.scenarios[0].choices.length)
  })

  it('falls back to the authored config when the stored document is malformed', () => {
    const result = mergeScenarioConfig({ scenarios: 'not-an-array' }, moduleId)
    expect(result.scenarios).toHaveLength(authored.scenarios.length)
  })
})

describe('authored scenario configs', () => {
  it('give every scenario at least one safe choice, so none is unwinnable', () => {
    // Not "exactly one": a scene may offer several acceptable endings
    // with different feedback (Password Security's sign-up scenario
    // distinguishes three unique strong passwords from three unique but
    // weak ones). Zero safe choices is the real defect — the engine only
    // advances on a safe choice, so the student would be trapped.
    Object.entries(SCENARIO_CONFIG_REGISTRY).forEach(([moduleId, config]) => {
      config.scenarios.forEach((scenario) => {
        const safeCount = scenario.choices.filter((c) => c.is_safe_choice).length
        expect(
          safeCount,
          `${moduleId}/${scenario.scenario_id} is unwinnable — no safe choice`,
        ).toBeGreaterThan(0)
      })
    })
  })

  it('give every scenario a scene component that exists in the registry', () => {
    // A config naming a scene the registry doesn't have renders nothing
    // at all — the engine looks the component up by this string.
    Object.entries(SCENARIO_CONFIG_REGISTRY).forEach(([moduleId, config]) => {
      config.scenarios.forEach((scenario) => {
        expect(
          SCENE_REGISTRY[scenario.scene],
          `${moduleId}/${scenario.scenario_id} names unknown scene "${scenario.scene}"`,
        ).toBeTruthy()
      })
    })
  })

  it('give every choice a distinct interactive target within its scenario', () => {
    Object.entries(SCENARIO_CONFIG_REGISTRY).forEach(([moduleId, config]) => {
      config.scenarios.forEach((scenario) => {
        const targets = scenario.choices.map((c) => c.target)
        expect(
          new Set(targets).size,
          `${moduleId}/${scenario.scenario_id} has duplicate targets`,
        ).toBe(targets.length)
      })
    })
  })
})
