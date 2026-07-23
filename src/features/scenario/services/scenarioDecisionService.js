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
 * @param {{ userId: string, moduleId: string, scenarioId: string, choiceId: string, isSafe: boolean }} args
 * @returns {Promise<string|null>} the new document's id, or null if the write failed
 */
export async function recordDecision({ userId, moduleId, scenarioId, choiceId, isSafe }) {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      user_id: userId,
      module_id: moduleId,
      scenario_id: scenarioId,
      scenario_choice_id: choiceId,
      is_safe_choice: isSafe,
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
