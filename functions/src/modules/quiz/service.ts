/**
 * modules/quiz/service.ts
 * Grading is authoritative here: the client only ever sends
 * questionId -> choiceId answers, never a score. correctChoiceId lives
 * only in this server-side read of moduleQuizzes, so a student can no
 * longer see or forge their own result.
 *
 * ── Attempts ─────────────────────────────────────────────────────────
 * A quiz is one attempt by default, and submitting it always completes
 * the module and unlocks the next one regardless of score — the score is
 * recorded (for the student's own record and for admin analytics), it
 * just doesn't gate progress. An admin can grant exactly one extra
 * attempt through grantQuizRetry (modules/progress), which raises this
 * student's `attemptsAllowed` on that module; that field, not a hardcoded
 * 1, is what the transaction below checks. Recording the attempt and
 * unlocking the next module happen in one transaction — the same "gather
 * every read first, then write" shape used in modules/progress/service.ts.
 *
 * ── Per-question capture ─────────────────────────────────────────────
 * Every graded answer is also written to `quizResponses` (one document
 * per question), which is the grain item difficulty and per-topic
 * analysis need. That write happens *after* the transaction commits: it
 * is analytics, and losing a student's graded attempt because an
 * analytics batch failed would be the wrong trade.
 */
import { admin, db } from '../../shared/admin'
import { AppError } from '../../shared/errors'
import { getModuleOrThrow, getNextModule, ModuleDoc } from '../../shared/moduleGuards'
import * as assessmentRepo from '../assessment/repository'
import { ModuleProgressDoc } from '../progress/models'
import { defaultProgress, progressRef } from '../progress/repository'
import { applyUnlockPlan, planUnlock } from '../progress/service'
import * as repo from './repository'
import { PerQuestionResult, QuizConfig, StudentQuizConfig, SubmitQuizResult } from './models'

/**
 * getQuizForStudent
 * The read a student's own quiz-taking page actually uses — never the raw
 * moduleQuizzes document. Strips correctChoiceId and explanation from every
 * question before it leaves the server, so the answer key is no longer
 * visible in the network response (or to a direct Firestore read with a
 * student's own auth token) before they submit. Grading still happens in
 * submitQuiz below, against the server's own unfiltered read of this same
 * document — this function never grades anything, only serves the form.
 *
 * Returns null (not a thrown error) when the module has no quiz configured
 * yet, so the page's existing "Quiz Unavailable" state handles it with no
 * new client-side branching.
 */
export async function getQuizForStudent(moduleId: string): Promise<StudentQuizConfig | null> {
  const quiz = await repo.getQuizConfig(moduleId)
  if (!quiz) return null
  return {
    moduleId: quiz.moduleId,
    title: quiz.title,
    settings: quiz.settings,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      order: q.order,
      text: q.text,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
      topic: q.topic,
    })),
  }
}

export function gradeQuiz(
  quiz: QuizConfig,
  answers: Record<string, string>,
  durations: Record<string, number> = {},
): { perQuestionResults: PerQuestionResult[]; correctCount: number; total: number; score: number } {
  const perQuestionResults: PerQuestionResult[] = quiz.questions.map((question) => {
    const selectedChoiceId = answers[question.id] ?? null
    const correct = selectedChoiceId !== null && selectedChoiceId === question.correctChoiceId
    const rawDuration = durations[question.id]
    return {
      questionId: question.id,
      correct,
      selectedChoiceId,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
      topic: question.topic ?? null,
      durationMs: typeof rawDuration === 'number' && rawDuration >= 0 ? Math.round(rawDuration) : null,
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
  durations: Record<string, number> = {},
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

  const { perQuestionResults, correctCount, total, score } = gradeQuiz(quiz, answers, durations)
  const passed = score >= quiz.settings.passingScore
  // An attempt always completes the module and unlocks the next one,
  // regardless of score — never gated on `passed`.
  const nextModuleDoc = await getNextModule(moduleDoc.moduleOrder)

  const attemptRef = repo.newAttemptRef()
  let attemptNumber = 1
  let attemptsAllowed = 1

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

    const used = current.attempts || 0
    // Documents written before the retry path existed have no
    // attemptsAllowed; they behave exactly as before (one attempt).
    attemptsAllowed = typeof current.attemptsAllowed === 'number' ? current.attemptsAllowed : 1

    if (used >= attemptsAllowed) {
      // Re-checked inside the transaction to close the race window between
      // any pre-check and this commit (e.g. a double-submit from two tabs).
      throw new AppError(
        'failed-precondition',
        attemptsAllowed > 1
          ? `All ${attemptsAllowed} allowed attempts for this quiz have been used.`
          : 'This quiz has already been submitted — only one attempt is allowed.',
      )
    }

    attemptNumber = used + 1

    const patch: Partial<ModuleProgressDoc> = {
      attempts: attemptNumber,
      // A retake only replaces the recorded score when it beats the
      // previous one, so a granted retry can never make a student worse
      // off than the attempt that prompted the appeal.
      score: typeof current.score === 'number' ? Math.max(current.score, score) : score,
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
      attemptNumber,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (nextModuleDoc && nextProgressSnap) {
      applyUnlockPlan(txn, planUnlock(nextModuleDoc, nextProgressSnap, userId))
    }
  })

  await assessmentRepo
    .writeResponses(
      userId,
      moduleId,
      'quiz',
      attemptRef.id,
      perQuestionResults.map((r) => ({
        questionId: r.questionId,
        topic: r.topic,
        selectedChoiceId: r.selectedChoiceId,
        correctChoiceId: r.correctChoiceId,
        isCorrect: r.correct,
        durationMs: r.durationMs,
      })),
    )
    .catch((err) => {
      console.error('[submitQuiz] writeResponses failed — attempt already committed:', err)
    })

  return {
    score,
    correctCount,
    total,
    passed,
    passingScore: quiz.settings.passingScore,
    moduleCompleted: true,
    perQuestionResults,
    attemptNumber,
    attemptsAllowed,
    attemptsRemaining: Math.max(0, attemptsAllowed - attemptNumber),
  }
}
