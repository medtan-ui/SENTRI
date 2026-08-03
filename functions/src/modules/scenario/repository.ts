import { admin, db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import { ScenarioConfig } from './models'

export async function getScenarioConfig(moduleId: string): Promise<ScenarioConfig | null> {
  const snap = await db.collection(COLLECTIONS.MODULE_SCENARIOS).doc(moduleId).get()
  return snap.exists ? (snap.data() as ScenarioConfig) : null
}

/**
 * Same field names the frontend's scenarioDecisionService.js already
 * writes (user_id, module_id, scenario_id, scenario_choice_id,
 * selected_at, feedback_viewed) plus is_safe_choice, so the
 * updateLearningAnalytics trigger (modules/analytics) can aggregate
 * without a second lookup against moduleScenarios.
 *
 * attempt_number and duration_ms are what the Kirkpatrick Level 3
 * measures are computed from: first-attempt safe rate needs to know
 * which decision was the first one, and the fast-wrong/slow-wrong split
 * needs how long the student took. duration_ms is null rather than 0
 * when the client couldn't measure it, so an unmeasured decision is
 * excluded from timing averages instead of dragging them to zero.
 */
export async function recordDecision(params: {
  userId: string
  moduleId: string
  scenarioId: string
  choiceId: string
  isSafe: boolean
  attemptNumber?: number
  durationMs?: number
}): Promise<string> {
  const ref = await db.collection(COLLECTIONS.SCENARIO_DECISION_RECORDS).add({
    user_id: params.userId,
    module_id: params.moduleId,
    scenario_id: params.scenarioId,
    scenario_choice_id: params.choiceId,
    is_safe_choice: params.isSafe,
    attempt_number: params.attemptNumber ?? 1,
    duration_ms: typeof params.durationMs === 'number' ? Math.round(params.durationMs) : null,
    selected_at: admin.firestore.FieldValue.serverTimestamp(),
    feedback_viewed: false,
  })
  return ref.id
}
