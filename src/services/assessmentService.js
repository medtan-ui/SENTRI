/**
 * assessmentService.js
 * The per-module pre-test — the ungraded baseline a student answers once,
 * before that module's first lesson.
 *
 * The matching "after" measurement is not here and is no longer
 * per-module: it's the single end-of-curriculum final assessment (see
 * finalAssessmentService.js), whose item bank is assembled from these same
 * six pre-test banks so a normalized gain still compares identical items.
 *
 * Grading is server-side (the submitAssessment Cloud Function), not
 * client-side as the pre-test used to be. Two reasons: per-question
 * responses have to land in `quizResponses`, which no client may write,
 * or item analysis is impossible; and the final assessment's gain is
 * compared against a stored pre-test score, so a client that computed
 * either could manufacture an improvement.
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { friendlyCallableError } from './callableErrors'
import { getDefaultPretest } from '../data/modulePretestContent'
import { getOrSeedDoc } from './firestoreDoc'

const COLLECTION = 'modulePretests'

/**
 * The shared item bank for both bookend assessments. Lazily seeded on
 * first read, same pattern as moduleQuizzes.
 * @param {string} moduleId
 * @returns {Promise<{moduleId:string, title:string, questions:Array} | null>}
 */
export async function getAssessment(moduleId) {
  return getOrSeedDoc(COLLECTION, moduleId, getDefaultPretest(moduleId))
}

async function callGetAssessmentForStudent(moduleId) {
  try {
    const call = httpsCallable(functions, 'getAssessmentForStudent')
    const { data } = await call({ moduleId })
    return data.assessment
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}

/**
 * The read the student pre-test page actually uses — goes through the
 * getAssessmentForStudent Cloud Function instead of a direct Firestore
 * read of this collection, so correctChoiceId/explanation never cross the
 * wire before the student submits. getAssessment() above (raw Firestore
 * read, answer key included) is unused by any admin editor today — there
 * isn't one for the pre-test bank — but is left as-is since it still owns
 * the lazy-seed-on-first-read behavior this collection depends on, and
 * this function falls back to it (same reasoning as quizService's
 * getQuizForStudent) the one time a given module's item bank has never
 * been read by anyone before.
 *
 * @param {string} moduleId
 * @returns {Promise<{moduleId:string, title:string, questions:Array}|null>}
 *   null when this module's item bank hasn't been configured/seeded yet.
 */
export async function getAssessmentForStudent(moduleId) {
  const sanitized = await callGetAssessmentForStudent(moduleId)
  if (sanitized) return sanitized
  const seeded = await getAssessment(moduleId)
  if (!seeded) return null
  return callGetAssessmentForStudent(moduleId)
}

/**
 * Submits one bookend assessment for server-side grading.
 *
 * @param {string} moduleId
 * @param {'pretest'} assessmentType  the only value the server accepts
 * @param {Record<string,string>} answers    questionId -> choiceId
 * @param {Record<string,number>} [durations] questionId -> milliseconds
 * @returns {Promise<{assessmentType:string, score:number, correctCount:number, total:number,
 *   perQuestionResults:Array, normalizedGain:number|null, preTestScore:number|null}>}
 */
export async function submitAssessment(moduleId, assessmentType, answers, durations) {
  try {
    const call = httpsCallable(functions, 'submitAssessment')
    const { data } = await call({ moduleId, assessmentType, answers, durations })
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}
