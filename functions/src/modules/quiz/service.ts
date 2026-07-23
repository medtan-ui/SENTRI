/**
 * modules/quiz/service.ts
 * Grading is authoritative here: the client only ever sends
 * questionId -> choiceId answers, never a score. correctChoiceId lives
 * only in this server-side read of moduleQuizzes, so a student can no
 * longer see or forge their own result.
 *
 * Exactly one attempt is allowed, ever, and submitting it always completes
 * the module and unlocks the next one regardless of score — the score is
 * still recorded (for the student's own record and for admin analytics),
 * it just no longer gates progress. Recording the attempt and unlocking
 * the next module happen in one transaction — the same "gather every read
 * first, then write" shape used in modules/progress/service.ts, since this
 * transaction touches both the current module's progress doc and the next
 * module's.
 */
import { admin, db } from '../../shared/admin'
import { AppError } from '../../shared/errors'
import { getModuleOrThrow, getNextModule, ModuleDoc } from '../../shared/moduleGuards'
import { ModuleProgressDoc } from '../progress/models'
import { defaultProgress, progressRef } from '../progress/repository'
import { applyUnlockPlan, planUnlock } from '../progress/service'
import * as repo from './repository'
import { PerQuestionResult, QuizConfig, SubmitQuizResult } from './models'

export function gradeQuiz(
  quiz: QuizConfig,
  answers: Record<string, string>,
): { perQuestionResults: PerQuestionResult[]; correctCount: number; total: number; score: number } {
  const perQuestionResults: PerQuestionResult[] = quiz.questions.map((question) => {
    const selectedChoiceId = answers[question.id] ?? null
    const correct = selectedChoiceId !== null && selectedChoiceId === question.correctChoiceId
    return {
      questionId: question.id,
      correct,
      selectedChoiceId,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
    }
  })
  const total = quiz.questions.length
  const correctCount = perQuestionResults.filter((r) => r.correct).length
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
  return { perQuestionResults, correctCount, total, score }
}

function assertAnswersReferenceRealChoices(quiz: QuizConfig, answers: Record<string, string>): void {
  const questionsById = new Map(quiz.questions.map((q) => [q.id, q]))
  for (const [questionId, choiceId] of Object.entries(answers)) {
    const question = questionsById.get(questionId)
    if (!question) {
      throw new AppError('invalid-argument', `Question "${questionId}" does not exist on this quiz.`)
    }
    if (!question.choices.some((c) => c.id === choiceId)) {
      throw new AppError('invalid-argument', `Choice "${choiceId}" does not exist for question "${questionId}".`)
    }
  }
}

export async function submitQuiz(
  userId: string,
  moduleId: string,
  answers: Record<string, string>,
): Promise<SubmitQuizResult> {
  const moduleDoc: ModuleDoc = await getModuleOrThrow(moduleId)

  const quiz = await repo.getQuizConfig(moduleId)
  if (!quiz) {
    throw new AppError('not-found', `Module "${moduleId}" has no quiz configured yet.`)
  }
  if (quiz.settings.available === false) {
    throw new AppError('failed-precondition', `The quiz for "${moduleId}" is not currently available.`)
  }

  assertAnswersReferenceRealChoices(quiz, answers)

  const { perQuestionResults, correctCount, total, score } = gradeQuiz(quiz, answers)
  const passed = score >= quiz.settings.passingScore
  // One attempt always completes the module and unlocks the next one,
  // regardless of score — never gated on `passed`.
  const nextModuleDoc = await getNextModule(moduleDoc.moduleOrder)

  const attemptRef = repo.newAttemptRef()

  await db.runTransaction(async (txn) => {
    const progressDocRef = progressRef(userId, moduleId)
    const progressSnap = await txn.get(progressDocRef)

    let nextProgressSnap: FirebaseFirestore.DocumentSnapshot | null = null
    if (nextModuleDoc) {
      nextProgressSnap = await txn.get(progressRef(userId, nextModuleDoc.moduleId))
    }

    // -- every read is done; only writes from here on --
    const current = progressSnap.exists
      ? (progressSnap.data() as ModuleProgressDoc)
      : defaultProgress(userId, moduleId, moduleDoc.moduleOrder, true)

    if ((current.attempts || 0) >= 1) {
      // Re-checked inside the transaction to close the race window between
      // any pre-check and this commit (e.g. a double-submit from two tabs).
      throw new AppError('failed-precondition', 'This quiz has already been submitted — only one attempt is allowed.')
    }

    const patch: Partial<ModuleProgressDoc> = {
      attempts: 1,
      score,
      quizCompleted: true,
      moduleCompleted: true,
      completionDate: admin.firestore.FieldValue.serverTimestamp(),
      lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
    }
    txn.set(progressDocRef, { ...current, ...patch }, { merge: true })

    txn.set(attemptRef, {
      userId,
      moduleId,
      answers,
      perQuestionResults,
      score,
      correctCount,
      total,
      passed,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (nextModuleDoc && nextProgressSnap) {
      applyUnlockPlan(txn, planUnlock(nextModuleDoc, nextProgressSnap, userId))
    }
  })

  return {
    score,
    correctCount,
    total,
    passed,
    passingScore: quiz.settings.passingScore,
    moduleCompleted: true,
    perQuestionResults,
  }
}
