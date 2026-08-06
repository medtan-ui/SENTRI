/**
 * Integration test — the full measurement loop, run against the Firestore
 * + Auth emulators (see package.json's `test:integration`). Every
 * callable is invoked through its actual exported `.run()`, the same
 * controller -> service -> repository path production traffic takes.
 *
 * Flow: an admin configures a module, its quiz, and its pre/post item
 * bank; a student takes the pre-test, works through the module, submits
 * the quiz, then takes the post-test — which must compute and store a
 * normalized gain against the pre-test score the server itself recorded.
 * The admin then grants a quiz retry, and the retake must raise the
 * recorded score without ever lowering it.
 *
 * This covers the claims the Learning Analytics framework rests on:
 * per-question responses actually land in `quizResponses`, the
 * one-attempt rules on both bookend assessments really are enforced
 * server-side, and the appeal path is the only way past the single-attempt
 * quiz rule.
 */
import { db } from '../../src/shared/admin'
import { createModuleConfiguration, updateQuizConfiguration } from '../../src/modules/admin/controllers'
import {
  completeLesson,
  completeSimulation,
  grantQuizRetry,
  initializeStudentProgress,
} from '../../src/modules/progress/controllers'
import { submitQuiz } from '../../src/modules/quiz/controllers'
import { submitAssessment } from '../../src/modules/assessment/controllers'
import { aggregateModuleAnalytics } from '../../src/modules/analytics/controllers'
import { COLLECTIONS } from '../../src/shared/constants'
import { makeRequest } from './helpers'

const ADMIN_UID = `assess-admin-${Date.now()}`
const STUDENT_UID = `assess-student-${Date.now()}`
const MODULE_ID = 'data-privacy'

const Q1 = 'a-q1'
const Q2 = 'a-q2'
const Q1_RIGHT = 'a-q1-right'
const Q1_WRONG = 'a-q1-wrong'
const Q2_RIGHT = 'a-q2-right'
const Q2_WRONG = 'a-q2-wrong'

const QUIZ_Q = 'quiz-q1'
const QUIZ_RIGHT = 'quiz-q1-right'
const QUIZ_WRONG = 'quiz-q1-wrong'

const progressRef = () => db.collection(COLLECTIONS.MODULE_PROGRESS).doc(`${STUDENT_UID}_${MODULE_ID}`)

async function responsesFor(assessmentType: string) {
  const snap = await db
    .collection(COLLECTIONS.QUIZ_RESPONSES)
    .where('userId', '==', STUDENT_UID)
    .where('assessmentType', '==', assessmentType)
    .get()
  return snap.docs.map((d) => d.data())
}

