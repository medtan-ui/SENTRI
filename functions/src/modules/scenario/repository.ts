import { admin, db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import { ScenarioConfig } from './models'

export async function getScenarioConfig(moduleId: string): Promise<ScenarioConfig | null> {
  const snap = await db.collection(COLLECTIONS.MODULE_SCENARIOS).doc(moduleId).get()
  return snap.exists ? (snap.data() as ScenarioConfig) : null
}

/**
 * Same field names the frontend's scenarioDecisionService.js already
 * writes (userId, moduleId, scenarioId, scenarioChoiceId,
 * selectedAt, feedbackViewed) plus isSafeChoice, so the
 * updateLearningAnalytics trigger (modules/analytics) can aggregate
 * without a second lookup against moduleScenarios.
 *
 * attemptNumber and durationMs are what the Kirkpatrick Level 3
 * measures are computed from: first-attempt safe rate needs to know
 * which decision was the first one, and the fast-wrong/slow-wrong split
 * needs how long the student took. durationMs is null rather than 0
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
    userId: params.userId,
    moduleId: params.moduleId,
    scenarioId: params.scenarioId,
    scenarioChoiceId: params.choiceId,
    isSafeChoice: params.isSafe,
    attemptNumber: params.attemptNumber ?? 1,
    durationMs: typeof params.durationMs === 'number' ? Math.round(params.durationMs) : null,
    selectedAt: admin.firestore.FieldValue.serverTimestamp(),
    feedbackViewed: false,
  })
  return ref.id
}
