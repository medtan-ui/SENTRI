/**
 * lessonService.js
 * Firestore-backed access to the `moduleLessons` collection — one
 * module's lesson content (introduction, objectives, lesson content,
 * real-world example, best practices, key takeaways, references).
 *
 * Seeded lazily from the existing Lesson Content Editor's mock data —
 * see LESSON_CONTENT in src/pages/Admin/ModuleConfiguration/LessonEditor/
 * mockLessonContent.js — so already-authored lesson text becomes each
 * document's initial Firestore value instead of being thrown away.
 */
import { LESSON_CONTENT } from '../pages/Admin/ModuleConfiguration/LessonEditor/mockLessonContent'
import { getOrSeedDoc, overwriteDoc, mergeDoc } from './firestoreDoc'

const COLLECTION = 'moduleLessons'

function seedFor(moduleId) {
  const seed = LESSON_CONTENT[moduleId]
  if (!seed) return null
  return {
    moduleId,
    introduction: seed.introduction,
    objectives: [...seed.objectives],
    lessonContent: seed.lessonContent,
    realWorldExample: seed.realWorldExample,
    bestPractices: [...seed.bestPractices],
    keyTakeaways: [...seed.keyTakeaways],
    references: seed.references.map((r) => ({ ...r })),
  }
}

/**
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function getLesson(moduleId) {
  return getOrSeedDoc(COLLECTION, moduleId, seedFor(moduleId))
}

/**
 * @param {string} moduleId
 * @param {object} patch
 */
export async function updateLesson(moduleId, patch) {
  await mergeDoc(COLLECTION, moduleId, patch)
}

/**
 * @param {string} moduleId
 * @param {object} data  Full lesson document to overwrite with.
 */
export async function saveLesson(moduleId, data) {
  await overwriteDoc(COLLECTION, moduleId, data)
}

/**
 * The original seed values — never mutated. Used by "Discard Changes".
 * @param {string} moduleId
 * @returns {object|null}
 */
export function getDefaultLesson(moduleId) {
  return seedFor(moduleId)
}
