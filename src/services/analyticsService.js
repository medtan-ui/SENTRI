/**
 * analyticsService.js
 * Thin client wrapper around the analytics Cloud Functions and the
 * moduleAnalytics summary documents they write. Aggregation itself only
 * happens server-side (aggregateModuleAnalytics) — this file never
 * computes stats client-side, it just triggers a recompute and reads the
 * resulting document back.
 */
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import { friendlyCallableError } from './callableErrors'

const COLLECTION = 'moduleAnalytics'
const STUDENT_COLLECTION = 'studentAnalytics'
const COHORT_COLLECTION = 'cohortAnalytics'
/** The single whole-cohort rollup document, mirroring COHORT_DOC_ID in
 * functions/src/modules/analytics/repository.ts. */
const COHORT_DOC_ID = 'current'

/**
 * Reads a module's last-aggregated analytics summary, or null if it has
 * never been aggregated yet.
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function getModuleAnalytics(moduleId) {
  const snap = await getDoc(doc(db, COLLECTION, moduleId))
  return snap.exists() ? snap.data() : null
}

/**
 * Recomputes and persists one module's analytics summary server-side.
 * @param {string} moduleId
 * @returns {Promise<object>} the freshly computed summary
 */
export async function aggregateModuleAnalytics(moduleId) {
  try {
    const call = httpsCallable(functions, 'aggregateModuleAnalytics')
    const { data } = await call({ moduleId })
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}

/**
 * The most recent quiz attempts across every student — admin-only per
 * firestore.rules (quizAttempts is written exclusively by the submitQuiz
 * Cloud Function). Used for the Admin Dashboard's live "recent activity" and
 * "average score" widgets so they don't depend on anyone having visited the
 * Analytics page first.
 * @param {number} [limitCount=10]
 * @returns {Promise<Array<{userId, moduleId, score, passed, attemptNumber, submittedAt}>>}
 */
export async function getRecentQuizAttempts(limitCount = 10) {
  const q = query(collection(db, 'quizAttempts'), orderBy('submittedAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

/**
 * Reads a student's last-aggregated analytics summary, or null if it has
 * never been aggregated yet. Rules allow the student themself or an admin.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getStudentAnalytics(userId) {
  const snap = await getDoc(doc(db, STUDENT_COLLECTION, userId))
  return snap.exists() ? snap.data() : null
}

/**
 * Recomputes and persists a student's analytics summary server-side. With
 * no userId, the Cloud Function resolves the caller's own uid from their
 * auth token (self-service, e.g. the student Progress page). An admin may
 * pass another student's userId to refresh it on their behalf (e.g. the
 * admin Individual Analytics view) — enforced server-side by
 * resolveTargetUid, which rejects a non-admin passing anyone but themself.
 * @param {string} [userId]
 * @returns {Promise<object>} the freshly computed summary
 */
export async function aggregateStudentAnalytics(userId) {
  try {
    const call = httpsCallable(functions, 'aggregateStudentAnalytics')
    const { data } = await call(userId ? { userId } : {})
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}

/**
 * The class-level rollup — the only summary that spans every module and
 * every student, and therefore the only place cross-module transfer and
 * cohort-wide learning gain can be reported from. Admin-only.
 * @returns {Promise<object|null>}
 */
export async function getCohortAnalytics() {
  const snap = await getDoc(doc(db, COHORT_COLLECTION, COHORT_DOC_ID))
  return snap.exists() ? snap.data() : null
}

/**
 * Recomputes and persists the cohort rollup server-side.
 * @returns {Promise<object>} the freshly computed summary
 */
export async function aggregateCohortAnalytics() {
  try {
    const call = httpsCallable(functions, 'aggregateCohortAnalytics')
    const { data } = await call({})
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}
