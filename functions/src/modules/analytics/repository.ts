import { admin, db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import { cohortDocId, normalizeSectionKey } from '../../shared/sections'
import { RecordAnalyticsEventInput } from './models'

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
  const snap = await db.collection(COLLECTIONS.SCENARIO_DECISION_RECORDS).where('module_id', '==', moduleId).get()
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
  const snap = await db.collection(COLLECTIONS.SCENARIO_DECISION_RECORDS).where('user_id', '==', userId).get()
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
 * Where a cohort rollup lives. With no section that is the single
 * well-known whole-class document ('current'); with one it is that
 * section's own document, so segmented and unsegmented reports coexist
 * instead of overwriting each other on every refresh.
 */
export function cohortAnalyticsRef(section?: string | null): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(cohortDocId(section))
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

export async function getAllModules(): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.MODULES).get()
  return snap.docs.map((d) => d.data())
}

export interface StudentRoster {
  /** uid -> the section label exactly as typed, or null if unassigned. */
  sectionByUid: Map<string, string | null>
  /** uid -> the normalized grouping key, or null if unassigned. */
  keyByUid: Map<string, string | null>
  /** Total student accounts, the denominator for cohort coverage — which
   * progress documents alone can't give (a student who never opened a
   * module has no progress row). */
  totalStudents: number
}

/**
 * Every student account with its class group. One read serves both the
 * coverage denominator and the section filter, so a segmented aggregation
 * doesn't pay for the user collection twice.
 */
export async function getStudentRoster(): Promise<StudentRoster> {
  const snap = await db.collection(COLLECTIONS.USERS).where('role', '==', 'student').get()
  const sectionByUid = new Map<string, string | null>()
  const keyByUid = new Map<string, string | null>()

  snap.docs.forEach((docSnap) => {
    const raw = docSnap.data().section
    const label = typeof raw === 'string' && raw.trim() ? raw.trim() : null
    sectionByUid.set(docSnap.id, label)
    keyByUid.set(docSnap.id, normalizeSectionKey(label))
  })

  return { sectionByUid, keyByUid, totalStudents: snap.size }
}

/**
 * Distinct sections in use, each with its student count — what populates
 * the admin dashboard's section picker. Derived from the roster rather
 * than kept in its own collection: sections are a property of accounts, so
 * a separate list is one more thing that can drift out of date.
 */
export async function listSections(): Promise<
  Array<{ key: string; label: string; studentCount: number }>
> {
  const roster = await getStudentRoster()
  const byKey = new Map<string, { key: string; label: string; studentCount: number }>()

  roster.sectionByUid.forEach((label, uid) => {
    const key = roster.keyByUid.get(uid)
    if (!key || !label) return
    const existing = byKey.get(key)
    if (existing) existing.studentCount += 1
    else byKey.set(key, { key, label, studentCount: 1 })
  })

  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label))
}
