/**
 * pretestService.js
 * Firestore-backed access to the `modulePretests` collection — one
 * module's fixed set of ungraded baseline questions, lazily seeded from
 * src/data/modulePretestContent.js on first read (same
 * getOrSeedDoc pattern src/services/quizService.js uses for
 * moduleQuizzes). There is no submit-to-a-Cloud-Function step here: a
 * pre-test has no stakes (no passing score, no attempt limit) so grading
 * happens client-side, in src/hooks/useModulePretest.js — completion
 * itself is recorded on the student's own moduleProgress doc via
 * markPretestCompleted (see moduleProgressService.js).
 */
import { getDefaultPretest } from '../data/modulePretestContent'
import { getOrSeedDoc } from './firestoreDoc'

const COLLECTION = 'modulePretests'

/**
 * @param {string} moduleId
 * @returns {Promise<{moduleId:string, title:string, questions:Array} | null>}
 */
export async function getPretest(moduleId) {
  return getOrSeedDoc(COLLECTION, moduleId, getDefaultPretest(moduleId))
}
