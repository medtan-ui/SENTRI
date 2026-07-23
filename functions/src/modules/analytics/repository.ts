import { admin, db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import { RecordAnalyticsEventInput } from './models'

export async function writeAnalyticsEvent(userId: string, input: RecordAnalyticsEventInput): Promise<string> {
  const ref = await db.collection(COLLECTIONS.ANALYTICS_EVENTS).add({
    userId,
    moduleId: input.moduleId ?? null,
    eventType: input.eventType,
    payload: input.payload ?? null,
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
