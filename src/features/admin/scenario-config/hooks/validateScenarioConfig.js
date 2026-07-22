/**
 * validateScenarioConfig.js
 * Pure validation logic for one scenario / one whole module config.
 * Kept separate from useScenario (src/hooks/useScenario.js) so the rules
 * can be unit tested, or reused by a future Firestore-side check, without
 * pulling in React.
 */

/**
 * @param {import('../types/scenarioConfigAdmin.types').AdminScenario} scenario
 * @returns {import('../types/scenarioConfigAdmin.types').ScenarioValidationResult}
 */
export function validateScenario(scenario) {
  const issues = []

  const safeCount = scenario.choices.filter((c) => c.isSafe).length
  if (safeCount === 0) {
    issues.push({ field: 'safeChoice', message: 'No safe choice exists — exactly one choice must be marked Safe.' })
  } else if (safeCount > 1) {
    issues.push({
      field: 'safeChoice',
      message: `Multiple safe choices exist (${safeCount}) — only one choice may be marked Safe.`,
    })
  }

  const duration = scenario.video?.duration
  const pause = scenario.pauseTimestamp
  const pauseNumber = Number(pause)
  const pauseInvalid =
    pause === '' ||
    pause === null ||
    pause === undefined ||
    Number.isNaN(pauseNumber) ||
    pauseNumber <= 0 ||
    (typeof duration === 'number' && pauseNumber >= duration)
  if (pauseInvalid) {
    issues.push({
      field: 'pauseTimestamp',
      message:
        typeof duration === 'number'
          ? `Pause timestamp must be a number between 1 and ${duration - 1} seconds.`
          : 'Pause timestamp must be a positive number.',
    })
  }

  scenario.choices.forEach((choice, index) => {
    const label = `Choice ${index + 1}`
    if (!choice.text || !choice.text.trim()) {
      issues.push({ field: `choice-${choice.id}-text`, message: `${label}: choice text is empty.` })
    }
    if (!choice.feedbackTitle || !choice.feedbackTitle.trim()) {
      issues.push({ field: `choice-${choice.id}-feedbackTitle`, message: `${label}: feedback title is empty.` })
    }
    if (!choice.feedbackText || !choice.feedbackText.trim()) {
      issues.push({ field: `choice-${choice.id}-feedbackText`, message: `${label}: feedback text is empty.` })
    }
  })

  return { scenarioId: scenario.id, isValid: issues.length === 0, issues }
}

/**
 * @param {import('../types/scenarioConfigAdmin.types').AdminModuleScenarioConfig} config
 * @returns {import('../types/scenarioConfigAdmin.types').ScenarioValidationResult[]}
 */
export function validateModuleConfig(config) {
  return config.scenarios.map(validateScenario)
}
