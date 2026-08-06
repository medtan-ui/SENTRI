/**
 * validateScenarioConfig.js
 * Pure validation logic for one scenario / one whole module config,
 * against the Scenario Engine's own shape (the same objects the student
 * engine consumes — see src/features/scenario/configs/).
 *
 * Kept separate from useScenario (src/hooks/useScenario.js) so the rules
 * can be unit tested, or reused by a future Firestore-side check, without
 * pulling in React.
 *
 * Scope note: only *editable* fields are validated. Structural fields
 * (scene, target, isSafeChoice, ids) come straight from the authored
 * config via mergeScenarioConfig and cannot be wrong here — the one
 * exception is the safe-choice count, checked as a cheap tripwire in case
 * a future authored config is hand-edited and gets it wrong.
 */
import { CONSEQUENCE_TYPES } from '../../../../services/scenarioService'

/**
 * @param {import('../types/scenarioConfigAdmin.types').ScenarioConfig} scenario
 * @returns {import('../types/scenarioConfigAdmin.types').ScenarioValidationResult}
 */
export function validateScenario(scenario) {
  const issues = []

  if (!scenario.scenarioTitle || !scenario.scenarioTitle.trim()) {
    issues.push({ field: 'scenarioTitle', message: 'Scenario title is empty.' })
  }
  if (!scenario.scenarioDescription || !scenario.scenarioDescription.trim()) {
    issues.push({ field: 'scenarioDescription', message: 'Scenario description is empty.' })
  }
  if (!scenario.posterCaption || !scenario.posterCaption.trim()) {
    issues.push({
      field: 'posterCaption',
      message: 'Poster caption is empty — students see it while the scene loads.',
    })
  }

  // At least one safe choice, not exactly one. A scene may legitimately
  // offer more than one acceptable outcome with different feedback —
  // Password Security's sign-up scenario, for instance, treats "three
  // unique strong passwords" and "three unique but weak passwords" as
  // two distinct safe endings. What is never acceptable is *zero*: that
  // leaves the scenario unwinnable, since the engine only advances on a
  // safe choice.
  const safeCount = scenario.choices.filter((c) => c.isSafeChoice).length
  if (safeCount === 0) {
    issues.push({
      field: 'safeChoice',
      message: 'No safe choice exists — students could never complete this scenario.',
    })
  }

  scenario.choices.forEach((choice, index) => {
    const label = `Choice ${index + 1}`
    const id = choice.scenarioChoiceId
    if (!choice.choiceText || !choice.choiceText.trim()) {
      issues.push({ field: `choice-${id}-choiceText`, message: `${label}: choice description is empty.` })
    }
    if (!choice.outcomeTitle || !choice.outcomeTitle.trim()) {
      issues.push({ field: `choice-${id}-outcomeTitle`, message: `${label}: outcome title is empty.` })
    }
    if (!choice.feedbackText || !choice.feedbackText.trim()) {
      issues.push({ field: `choice-${id}-feedbackText`, message: `${label}: feedback text is empty.` })
    }
    if (!CONSEQUENCE_TYPES.includes(choice.consequenceType)) {
      issues.push({
        field: `choice-${id}-consequenceType`,
        message: `${label}: "${choice.consequenceType}" is not a consequence type the engine can illustrate.`,
      })
    }
  })

  return { scenarioId: scenario.scenarioId, isValid: issues.length === 0, issues }
}

/**
 * @param {import('../types/scenarioConfigAdmin.types').ModuleScenarioConfig} config
 * @returns {import('../types/scenarioConfigAdmin.types').ScenarioValidationResult[]}
 */
export function validateModuleConfig(config) {
  return config.scenarios.map(validateScenario)
}
