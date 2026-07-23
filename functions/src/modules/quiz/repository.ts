import { db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import { QuizConfig } from './models'

export async function getQuizConfig(moduleId: string): Promise<QuizConfig | null> {
  const snap = await db.collection(COLLECTIONS.MODULE_QUIZZES).doc(moduleId).get()
  return snap.exists ? (snap.data() as QuizConfig) : null
}

/** A fresh, unwritten ref for the new attempt doc — created outside the
 * transaction (Firestore allows generating an id without a read) so the
 * transaction body only has to `set` it. */
export function newAttemptRef(): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.QUIZ_ATTEMPTS).doc()
}
