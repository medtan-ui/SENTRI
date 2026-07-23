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
 */
export async function recordDecision(params: {
  userId: string
  moduleId: string
  scenarioId: string
  choiceId: string
  isSafe: boolean
}): Promise<string> {
  const ref = await db.collection(COLLECTIONS.SCENARIO_DECISION_RECORDS).add({
    user_id: params.userId,
    module_id: params.moduleId,
    scenario_id: params.scenarioId,
    scenario_choice_id: params.choiceId,
    is_safe_choice: params.isSafe,
    selected_at: admin.firestore.FieldValue.serverTimestamp(),
    feedback_viewed: false,
  })
  return ref.id
}
