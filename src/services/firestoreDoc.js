/**
 * firestoreDoc.js
 * ─────────────────────────────────────────────────────────────
 * Shared low-level Firestore helpers used by every Training Curriculum
 * service (moduleService, lessonService, scenarioService, quizService,
 * assignmentService). Keeping this in one place means:
 *   - the "read, or lazily seed from mock defaults" pattern is written
 *     once, not five times
 *   - Firestore error codes are translated to friendly messages
 *     consistently everywhere
 *   - a future Analytics layer (or Cloud Functions migration) has one
 *     seam to instrument instead of five
 *
 * No React here — this is the pure "Services → Firestore" layer.
 * ─────────────────────────────────────────────────────────────
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const ERROR_MESSAGES = {
  'permission-denied': 'You do not have permission to access this data.',
  unavailable: 'Network error. Please check your connection and try again.',
  cancelled: 'The request was cancelled. Please try again.',
  'deadline-exceeded': 'The request timed out. Please try again.',
}

function friendlyError(err) {
  return ERROR_MESSAGES[err?.code] || 'Something went wrong loading this data. Please try again.'
}

/**
 * Reads a document; if it doesn't exist yet, writes `seed` as its
 * initial content (a one-time lazy migration from mock data) and
 * returns that instead. Every Training Curriculum collection is seeded
 * this way — there is no separate seed script or Cloud Function.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {object|null} seed  Pass null when there is no seed for this id
 *   (e.g. an unrecognized moduleId) — the function then returns null
 *   instead of writing anything.
 * @returns {Promise<object|null>}
 */
export async function getOrSeedDoc(collectionName, docId, seed) {
  try {
    const ref = doc(db, collectionName, docId)
    const snap = await getDoc(ref)
    if (snap.exists()) return snap.data()
    if (!seed) return null
    try {
      await setDoc(ref, seed)
      return seed
    } catch (writeErr) {
      // Two concurrent first-reads of the same never-seeded doc can both
      // observe "doesn't exist" and both attempt to create it — whoever
      // commits second is, from Firestore's point of view, now updating
      // an existing doc, which non-admin callers (students reading
      // modules/moduleQuizzes) aren't allowed to do. Re-read once before
      // treating that as a real failure; the winner's data is just as
      // valid as what this caller would have written.
      if (writeErr?.code === 'permission-denied') {
        const retrySnap = await getDoc(ref)
        if (retrySnap.exists()) return retrySnap.data()
      }
      throw writeErr
    }
  } catch (err) {
    console.error(`[firestoreDoc] getOrSeedDoc(${collectionName}/${docId}) failed:`, err)
    throw new Error(friendlyError(err))
  }
}

/**
 * Reads every document in a collection whose id is in `docIds`, lazily
 * seeding any that don't exist yet (same as getOrSeedDoc, batched).
 * Used by list views (e.g. the curriculum grid) that need several fixed,
 * known documents at once rather than one at a time.
 *
 * @param {string} collectionName
 * @param {string[]} docIds
 * @param {(docId: string) => object} getSeed
 * @returns {Promise<object[]>}
 */
export async function getOrSeedDocs(collectionName, docIds, getSeed) {
  return Promise.all(docIds.map((id) => getOrSeedDoc(collectionName, id, getSeed(id))))
}

/**
 * Full overwrite of a document — used by "Save" flows where the caller
 * already holds the complete, validated object to persist.
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 */
export async function overwriteDoc(collectionName, docId, data) {
  try {
    await setDoc(doc(db, collectionName, docId), data)
  } catch (err) {
    console.error(`[firestoreDoc] overwriteDoc(${collectionName}/${docId}) failed:`, err)
    throw new Error(friendlyError(err))
  }
}

/**
 * Partial merge-update of a document — for granular field changes that
 * don't need the caller to resend the entire document.
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} patch
 */
export async function mergeDoc(collectionName, docId, patch) {
  try {
    await updateDoc(doc(db, collectionName, docId), patch)
  } catch (err) {
    console.error(`[firestoreDoc] mergeDoc(${collectionName}/${docId}) failed:`, err)
    throw new Error(friendlyError(err))
  }
}
