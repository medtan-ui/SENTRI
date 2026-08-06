/**
 * modules/finalAssessment/repository.ts
 * All direct Firestore access for the single end-of-curriculum
 * assessment: its one config document and one progress document per
 * student.
 */
import { admin, db } from '../../shared/admin'
import { COLLECTIONS, FINAL_ASSESSMENT_DOC_ID, REAL_MODULE_IDS } from '../../shared/constants'
import { ModuleProgressDoc } from '../progress/models'
import { progressDocId } from '../progress/repository'
import { FinalAssessmentConfig, FinalAssessmentProgressDoc } from './models'

export function configRef(): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.FINAL_ASSESSMENT).doc(FINAL_ASSESSMENT_DOC_ID)
}

export function progressRef(userId: string): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.FINAL_ASSESSMENT_PROGRESS).doc(userId)
}

export async function getConfig(): Promise<FinalAssessmentConfig | null> {
  const snap = await configRef().get()
  return snap.exists ? (snap.data() as FinalAssessmentConfig) : null
}

export function defaultProgress(userId: string, attemptsAllowed: number): FinalAssessmentProgressDoc {
  return {
    userId,
    completed: false,
    score: null,
    passed: false,
    attempts: 0,
    attemptsAllowed,
    averagePreTestScore: null,
    normalizedGain: null,
    completedAt: null,
    lastAttemptAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }
}

/** A fresh, unwritten attempt id — generated outside any transaction. */
export function newAttemptId(): string {
  return db.collection(COLLECTIONS.QUIZ_RESPONSES).doc().id
}

/**
 * Every module progress row for one student, read in a single getAll
 * rather than six sequential gets. Used both to check that all six
 * modules are actually complete and to average the pre-test scores.
 */
export async function getAllModuleProgress(userId: string): Promise<ModuleProgressDoc[]> {
  const refs = REAL_MODULE_IDS.map((moduleId) =>
    db.collection(COLLECTIONS.MODULE_PROGRESS).doc(progressDocId(userId, moduleId)),
  )
  const snaps = await db.getAll(...refs)
  return snaps.filter((s) => s.exists).map((s) => s.data() as ModuleProgressDoc)
}
