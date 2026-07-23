/**
 * quizService.js
 * Firestore-backed access to the `moduleQuizzes` collection — one
 * module's quiz settings (passing score, time limit, maximum attempts)
 * and its fixed set of questions (choices, correct answer, explanation,
 * difficulty).
 *
 * Seeded lazily from the existing Quiz Configuration mock data — see
 * getDefaultQuizConfig in src/features/admin/quiz-config/services/
 * quizConfigService.js — so the already-authored quiz questions become
 * each document's initial Firestore value instead of being thrown away.
 *
 * Submitting an attempt (submitQuiz below) does NOT write to Firestore
 * from here — it calls the submitQuiz Cloud Function, which grades
 * authoritatively server-side (against its own read of this same
 * document) and records progress/attempts itself. This file never
 * computes a score or writes a result.
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { friendlyCallableError } from './callableErrors'
import { getDefaultQuizConfig } from '../features/admin/quiz-config/services/quizConfigService'
import { getOrSeedDoc, overwriteDoc, mergeDoc } from './firestoreDoc'

const COLLECTION = 'moduleQuizzes'

/**
 * @param {string} moduleId
 * @returns {Promise<import('../features/admin/quiz-config/types/quizConfigAdmin.types').QuizConfig | null>}
 */
export async function getQuiz(moduleId) {
  return getOrSeedDoc(COLLECTION, moduleId, getDefaultQuizConfig(moduleId))
}

/**
 * @param {string} moduleId
 * @param {object} patch
 */
export async function updateQuiz(moduleId, patch) {
  await mergeDoc(COLLECTION, moduleId, patch)
}

/**
 * @param {string} moduleId
 * @param {object} data  Full quiz document to overwrite with.
 */
export async function saveQuiz(moduleId, data) {
  await overwriteDoc(COLLECTION, moduleId, data)
}

/**
 * The original seed values — never mutated. Used by "Reset to Defaults".
 * @param {string} moduleId
 * @returns {object|null}
 */
export function getDefaultQuiz(moduleId) {
  return getDefaultQuizConfig(moduleId)
}

/**
 * Submits one quiz attempt for grading. The server re-reads this same
 * quiz document itself to grade — `answers` is the only input trusted
 * from the client, never a score. Also records the attempt and (on a
 * pass) completes the module and unlocks the next one, all atomically.
 * @param {string} moduleId
 * @param {Record<string,string>} answers  questionId -> choiceId
 * @returns {Promise<{score:number, correctCount:number, total:number, passed:boolean,
 *   passingScore:number, attemptsUsed:number, attemptsRemaining:number|null,
 *   moduleCompleted:boolean, perQuestionResults:Array<{questionId:string, correct:boolean,
 *   selectedChoiceId:string|null, correctChoiceId:string, explanation:string}>}>}
 */
export async function submitQuiz(moduleId, answers) {
  try {
    const call = httpsCallable(functions, 'submitQuiz')
    const { data } = await call({ moduleId, answers })
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}
