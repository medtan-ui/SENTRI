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
