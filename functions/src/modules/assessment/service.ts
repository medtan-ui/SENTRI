/**
 * modules/assessment/service.ts
 * Grades the ungraded bookends — the pre-test a student takes before
 * their first lesson, and the post-test they take after the module's
 * quiz. Neither has a passing score; the point is measurement, not a
 * gate.
 *
 * Grading moved server-side from the old client-side pre-test path for
 * two reasons. First, per-question responses have to be recorded
 * somewhere a student can't write (`quizResponses` is Cloud
 * Functions-only), or item analysis is worthless. Second, normalized gain
 * compares a post-test score against a stored pre-test score, and a
 * client that can compute either could manufacture an improvement.
 *
 * The transaction guards one-attempt-per-assessment: the check and the
 * write have to be atomic, or two tabs both pass a stale "not completed
 * yet" read.
 */
import { admin, db } from '../../shared/admin'
import { AppError } from '../../shared/errors'
import { getModuleOrThrow } from '../../shared/moduleGuards'
import { ModuleProgressDoc } from '../progress/models'
import { defaultProgress, progressRef } from '../progress/repository'
import * as repo from './repository'
import {
  AssessmentConfig,
  AssessmentItemResult,
  BookendAssessmentType,
  SubmitAssessmentResult,
} from './models'

/**
 * Hake's normalized gain: how much of the headroom a student actually
 * closed, rather than a raw point difference (which flatters students who
 * started low). Null when the pre-test was already 100 — there is no
 * headroom to close, so the ratio is undefined rather than zero.
 */
export function normalizedGain(preScore: number, postScore: number): number | null {
  if (preScore >= 100) return null
  const gain = (postScore - preScore) / (100 - preScore)
  return Math.round(Math.max(-1, Math.min(1, gain)) * 100) / 100
}

export function gradeAssessment(
  config: AssessmentConfig,
  answers: Record<string, string>,
  durations: Record<string, number> = {},
): { perQuestionResults: AssessmentItemResult[]; correctCount: number; total: number; score: number } {
  const perQuestionResults: AssessmentItemResult[] = config.questions.map((question) => {
    const selectedChoiceId = answers[question.id] ?? null
    const rawDuration = durations[question.id]
    return {
      questionId: question.id,
      topic: question.topic ?? null,
      correct: selectedChoiceId !== null && selectedChoiceId === question.correctChoiceId,
      selectedChoiceId,
      correctChoiceId: question.correctChoiceId,
      explanation: question.explanation,
      durationMs: typeof rawDuration === 'number' && rawDuration >= 0 ? Math.round(rawDuration) : null,
    }
  })
  const total = config.questions.length
  const correctCount = perQuestionResults.filter((r) => r.correct).length
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
  return { perQuestionResults, correctCount, total, score }
}

function assertAnswersReferenceRealChoices(
  config: AssessmentConfig,
  answers: Record<string, string>,
): void {
  const questionsById = new Map(config.questions.map((q) => [q.id, q]))
  for (const [questionId, choiceId] of Object.entries(answers)) {
    const question = questionsById.get(questionId)
    if (!question) {
      throw new AppError('invalid-argument', `Question "${questionId}" does not exist on this assessment.`)
    }
    if (!question.choices.some((c) => c.id === choiceId)) {
      throw new AppError('invalid-argument', `Choice "${choiceId}" does not exist for question "${questionId}".`)
    }
  }
}

export async function submitAssessment(
  userId: string,
  moduleId: string,
  assessmentType: BookendAssessmentType,
  answers: Record<string, string>,
  durations: Record<string, number> = {},
): Promise<SubmitAssessmentResult> {
  const moduleDoc = await getModuleOrThrow(moduleId)

  const config = await repo.getAssessmentConfig(moduleId)
  if (!config) {
    throw new AppError('not-found', `Module "${moduleId}" has no assessment items configured yet.`)
  }

  assertAnswersReferenceRealChoices(config, answers)

  const { perQuestionResults, correctCount, total, score } = gradeAssessment(config, answers, durations)
  const attemptId = repo.newAttemptId()

  let preTestScore: number | null = null

  await db.runTransaction(async (txn) => {
    const ref = progressRef(userId, moduleId)
    const snap = await txn.get(ref)

    const current = snap.exists
      ? (snap.data() as ModuleProgressDoc)
      : defaultProgress(userId, moduleId, moduleDoc.moduleOrder, moduleDoc.moduleOrder === 1)

    if (assessmentType === 'pretest') {
      if (current.preTestCompleted) {
        throw new AppError('failed-precondition', 'The pre-test for this module has already been submitted.')
      }
      txn.set(
        ref,
        {
          ...current,
          preTestCompleted: true,
          preTestScore: score,
          preTestCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      return
    }

    // ── post-test ──
    if (!current.quizCompleted) {
      throw new AppError(
        'failed-precondition',
        'The post-test unlocks after this module\'s quiz has been submitted.',
      )
    }
    if (current.postTestCompleted) {
      throw new AppError('failed-precondition', 'The post-test for this module has already been submitted.')
    }

    preTestScore = typeof current.preTestScore === 'number' ? current.preTestScore : null

    txn.set(
      ref,
      {
        ...current,
        postTestCompleted: true,
        postTestScore: score,
        postTestCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Stored rather than recomputed on read, so a later edit to the
        // item bank can't retroactively change a reported gain.
        normalizedGain: preTestScore === null ? null : normalizedGain(preTestScore, score),
        lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })

  // Analytics only — written after the authoritative commit so a failure
  // here can never lose a student's submission.
  await repo
    .writeResponses(
      userId,
      moduleId,
      assessmentType,
      attemptId,
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
      console.error('[submitAssessment] writeResponses failed — submission already committed:', err)
    })

  return {
    assessmentType,
    score,
    correctCount,
    total,
    perQuestionResults,
    normalizedGain:
      assessmentType === 'posttest' && preTestScore !== null ? normalizedGain(preTestScore, score) : null,
    preTestScore,
  }
}