describe('assessment flow: pre-test -> module -> quiz -> post-test -> retry appeal', () => {
  beforeAll(async () => {
    await db.collection(COLLECTIONS.USERS).doc(ADMIN_UID).set({
      role: 'admin',
      email: `${ADMIN_UID}@test.local`,
      displayName: 'Assessment Admin',
      status: 'active',
      mustChangePassword: false,
    })

    await createModuleConfiguration.run(
      makeRequest(
        {
          moduleId: MODULE_ID,
          title: 'Data Privacy',
          description: 'Protect personal information.',
          difficulty: 'Easy',
          estimatedTime: '15 min',
          status: 'Enabled',
          prerequisite: null,
          moduleOrder: 1,
          icon: '🔒',
          color: '#2E86AB',
        },
        ADMIN_UID,
      ),
    )

    // The shared pre/post item bank. Both bookend assessments read this
    // one document — that identity is what makes a gain interpretable.
    await db
      .collection(COLLECTIONS.MODULE_PRETESTS)
      .doc(MODULE_ID)
      .set({
        moduleId: MODULE_ID,
        title: 'Data Privacy — Pre-Test',
        questions: [
          {
            id: Q1,
            text: 'Should a flashlight app need your contacts?',
            choices: [
              { id: Q1_RIGHT, text: 'No' },
              { id: Q1_WRONG, text: 'Yes' },
            ],
            correctChoiceId: Q1_RIGHT,
            explanation: 'It has no legitimate need.',
            topic: 'app-permissions',
          },
          {
            id: Q2,
            text: 'Is public travel-date posting risky?',
            choices: [
              { id: Q2_RIGHT, text: 'Yes' },
              { id: Q2_WRONG, text: 'No' },
            ],
            correctChoiceId: Q2_RIGHT,
            explanation: 'It signals when a home is empty.',
            topic: 'oversharing',
          },
        ],
      })

    await updateQuizConfiguration.run(
      makeRequest(
        {
          moduleId: MODULE_ID,
          quizConfig: {
            moduleId: MODULE_ID,
            title: 'Data Privacy Knowledge Check',
            settings: { passingScore: 80, timeLimitMinutes: 15, instructions: 'Do your best.', available: true },
            questions: [
              {
                id: QUIZ_Q,
                order: 1,
                text: 'What limits what an app can collect?',
                // Four choices: updateQuizConfiguration enforces exactly
                // four, matching the authored question bank.
                choices: [
                  { id: QUIZ_RIGHT, text: 'Granting only necessary permissions' },
                  { id: QUIZ_WRONG, text: 'Granting every permission' },
                  { id: 'quiz-q1-c', text: 'Turning the phone off' },
                  { id: 'quiz-q1-d', text: 'Installing more apps' },
                ],
                correctChoiceId: QUIZ_RIGHT,
                explanation: 'Least privilege applies to apps too.',
                difficulty: 'Easy',
                topic: 'app-permissions',
              },
            ],
          },
        },
        ADMIN_UID,
      ),
    )

    await initializeStudentProgress.run(makeRequest({}, STUDENT_UID))
  }, 30000)

  it('records a pre-test with a server-computed score', async () => {
    const result = await submitAssessment.run(
      makeRequest(
        {
          moduleId: MODULE_ID,
          assessmentType: 'pretest',
          answers: { [Q1]: Q1_WRONG, [Q2]: Q2_WRONG },
          durations: { [Q1]: 4000 },
        },
        STUDENT_UID,
      ),
    )

    expect(result.score).toBe(0)
    expect(result.total).toBe(2)

    const progress = (await progressRef().get()).data()!
    expect(progress.preTestCompleted).toBe(true)
    expect(progress.preTestScore).toBe(0)
  })

  it('writes one quizResponses row per pre-test item, carrying topic and duration', async () => {
    const responses = await responsesFor('pretest')
    expect(responses).toHaveLength(2)

    const q1 = responses.find((r) => r.questionId === Q1)!
    expect(q1.topic).toBe('app-permissions')
    expect(q1.isCorrect).toBe(false)
    expect(q1.durationMs).toBe(4000)

    // Q2 had no duration reported — it must be null, never a fabricated 0,
    // or every unmeasured item would drag the timing averages down.
    const q2 = responses.find((r) => r.questionId === Q2)!
    expect(q2.durationMs).toBeNull()
  })

  it('rejects a second pre-test submission', async () => {
    await expect(
      submitAssessment.run(
        makeRequest(
          { moduleId: MODULE_ID, assessmentType: 'pretest', answers: { [Q1]: Q1_RIGHT, [Q2]: Q2_RIGHT } },
          STUDENT_UID,
        ),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('refuses a post-test before the quiz has been submitted', async () => {
    await expect(
      submitAssessment.run(
        makeRequest(
          { moduleId: MODULE_ID, assessmentType: 'posttest', answers: { [Q1]: Q1_RIGHT, [Q2]: Q2_RIGHT } },
          STUDENT_UID,
        ),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('rejects an answer referencing a choice that does not exist', async () => {
    await expect(
      submitAssessment.run(
        makeRequest(
          { moduleId: MODULE_ID, assessmentType: 'posttest', answers: { [Q1]: 'not-a-real-choice' } },
          STUDENT_UID,
        ),
      ),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('records per-question quiz responses alongside the graded attempt', async () => {
    await completeLesson.run(makeRequest({ moduleId: MODULE_ID }, STUDENT_UID))
    await completeSimulation.run(makeRequest({ moduleId: MODULE_ID }, STUDENT_UID))

    const result = await submitQuiz.run(
      makeRequest(
        { moduleId: MODULE_ID, answers: { [QUIZ_Q]: QUIZ_WRONG }, durations: { [QUIZ_Q]: 12000 } },
        STUDENT_UID,
      ),
    )

    expect(result.score).toBe(0)
    expect(result.attemptNumber).toBe(1)
    expect(result.attemptsAllowed).toBe(1)
    expect(result.attemptsRemaining).toBe(0)

    const responses = await responsesFor('quiz')
    expect(responses).toHaveLength(1)
    expect(responses[0].durationMs).toBe(12000)
    expect(responses[0].isCorrect).toBe(false)
  })

  it('computes and stores a normalized gain on the post-test', async () => {
    const result = await submitAssessment.run(
      makeRequest(
        {
          moduleId: MODULE_ID,
          assessmentType: 'posttest',
          answers: { [Q1]: Q1_RIGHT, [Q2]: Q2_RIGHT },
        },
        STUDENT_UID,
      ),
    )

    expect(result.score).toBe(100)
    expect(result.preTestScore).toBe(0)
    // 0 -> 100 closes all of the available headroom.
    expect(result.normalizedGain).toBe(1)

    const progress = (await progressRef().get()).data()!
    expect(progress.postTestCompleted).toBe(true)
    expect(progress.postTestScore).toBe(100)
    expect(progress.normalizedGain).toBe(1)
  })

  it('rejects a second post-test submission', async () => {
    await expect(
      submitAssessment.run(
        makeRequest(
          { moduleId: MODULE_ID, assessmentType: 'posttest', answers: { [Q1]: Q1_RIGHT, [Q2]: Q2_RIGHT } },
          STUDENT_UID,
        ),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('reports the module-level learning gain from the stored scores', async () => {
    const summary = await aggregateModuleAnalytics.run(makeRequest({ moduleId: MODULE_ID }, ADMIN_UID))

    expect(summary.avgPreTestScore).toBe(0)
    expect(summary.avgPostTestScore).toBe(100)
    expect(summary.normalizedGain).toBe(1)
    expect(summary.pairedCount).toBe(1)
    expect(summary.postTestCompletedCount).toBe(1)

    const permissions = summary.topicMastery.find((t) => t.topic === 'app-permissions')!
    expect(permissions.preCorrectRate).toBe(0)
    expect(permissions.postCorrectRate).toBe(100)
    expect(permissions.gain).toBe(100)
  })

  it('refuses a quiz retry request from a non-admin', async () => {
    await expect(
      grantQuizRetry.run(
        makeRequest({ userId: STUDENT_UID, moduleId: MODULE_ID, reason: 'Please let me retry.' }, STUDENT_UID),
      ),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('refuses a quiz retry with no stated reason', async () => {
    await expect(
      grantQuizRetry.run(makeRequest({ userId: STUDENT_UID, moduleId: MODULE_ID, reason: 'x' }, ADMIN_UID)),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('grants one extra attempt and reopens the quiz, without undoing completion', async () => {
    const result = await grantQuizRetry.run(
      makeRequest(
        { userId: STUDENT_UID, moduleId: MODULE_ID, reason: 'Browser crashed partway through.' },
        ADMIN_UID,
      ),
    )
    expect(result.attemptsAllowed).toBe(2)
    expect(result.attemptsRemaining).toBe(1)

    const progress = (await progressRef().get()).data()!
    expect(progress.quizCompleted).toBe(false)
    expect(progress.retryGrantedBy).toBe(ADMIN_UID)
    expect(progress.retryReason).toBe('Browser crashed partway through.')
    // The appeal must not cost the student progress they already earned.
    expect(progress.moduleCompleted).toBe(true)
  })

  it('refuses to stack a second unused retry', async () => {
    await expect(
      grantQuizRetry.run(
        makeRequest({ userId: STUDENT_UID, moduleId: MODULE_ID, reason: 'Asking again just in case.' }, ADMIN_UID),
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('lets the granted retake raise the recorded score', async () => {
    const result = await submitQuiz.run(
      makeRequest({ moduleId: MODULE_ID, answers: { [QUIZ_Q]: QUIZ_RIGHT } }, STUDENT_UID),
    )
    expect(result.score).toBe(100)
    expect(result.attemptNumber).toBe(2)
    expect(result.attemptsRemaining).toBe(0)

    const progress = (await progressRef().get()).data()!
    expect(progress.score).toBe(100)
    expect(progress.quizCompleted).toBe(true)
  })

  it('never lets a retake lower an existing score', async () => {
    // Grant one more attempt, then deliberately fail it. The recorded
    // score must stay at the student's best — an appeal that could make
    // things worse is an appeal nobody would risk taking.
    await grantQuizRetry.run(
      makeRequest({ userId: STUDENT_UID, moduleId: MODULE_ID, reason: 'Second documented incident.' }, ADMIN_UID),
    )
    await submitQuiz.run(makeRequest({ moduleId: MODULE_ID, answers: { [QUIZ_Q]: QUIZ_WRONG } }, STUDENT_UID))

    const progress = (await progressRef().get()).data()!
    expect(progress.score).toBe(100)
    expect(progress.attempts).toBe(3)
  })

  it('rejects a further attempt once the granted allowance is used up', async () => {
    await expect(
      submitQuiz.run(makeRequest({ moduleId: MODULE_ID, answers: { [QUIZ_Q]: QUIZ_RIGHT } }, STUDENT_UID)),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })
})
