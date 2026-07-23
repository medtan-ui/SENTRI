/**
 * assignmentService.js
 * Firestore-backed access to the `moduleAssignments` collection — whether
 * a module is assigned to all students or a hand-picked list of specific
 * students, and when that assignment was last set. There is no "sections"
 * concept — assignment is kept to just students, either all of them or a
 * specific subset.
 */
import { serverTimestamp } from 'firebase/firestore'
import { getOrSeedDoc, overwriteDoc, mergeDoc } from './firestoreDoc'

const COLLECTION = 'moduleAssignments'

function seedFor(moduleId) {
  return {
    moduleId,
    assignmentType: 'all',
    assignedStudentIds: [],
    assignAll: true,
    assignmentDate: null,
  }
}

/** A doc written before "sections" was removed may still have
 * assignmentType: 'sections' — treat it as "all" rather than showing a
 * radio group with nothing selected. */
function normalize(data) {
  if (!data) return data
  if (data.assignmentType === 'sections') {
    return { ...data, assignmentType: 'all', assignedStudentIds: data.assignedStudentIds || [] }
  }
  return data
}

/**
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function getAssignments(moduleId) {
  const data = await getOrSeedDoc(COLLECTION, moduleId, seedFor(moduleId))
  return normalize(data)
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
