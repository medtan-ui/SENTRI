/**
 * scenarioDecisionService.js
 * Writes one scenario_decision_records document per decision (including
 * retries) — the exact field names match the project ERD. This is the
 * only Firestore-aware file the engine touches; useScenarioEngine calls
 * these functions, never Firestore directly.
 *
 * Analytics aggregates are NOT computed here or anywhere client-side —
 * aggregateStudentAnalytics (a Cloud Function) reads is_safe_choice back
 * out of every doc this writes.
 *
 * A recording failure must never block learning: every function here
 * catches its own errors, logs them, and resolves anyway.
 */
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../../services/firebase'

const COLLECTION = 'scenario_decision_records'

/**
 * `attemptNumber` and `durationMs` are what the Kirkpatrick Level 3
 * measures are computed from. First-attempt safe rate has to know which
 * decision was the student's first on a scenario — an eventual-success
 * rate is meaningless here, since the engine never lets anyone leave
 * without eventually choosing safely. `durationMs` separates a risky
 * choice made without looking from one made after genuinely weighing it,
 * which call for different interventions.
 *
 * `durationMs` is omitted (stored as null) rather than sent as 0 when the
 * engine couldn't measure it, so an unmeasured decision is excluded from
 * timing averages instead of dragging them down.
 *
 * @param {{ userId: string, moduleId: string, scenarioId: string, choiceId: string,
 *   isSafe: boolean, attemptNumber?: number, durationMs?: number|null }} args
 * @returns {Promise<string|null>} the new document's id, or null if the write failed
 */
export async function recordDecision({
  userId,
  moduleId,
  scenarioId,
  choiceId,
  isSafe,
  attemptNumber = 1,
  durationMs = null,
}) {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      user_id: userId,
      module_id: moduleId,
      scenario_id: scenarioId,
      scenario_choice_id: choiceId,
      is_safe_choice: isSafe,
      attempt_number: attemptNumber,
      duration_ms: typeof durationMs === 'number' && durationMs >= 0 ? Math.round(durationMs) : null,
      selected_at: serverTimestamp(),
      feedback_viewed: false,
    })
    return ref.id
  } catch (err) {
    console.error('[scenarioDecisionService] recordDecision failed — continuing without blocking the scenario:', err)
    return null
  }
}

/**
 * Marks a decision's feedback as viewed once the student actually
 * dismisses the FeedbackPanel — not when it first appears.
 * @param {string|null} decisionId
 */
export async function markFeedbackViewed(decisionId) {
  if (!decisionId) return
  try {
    await updateDoc(doc(db, COLLECTION, decisionId), { feedback_viewed: true })
  } catch (err) {
    console.error('[scenarioDecisionService] markFeedbackViewed failed:', err)
  }
}
