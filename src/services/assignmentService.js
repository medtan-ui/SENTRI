/**
 * assignmentService.js
 * Firestore-backed access to the `moduleAssignments` collection — which
 * students/sections a module is assigned to (or "assign all"), and when
 * that assignment was last set.
 *
 * Seeded lazily from the existing curriculum mock data's assignedGroups
 * — see MODULES in src/pages/Admin/Modules/mockModules.js — so the
 * sections already shown on each module's curriculum card become the
 * starting assignment instead of an empty, contextless default.
 */
import { serverTimestamp } from 'firebase/firestore'
import { MODULES } from '../pages/Admin/Modules/mockModules'
import { getOrSeedDoc, overwriteDoc, mergeDoc } from './firestoreDoc'

const COLLECTION = 'moduleAssignments'

function seedFor(moduleId) {
  const m = MODULES.find((mod) => mod.id === moduleId)
  if (!m) return null
  const assignmentType = m.assignedGroups.length > 0 ? 'sections' : 'all'
  return {
    moduleId,
    assignmentType,
    assignedSections: [...m.assignedGroups],
    assignedStudentIds: [],
    assignAll: assignmentType === 'all',
    assignmentDate: null,
  }
}

/**
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function getAssignments(moduleId) {
  return getOrSeedDoc(COLLECTION, moduleId, seedFor(moduleId))
}

/**
 * @param {string} moduleId
 * @param {object} patch
 */
export async function updateAssignments(moduleId, patch) {
  await mergeDoc(COLLECTION, moduleId, patch)
}

/**
 * Full overwrite. `assignAll` is derived from `assignmentType` here (kept
 * in sync automatically rather than trusted from the caller), and
 * `assignmentDate` is always stamped with the server's current time —
 * there is no separate "assignment date" input in the UI; this records
 * when the assignment configuration was last saved.
 * @param {string} moduleId
 * @param {object} data
 */
export async function saveAssignments(moduleId, data) {
  await overwriteDoc(COLLECTION, moduleId, {
    ...data,
    assignAll: data.assignmentType === 'all',
    assignmentDate: serverTimestamp(),
  })
}

/**
 * The original seed values — never mutated. Used by "Reset to Defaults".
 * @param {string} moduleId
 * @returns {object|null}
 */
export function getDefaultAssignments(moduleId) {
  return seedFor(moduleId)
}
