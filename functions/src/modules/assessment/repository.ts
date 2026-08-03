/**
 * modules/assessment/repository.ts
 * All direct Firestore access for the pre-test / post-test pair and the
 * shared `quiz_responses` item-analysis collection.
 */
import { admin, db } from '../../shared/admin'
import { AssessmentType, COLLECTIONS } from '../../shared/constants'
import { AssessmentConfig, QuizResponseDoc } from './models'

/**
 * The pre-test item bank, which doubles as the post-test item bank —
 * see models.ts for why both read the same document.
 */
export async function getAssessmentConfig(moduleId: string): Promise<AssessmentConfig | null> {
  const snap = await db.collection(COLLECTIONS.MODULE_PRETESTS).doc(moduleId).get()
  return snap.exists ? (snap.data() as AssessmentConfig) : null
}

/** A fresh, unwritten attempt id — generated outside any transaction. */
export function newAttemptId(): string {
  return db.collection(COLLECTIONS.QUIZ_RESPONSES).doc().id
}

export interface ResponseInput {
  questionId: string
  topic: string | null
  selectedChoiceId: string | null
  correctChoiceId: string
  isCorrect: boolean
  durationMs: number | null
}

/**
 * Writes one `quiz_responses` document per answered question, in a single
 * batch. Deliberately not part of the caller's transaction: a response
 * row is analytics, and losing the whole submission because an analytics
 * write failed would be the wrong trade. Callers commit the authoritative
 * attempt first, then call this.
 */
export async function writeResponses(
  userId: string,
  moduleId: string,
  assessmentType: AssessmentType,
  attemptId: string,
  responses: ResponseInput[],
): Promise<void> {
  if (responses.length === 0) return
  const batch = db.batch()
  responses.forEach((response) => {
    const ref = db.collection(COLLECTIONS.QUIZ_RESPONSES).doc()
    const doc: QuizResponseDoc = {
      userId,
      moduleId,
      assessmentType,
      attemptId,
      questionId: response.questionId,
      topic: response.topic,
      selectedChoiceId: response.selectedChoiceId,
      correctChoiceId: response.correctChoiceId,
      isCorrect: response.isCorrect,
      durationMs: response.durationMs,
      answeredAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    batch.set(ref, doc)
  })
  await batch.commit()
}

export async function getResponsesForModule(moduleId: string): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.QUIZ_RESPONSES).where('moduleId', '==', moduleId).get()
  return snap.docs.map((d) => d.data())
}

export async function getResponsesForStudent(userId: string): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.QUIZ_RESPONSES).where('userId', '==', userId).get()
  return snap.docs.map((d) => d.data())
}

export async function getAllResponses(): Promise<FirebaseFirestore.DocumentData[]> {
  const snap = await db.collection(COLLECTIONS.QUIZ_RESPONSES).get()
  return snap.docs.map((d) => d.data())
}
