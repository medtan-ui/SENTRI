import { admin, db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import {
  CreateModuleConfigurationInput,
  LessonContent,
  QuizConfig,
  ScenarioConfig,
  UpdateAssignmentsInput,
} from './models'

export async function setModule(moduleId: string, data: CreateModuleConfigurationInput): Promise<void> {
  await db.collection(COLLECTIONS.MODULES).doc(moduleId).set(data)
}

export async function getModule(moduleId: string): Promise<FirebaseFirestore.DocumentData | null> {
  const snap = await db.collection(COLLECTIONS.MODULES).doc(moduleId).get()
  return snap.exists ? snap.data()! : null
}

export async function mergeLesson(moduleId: string, patch: LessonContent): Promise<void> {
  await db.collection(COLLECTIONS.MODULE_LESSONS).doc(moduleId).set(patch, { merge: true })
}

export async function getLesson(moduleId: string): Promise<LessonContent | null> {
  const snap = await db.collection(COLLECTIONS.MODULE_LESSONS).doc(moduleId).get()
  return snap.exists ? (snap.data() as LessonContent) : null
}

export async function setScenarioConfig(moduleId: string, data: ScenarioConfig): Promise<void> {
  await db.collection(COLLECTIONS.MODULE_SCENARIOS).doc(moduleId).set(data)
}

export async function getScenarioConfig(moduleId: string): Promise<ScenarioConfig | null> {
  const snap = await db.collection(COLLECTIONS.MODULE_SCENARIOS).doc(moduleId).get()
  return snap.exists ? (snap.data() as ScenarioConfig) : null
}

export async function setQuizConfig(moduleId: string, data: QuizConfig): Promise<void> {
  await db.collection(COLLECTIONS.MODULE_QUIZZES).doc(moduleId).set(data)
}

export async function getQuizConfig(moduleId: string): Promise<QuizConfig | null> {
  const snap = await db.collection(COLLECTIONS.MODULE_QUIZZES).doc(moduleId).get()
  return snap.exists ? (snap.data() as QuizConfig) : null
}

export async function setAssignments(moduleId: string, input: UpdateAssignmentsInput): Promise<void> {
  await db
    .collection(COLLECTIONS.MODULE_ASSIGNMENTS)
    .doc(moduleId)
    .set({
      ...input,
      assignAll: input.assignmentType === 'all',
      assignmentDate: admin.firestore.FieldValue.serverTimestamp(),
    })
}

export async function getAssignments(moduleId: string): Promise<FirebaseFirestore.DocumentData | null> {
  const snap = await db.collection(COLLECTIONS.MODULE_ASSIGNMENTS).doc(moduleId).get()
  return snap.exists ? snap.data()! : null
}

/** Looks up multiple users/{uid} docs in one batch — used to verify
 * assignedStudentIds actually correspond to real student accounts. */
export async function getUsersByIds(uids: string[]): Promise<Map<string, FirebaseFirestore.DocumentData>> {
  const map = new Map<string, FirebaseFirestore.DocumentData>()
  if (uids.length === 0) return map
  const refs = uids.map((uid) => db.collection(COLLECTIONS.USERS).doc(uid))
  const snaps = await db.getAll(...refs)
  snaps.forEach((snap, index) => {
    if (snap.exists) map.set(uids[index], snap.data()!)
  })
  return map
}
