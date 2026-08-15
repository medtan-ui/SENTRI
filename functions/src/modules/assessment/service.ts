/**
 * modules/assessment/service.ts
 * Grades the per-module pre-test — the ungraded baseline a student takes
 * once, before their first lesson. There is no passing score; the point is
 * measurement, not a gate.
 *
 * The matching "after" measurement is deliberately NOT here. It used to be
 * a per-module post-test taken right after each module's quiz, which meant
 * a student sat three separate tests per module (pre-test, quiz,
 * post-test) — the same instrument twice, a few minutes apart, six times
 * over. That was removed in favour of one end-of-curriculum final
 * assessment (modules/finalAssessment) whose item bank is seeded from these
 * same six pre-test banks, so normalized gain is still computed from
 * identical questions — just once, against the average of the six
 * baselines, instead of six times.
 *
 * Grading is server-side for two reasons. First, per-question responses
 * have to be recorded somewhere a student can't write (`quizResponses` is
 * Cloud Functions-only), or item analysis is worthless. Second, the final
 * assessment's gain compares against a stored pre-test score, and a client
 * that could compute either could manufacture an improvement.
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
  StudentAssessmentConfig,
  SubmitAssessmentResult,
} from './models'

/**
 * getAssessmentForStudent
 * The read the student pre-test page actually uses — never the raw
 * modulePretests document. Strips correctChoiceId and explanation from
 * every question, same reasoning and shape as quiz/service.ts's
 * getQuizForStudent. Returns null (not a thrown error) when this module's
 * item bank hasn't been configured yet.
 */
export async function getAssessmentForStudent(moduleId: string): Promise<StudentAssessmentConfig | null> {
  const config = await repo.getAssessmentConfig(moduleId)
  if (!config) return null
  return {
    moduleId: config.moduleId,
    title: config.title,
    questions: config.questions.map((q) => ({
      id: q.id,
      text: q.text,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
      topic: q.topic,
    })),
  }
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

  await db.runTransaction(async (txn) => {
    const ref = progressRef(userId, moduleId)
    const snap = await txn.get(ref)

    const current = snap.exists
      ? (snap.data() as ModuleProgressDoc)
      : defaultProgress(userId, moduleId, moduleDoc.moduleOrder, moduleDoc.moduleOrder === 1)

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
  }
}
