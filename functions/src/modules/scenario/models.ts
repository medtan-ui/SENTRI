/**
 * modules/scenario/models.ts
 * Mirrors the Scenario Engine's own configuration shape — the objects
 * stored in `moduleScenarios` and consumed by
 * src/features/scenario/engine/. Field names are snake_case here because
 * that is what the engine and the stored documents already use; this file
 * deliberately does not invent a second vocabulary for the same data.
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
  scenario_choice_id: string
  target: string
  choice_text: string
  is_safe_choice: boolean
  outcome_title: string
  consequence_type: string
  feedback_text: string
  feedback_media_url: string | null
}

export interface ScenarioItemConfig {
  scenario_id: string
  scenario_order: number
  scenario_title: string
  scenario_description: string
  videoAvailable: boolean
  material_url: string | null
  posterCaption: string
  scene: string
  coachTarget?: string
  postCompletionReflection?: string
  choices: ScenarioChoiceConfig[]
}

export interface ScenarioConfig {
  module_id: string
  module_title: string
  coachLevel: 'full' | 'idle' | 'none'
  scenarios: ScenarioItemConfig[]
}

export interface SubmitScenarioDecisionResult {
  isSafe: boolean
  decisionId: string
  feedback: { title: string; text: string }
  consequence: { outcomeTitle: string; consequenceType: string; feedbackMediaUrl: string | null } | null
}
