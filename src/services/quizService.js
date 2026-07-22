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
 */
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
