import { admin, db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import { RecordAnalyticsEventInput } from './models'

/** The single whole-cohort rollup document. */
export const COHORT_DOC_ID = 'current'

export async function writeAnalyticsEvent(userId: string, input: RecordAnalyticsEventInput): Promise<string> {
  const ref = await db.collection(COLLECTIONS.ANALYTICS_EVENTS).add({
    userId,
    moduleId: input.moduleId ?? null,
    eventType: input.eventType,
    payload: input.payload ?? null,
    // Null, not 0, when the client didn't measure it — an unmeasured
    // activity must never be averaged in as an instantaneous one.
    durationMs: typeof input.durationMs === 'number' ? Math.round(input.durationMs) : null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return ref.id
}

export async function getModuleProgressForModule(moduleId: string): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.MODULE_PROGRESS).where('moduleId', '==', moduleId).get()
  return snap.docs.map((d) => d.data())
}

export async function getQuizAttemptsForModule(moduleId: string): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.QUIZ_ATTEMPTS).where('moduleId', '==', moduleId).get()
  return snap.docs.map((d) => d.data())
}

export async function getScenarioDecisionsForModule(moduleId: string): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.SCENARIO_DECISION_RECORDS).where('moduleId', '==', moduleId).get()
  return snap.docs.map((d) => d.data())
}

export async function getModuleProgressForStudent(userId: string): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.MODULE_PROGRESS).where('userId', '==', userId).get()
  return snap.docs.map((d) => d.data())
}

export async function getQuizAttemptsForStudent(userId: string): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.QUIZ_ATTEMPTS).where('userId', '==', userId).get()
  return snap.docs.map((d) => d.data())
}

export async function getScenarioDecisionsForStudent(userId: string): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.SCENARIO_DECISION_RECORDS).where('userId', '==', userId).get()
  return snap.docs.map((d) => d.data())
}

export function moduleAnalyticsRef(moduleId: string): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.MODULE_ANALYTICS).doc(moduleId)
}

export function studentAnalyticsRef(userId: string): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.STUDENT_ANALYTICS).doc(userId)
}

export function learningAnalyticsRef(userId: string, moduleId: string): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.LEARNING_ANALYTICS).doc(`${userId}_${moduleId}`)
}

/**
 * Where the cohort rollup lives — one well-known document covering every
 * student, rewritten in place on each aggregation.
 */
export function cohortAnalyticsRef(): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(COHORT_DOC_ID)
}

export async function getAllModuleProgress(): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.MODULE_PROGRESS).get()
  return snap.docs.map((d) => d.data())
}

export async function getAllQuizAttempts(): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.QUIZ_ATTEMPTS).get()
  return snap.docs.map((d) => d.data())
}

export async function getAllScenarioDecisions(): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.SCENARIO_DECISION_RECORDS).get()
  return snap.docs.map((d) => d.data())
}

/**
 * Every student's reward document. Read whole because the cohort rollup
 * needs the badge lists themselves, not a count — "how many people have
 * this badge" cannot be answered by a where clause over an array of ids
 * without one query per badge.
 */
export async function getAllGamification(): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.GAMIFICATION).get()
  return snap.docs.map((doc) => doc.data())
}

export async function getAllModules(): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.MODULES).get()
  return snap.docs.map((d) => d.data())
}

export interface StudentRoster {
  /** Total student accounts, the denominator for cohort coverage — which
   * progress documents alone can't give (a student who never opened a
   * module has no progress row). */
  totalStudents: number
}

/**
 * The student head count. Read from the accounts collection rather than
 * derived from progress documents, because a student who has never opened
 * a module still belongs in the denominator.
 */
export async function getStudentRoster(): Promise<StudentRoster> {
  const snap = await db.collection(COLLECTIONS.USERS).where('role', '==', 'student').get()
  return { totalStudents: snap.size }
}
