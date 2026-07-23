/**
 * modules/progress/repository.ts
 * All direct Firestore access for the moduleProgress collection. Doc id
 * convention (`${userId}_${moduleId}`) matches the frontend's
 * moduleProgressService.js so both sides address the same documents.
 */
import { admin, db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import { ModuleProgressDoc } from './models'

export function progressDocId(userId: string, moduleId: string): string {
  return `${userId}_${moduleId}`
}

export function progressRef(userId: string, moduleId: string): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.MODULE_PROGRESS).doc(progressDocId(userId, moduleId))
}

export function defaultProgress(
  userId: string,
  moduleId: string,
  moduleOrder: number,
  isUnlocked: boolean,
): ModuleProgressDoc {
  return {
    userId,
    moduleId,
    moduleOrder,
    isUnlocked,
    lessonStarted: false,
    lessonCompleted: false,
    simulationCompleted: false,
    quizCompleted: false,
    moduleCompleted: false,
    score: null,
    attempts: 0,
    lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
    completionDate: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }
}

export async function getProgress(userId: string, moduleId: string): Promise<ModuleProgressDoc | null> {
  const snap = await progressRef(userId, moduleId).get()
  return snap.exists ? (snap.data() as ModuleProgressDoc) : null
}
