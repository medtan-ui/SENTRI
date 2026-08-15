/**
 * finalAssessmentService.js
 * SENTRI's single end-of-curriculum assessment — the one test taken after
 * all six modules are complete, replacing what used to be six separate
 * per-module post-tests.
 *
 * Grading is server-side (the submitFinalAssessment Cloud Function), for
 * the same two reasons the module quiz is: correctChoiceId must never be
 * decidable by the client, and the normalized gain compares against stored
 * pre-test scores, so a client that computed either could manufacture an
 * improvement.
 *
 * The config document is lazily seeded from src/data/finalAssessmentContent.js
 * on first read, same pattern as moduleQuizzes and modulePretests.
 */
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import { friendlyCallableError } from './callableErrors'
import { getOrSeedDoc } from './firestoreDoc'
import { getDefaultFinalAssessment } from '../data/finalAssessmentContent'

const CONFIG_COLLECTION = 'finalAssessment'
const CONFIG_DOC_ID = 'config'
const PROGRESS_COLLECTION = 'finalAssessmentProgress'

/**
 * The final assessment's questions and settings.
 * @returns {Promise<{title:string, settings:object, questions:Array}>}
 */
export async function getFinalAssessment() {
  return getOrSeedDoc(CONFIG_COLLECTION, CONFIG_DOC_ID, getDefaultFinalAssessment())
}

async function callGetFinalAssessmentForStudent() {
  try {
    const call = httpsCallable(functions, 'getFinalAssessmentForStudent')
    const { data } = await call()
    return data.assessment
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}

/**
 * The read the student final assessment page actually uses — goes through
 * the getFinalAssessmentForStudent Cloud Function instead of a direct
 * Firestore read of the config document, so correctChoiceId/explanation
 * never cross the wire before the student submits. getFinalAssessment()
 * above (raw Firestore read, answer key included) stays exactly as it was
 * for the admin editor (useFinalAssessmentConfig), which has to see the
 * answer key to edit it — this is a second, narrower read path alongside
 * it, not a replacement. Falls back to that seeding read (same reasoning
 * as quizService's getQuizForStudent) the one time the config document has
 * never been read by anyone before.
 *
 * @returns {Promise<{title:string, settings:object, questions:Array}|null>}
 *   null when the final assessment hasn't been configured/seeded yet.
 */
export async function getFinalAssessmentForStudent() {
  const sanitized = await callGetFinalAssessmentForStudent()
  if (sanitized) return sanitized
  const seeded = await getFinalAssessment()
  if (!seeded) return null
  return callGetFinalAssessmentForStudent()
}

/**
 * This student's final assessment record, or null if they've never taken
 * it. Read directly (not through a callable) because it holds nothing a
 * student shouldn't see about themselves.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getFinalAssessmentProgress(userId) {
  if (!userId) return null
  const snap = await getDoc(doc(db, PROGRESS_COLLECTION, userId))
  return snap.exists() ? snap.data() : null
}

/**
 * Submits the final assessment for server-side grading.
 * @param {Record<string,string>} answers    questionId -> choiceId
 * @param {Record<string,number>} [durations] questionId -> milliseconds
 * @returns {Promise<object>}
 */
export async function submitFinalAssessment(answers, durations) {
  try {
    const call = httpsCallable(functions, 'submitFinalAssessment')
    const { data } = await call({ answers, durations })
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}

/**
 * Admin-only save of the whole config document, validated server-side.
 * @param {{title:string, settings:object, questions:Array}} config
 */
export async function saveFinalAssessment(config) {
  try {
    const call = httpsCallable(functions, 'updateFinalAssessment')
    const { data } = await call(config)
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}

/** The original authored seed — used by the editor's "Reset to Defaults". */
export function getDefaultFinalAssessmentConfig() {
  return getDefaultFinalAssessment()
}
