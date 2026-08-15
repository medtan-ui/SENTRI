/**
 * modules/finalAssessment/service.ts
 * Grades the single end-of-curriculum assessment.
 *
 * ── Why this exists ──────────────────────────────────────────────────
 * Each module used to end with its own post-test, re-administering that
 * module's pre-test items minutes after its quiz. Six modules meant a
 * student sat eighteen separate assessments. This collapses the six post
 * measurements into one test taken after the whole curriculum, which is
 * both far less testing and a better measure — retention a week later is
 * worth more than recall five minutes after reading the lesson.
 *
 * ── Why the gain is still honest ─────────────────────────────────────
 * The item bank is seeded from the same six pre-test banks, so the
 * "after" score is computed from the same questions as the six "before"
 * scores. Gain is Hake's g against the *mean* of the six pre-test scores.
 * Both the average and the gain are written once, at submit time, so a
 * later pre-test reset or item-bank edit can't retroactively move a
 * number that has already been reported.
 *
 * ── Eligibility ──────────────────────────────────────────────────────
 * All six modules must be complete. Re-checked inside the transaction
 * rather than only up front, so two tabs can't both pass a stale read.
 */
import { admin, db } from '../../shared/admin'
import { AppError } from '../../shared/errors'
import { REAL_MODULE_IDS } from '../../shared/constants'
import * as assessmentRepo from '../assessment/repository'
import * as repo from './repository'
import {
  FinalAssessmentConfig,
  FinalAssessmentItemResult,
  FinalAssessmentProgressDoc,
  StudentFinalAssessmentConfig,
  SubmitFinalAssessmentResult,
} from './models'

/**
 * getFinalAssessmentForStudent
 * The read the student final assessment page actually uses — never the raw
 * finalAssessment/config document. Strips correctChoiceId, explanation, and
 * sourceModuleId from every question, same reasoning as the module quiz's
 * getQuizForStudent. Returns null (not a thrown error) when the assessment
 * hasn't been configured yet.
 */
export async function getFinalAssessmentForStudent(): Promise<StudentFinalAssessmentConfig | null> {
  const config = await repo.getConfig()
  if (!config) return null
  return {
    title: config.title,
    settings: config.settings,
    questions: config.questions.map((q) => ({
      id: q.id,
      order: q.order,
      text: q.text,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
      topic: q.topic,
    })),
  }
}

/**
 * Hake's normalized gain: how much of the available headroom a student
 * actually closed, rather than a raw point difference (which flatters
 * students who started low). Null when the pre-test average was already
 * 100 — there is no headroom to close, so the ratio is undefined.
 */
export function normalizedGain(preScore: number, postScore: number): number | null {
  if (preScore >= 100) return null
  const gain = (postScore - preScore) / (100 - preScore)
  return Math.round(Math.max(-1, Math.min(1, gain)) * 100) / 100
}

/** Mean of whatever pre-test scores actually exist, or null if none do. */
export function averagePreTestScore(scores: (number | null | undefined)[]): number | null {
  const real = scores.filter((s): s is number => typeof s === 'number')
  if (real.length === 0) return null
  return Math.round(real.reduce((sum, s) => sum + s, 0) / real.length)
}

