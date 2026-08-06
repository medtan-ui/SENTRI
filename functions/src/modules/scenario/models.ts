/**
 * modules/scenario/models.ts
 * Mirrors the Scenario Engine's own configuration shape — the objects
 * stored in `moduleScenarios` and consumed by
 * src/features/scenario/engine/. Field names match those documents
 * exactly; this file deliberately does not invent a second vocabulary for
 * the same data.
 */

export interface SubmitScenarioDecisionInput {
  moduleId: string
  scenarioId: string
  choiceId: string
  /** 1-based attempt on this scenario within the current run. The first
   * attempt is the one behavioural analytics cares about — see
   * firstAttemptSafeRate in modules/analytics/metrics.ts. */
  attemptNumber?: number
  /** Milliseconds from the scene becoming interactive to this choice —
   * the time-to-decide measure. */
  durationMs?: number
}

export interface ScenarioChoiceConfig {
  scenarioChoiceId: string
  target: string
  choiceText: string
  isSafeChoice: boolean
  outcomeTitle: string
  consequenceType: string
  feedbackText: string
  feedbackMediaUrl: string | null
}

export interface ScenarioItemConfig {
  scenarioId: string
  scenarioOrder: number
  scenarioTitle: string
  scenarioDescription: string
  videoAvailable: boolean
  materialUrl: string | null
  posterCaption: string
  scene: string
  coachTarget?: string
  postCompletionReflection?: string
  choices: ScenarioChoiceConfig[]
}

export interface ScenarioConfig {
  moduleId: string
  moduleTitle: string
  coachLevel: 'full' | 'idle' | 'none'
  scenarios: ScenarioItemConfig[]
}

export interface SubmitScenarioDecisionResult {
  isSafe: boolean
  decisionId: string
  feedback: { title: string; text: string }
  consequence: { outcomeTitle: string; consequenceType: string; feedbackMediaUrl: string | null } | null
}
