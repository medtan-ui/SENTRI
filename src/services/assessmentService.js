/**
 * assessmentService.js
 * The pre-test and post-test pair — the two ungraded measurements that
 * bracket a module and make "did awareness actually improve?" answerable.
 *
 * Both run on the *same* item bank (`modulePretests/{moduleId}`, seeded
 * from src/data/modulePretestContent.js). That is deliberate: a
 * normalized learning gain only means something when the before and
 * after measurements use identical items.
 *
 * Grading is server-side (the submitAssessment Cloud Function), not
 * client-side as the pre-test used to be. Two reasons: per-question
 * responses have to land in `quiz_responses`, which no client may write,
 * or item analysis is impossible; and a post-test score is compared
 * against a stored pre-test score, so a client that computed either could
 * manufacture an improvement.
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

/**
 * Submits one bookend assessment for server-side grading.
 *
 * @param {string} moduleId
 * @param {'pretest'|'posttest'} assessmentType
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
