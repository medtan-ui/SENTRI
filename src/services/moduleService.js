/**
 * moduleService.js
 * Firestore-backed access to the `modules` collection — the base record
 * for one of SENTRI's six fixed cybersecurity modules (title,
 * description, difficulty, estimatedTime, status, prerequisite,
 * moduleOrder). This is the anchor collection every other Training
 * Curriculum collection (moduleLessons, moduleScenarios, moduleQuizzes,
 * moduleAssignments) is keyed against by the same moduleId.
 *
 * Seeded lazily from the existing curriculum mock data on first read —
 * see MODULES in src/pages/Admin/Modules/mockModules.js — so all the
 * already-authored content becomes each document's initial Firestore
 * value instead of being thrown away.
 */
import { MODULES } from '../pages/Admin/Modules/mockModules'
import { DIFFICULTY_FROM_CURRICULUM } from '../pages/Admin/ModuleConfiguration/mockConfigData'
import { getOrSeedDoc, getOrSeedDocs, overwriteDoc, mergeDoc } from './firestoreDoc'

const COLLECTION = 'modules'

const MODULE_IDS = MODULES.map((m) => m.id)

function seedFor(moduleId) {
  const index = MODULES.findIndex((m) => m.id === moduleId)
  if (index === -1) return null
  const m = MODULES[index]
  return {
    moduleId: m.id,
    title: m.name,
    description: m.shortDescription,
    // The curriculum grid's Beginner/Intermediate/Advanced scale is
    // converted once, here, at seed time — the Overview tab (the only
    // editor of this field) has always used Easy/Medium/Hard, so that
    // becomes this document's real, persisted scale from day one.
    difficulty: DIFFICULTY_FROM_CURRICULUM[m.difficulty] || 'Medium',
    estimatedTime: m.estimatedTime,
    status: m.status,
    prerequisite: m.prerequisiteId,
    moduleOrder: index + 1,
    icon: m.icon,
    color: m.color,
  }
}

/**
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function getModule(moduleId) {
  return getOrSeedDoc(COLLECTION, moduleId, seedFor(moduleId))
}

/**
 * @returns {Promise<object[]>} all six modules, sorted by moduleOrder
 */
export async function listModules() {
  const docs = await getOrSeedDocs(COLLECTION, MODULE_IDS, seedFor)
  return docs.filter(Boolean).sort((a, b) => a.moduleOrder - b.moduleOrder)
}

/**
 * @param {string} moduleId
 * @param {object} patch
 */
export async function updateModule(moduleId, patch) {
  await mergeDoc(COLLECTION, moduleId, patch)
}

/**
 * @param {string} moduleId
 * @param {object} data  Full module document to overwrite with.
 */
export async function saveModule(moduleId, data) {
  await overwriteDoc(COLLECTION, moduleId, data)
}

/**
 * The original seed values — never mutated. Used by "Reset to Defaults".
 * @param {string} moduleId
 * @returns {object|null}
 */
export function getDefaultModule(moduleId) {
  return seedFor(moduleId)
}