export function gradeFinalAssessment(
  config: FinalAssessmentConfig,
  answers: Record<string, string>,
  durations: Record<string, number> = {},
): { perQuestionResults: FinalAssessmentItemResult[]; correctCount: number; total: number; score: number } {
  const perQuestionResults: FinalAssessmentItemResult[] = config.questions.map((question) => {
    const selectedChoiceId = answers[question.id] ?? null
    const rawDuration = durations[question.id]
    return {
      questionId: question.id,
      topic: question.topic ?? null,
      sourceModuleId: question.sourceModuleId ?? null,
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
  config: FinalAssessmentConfig,
  answers: Record<string, string>,
): void {
  const questionsById = new Map(config.questions.map((q) => [q.id, q]))
  for (const [questionId, choiceId] of Object.entries(answers)) {
    const question = questionsById.get(questionId)
    if (!question) {
      throw new AppError('invalid-argument', `Question "${questionId}" does not exist on the final assessment.`)
    }
    if (!question.choices.some((c) => c.id === choiceId)) {
      throw new AppError('invalid-argument', `Choice "${choiceId}" does not exist for question "${questionId}".`)
    }
  }
}

export async function submitFinalAssessment(
  userId: string,
  answers: Record<string, string>,
  durations: Record<string, number> = {},
): Promise<SubmitFinalAssessmentResult> {
  const config = await repo.getConfig()
  if (!config) {
    throw new AppError('not-found', 'The final assessment has not been configured yet.')
  }
  if (config.settings.available === false) {
    throw new AppError('failed-precondition', 'The final assessment is not currently available.')
  }

  assertAnswersReferenceRealChoices(config, answers)

  const moduleProgress = await repo.getAllModuleProgress(userId)
  const completedCount = moduleProgress.filter((p) => p.moduleCompleted).length
  if (completedCount < REAL_MODULE_IDS.length) {
    throw new AppError(
      'failed-precondition',
      `The final assessment unlocks once all ${REAL_MODULE_IDS.length} modules are complete — ${completedCount} done so far.`,
    )
  }

  const preAverage = averagePreTestScore(moduleProgress.map((p) => p.preTestScore))
  const { perQuestionResults, correctCount, total, score } = gradeFinalAssessment(config, answers, durations)
  const passed = score >= config.settings.passingScore
  const gain = preAverage === null ? null : normalizedGain(preAverage, score)
  const configuredAttempts =
    typeof config.settings.attemptsAllowed === 'number' ? config.settings.attemptsAllowed : 1

  const attemptId = repo.newAttemptId()
  let attemptNumber = 1
  let attemptsAllowed = configuredAttempts

  await db.runTransaction(async (txn) => {
    const ref = repo.progressRef(userId)
    const snap = await txn.get(ref)

    const current: FinalAssessmentProgressDoc = snap.exists
      ? (snap.data() as FinalAssessmentProgressDoc)
      : repo.defaultProgress(userId, configuredAttempts)

    // A per-student override (set by an admin appeal) wins over the
    // config default, same shape as the module quiz's attemptsAllowed.
    attemptsAllowed =
      typeof current.attemptsAllowed === 'number'
        ? Math.max(current.attemptsAllowed, configuredAttempts)
        : configuredAttempts

    const used = current.attempts || 0
    if (used >= attemptsAllowed) {
      throw new AppError(
        'failed-precondition',
        attemptsAllowed > 1
          ? `All ${attemptsAllowed} allowed attempts for the final assessment have been used.`
          : 'The final assessment has already been submitted — only one attempt is allowed.',
      )
    }
    attemptNumber = used + 1

    txn.set(
      ref,
      {
        ...current,
        userId,
        completed: true,
        // A granted retake only replaces the recorded score when it beats
        // the previous one, so a retry can never leave a student worse off.
        score: typeof current.score === 'number' ? Math.max(current.score, score) : score,
        passed: Boolean(current.passed) || passed,
        attempts: attemptNumber,
        attemptsAllowed,
        averagePreTestScore: preAverage,
        normalizedGain: gain,
        completedAt: current.completedAt ?? admin.firestore.FieldValue.serverTimestamp(),
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })

  // Analytics only, and deliberately outside the transaction: losing a
  // graded submission because an analytics batch failed would be the
  // wrong trade. Recorded as 'posttest' so pre/post item analysis keeps
  // comparing identical items without any change to that query.
  await assessmentRepo
    .writeResponses(
      userId,
      // Fallback only. Each row overrides this with the module its item
      // was seeded from, so per-module and per-topic analysis survives the
      // move from six post-tests to one.
      '',
      'posttest',
      attemptId,
      perQuestionResults.map((r) => ({
        questionId: r.questionId,
        topic: r.topic,
        selectedChoiceId: r.selectedChoiceId,
        correctChoiceId: r.correctChoiceId,
        isCorrect: r.correct,
        durationMs: r.durationMs,
        moduleId: r.sourceModuleId ?? undefined,
      })),
    )
    .catch((err) => {
      console.error('[submitFinalAssessment] writeResponses failed — attempt already committed:', err)
    })

  return {
    score,
    correctCount,
    total,
    passed,
    passingScore: config.settings.passingScore,
    perQuestionResults,
    attemptNumber,
    attemptsAllowed,
    attemptsRemaining: Math.max(0, attemptsAllowed - attemptNumber),
    averagePreTestScore: preAverage,
    normalizedGain: gain,
  }
}
