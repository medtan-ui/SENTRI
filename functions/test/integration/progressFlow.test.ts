/**
 * Integration test — the real progress flow, run against the Firestore +
 * Auth emulators (see package.json's `test:integration`, which wraps this
 * in `firebase emulators:exec`). Every callable is invoked through its
 * actual exported `.run()` — the same controller -> service -> repository
 * path production traffic takes — not by calling service functions
 * directly, so requireAuth/requireAdmin are exercised too.
 *
 * Flow: an admin configures two modules (password-security ->
 * phishing-awareness) and password-security's quiz, then a student
 * initializes progress, completes the lesson and simulation, and submits
 * their one quiz attempt — which must complete module 1 AND unlock
 * module 2 atomically regardless of score, and reject any second attempt.
 */
import { db } from '../../src/shared/admin'
import { createModuleConfiguration, updateQuizConfiguration } from '../../src/modules/admin/controllers'
import {
  completeLesson,
  completeSimulation,
  initializeStudentProgress,
} from '../../src/modules/progress/controllers'
import { submitQuiz } from '../../src/modules/quiz/controllers'
import { COLLECTIONS } from '../../src/shared/constants'
import { makeRequest } from './helpers'

const ADMIN_UID = `admin-${Date.now()}`
const STUDENT_UID = `student-${Date.now()}`
const MODULE_1 = 'password-security'
const MODULE_2 = 'phishing-awareness'
const QUESTION_ID = 'q1'
const CORRECT_CHOICE_ID = 'choice-correct'
const WRONG_CHOICE_ID = 'choice-wrong'

async function seedAdmin(): Promise<void> {
  await db.collection(COLLECTIONS.USERS).doc(ADMIN_UID).set({
    role: 'admin',
    email: `${ADMIN_UID}@test.local`,
    displayName: 'Test Admin',
    status: 'active',
    mustChangePassword: false,
  })
}

describe('progress flow: configure -> initialize -> lesson -> simulation -> quiz -> unlock', () => {
  beforeAll(async () => {
    await seedAdmin()

    const createResult = await createModuleConfiguration.run(
      makeRequest(
        {
          moduleId: MODULE_1,
          title: 'Password Security',
          description: 'Learn strong passwords.',
          difficulty: 'Easy',
          estimatedTime: '15 min',
          status: 'Enabled',
          prerequisite: null,
          moduleOrder: 1,
          icon: '🔑',
          color: '#B8860B',
        },
        ADMIN_UID,
      ),
    )
    expect(createResult).toEqual({ moduleId: MODULE_1 })

    await createModuleConfiguration.run(
      makeRequest(
        {
          moduleId: MODULE_2,
          title: 'Phishing Awareness',
          description: 'Recognize phishing.',
          difficulty: 'Easy',
          estimatedTime: '18 min',
          status: 'Enabled',
          prerequisite: MODULE_1,
          moduleOrder: 2,
          icon: '🎣',
          color: '#C0392B',
        },
        ADMIN_UID,
      ),
    )

    await updateQuizConfiguration.run(
      makeRequest(
        {
          moduleId: MODULE_1,
          quizConfig: {
            moduleId: MODULE_1,
            title: 'Password Security Knowledge Check',
            settings: {
              passingScore: 80,
              timeLimitMinutes: 15,
              instructions: 'Do your best.',
              available: true,
            },
            questions: [
              {
                id: QUESTION_ID,
                order: 1,
                text: 'Which password is strongest?',
                choices: [
                  { id: CORRECT_CHOICE_ID, text: 'correct-horse-battery-staple-42' },
                  { id: WRONG_CHOICE_ID, text: 'password123' },
                  { id: 'choice-c', text: 'P@ssw0rd' },
                  { id: 'choice-d', text: 'qwerty' },
                ],
                correctChoiceId: CORRECT_CHOICE_ID,
                explanation: 'Length beats complexity.',
                difficulty: 'Easy',
              },
            ],
          },
        },
        ADMIN_UID,
      ),
    )
  }, 30000)

  it('rejects module configuration from a non-admin caller', async () => {
    await expect(
      createModuleConfiguration.run(
        makeRequest(
          {
            moduleId: MODULE_1,
            title: 'x',
            description: 'x',
            difficulty: 'Easy',
            estimatedTime: '1 min',
            status: 'Enabled',
            prerequisite: null,
            moduleOrder: 1,
            icon: '🔑',
            color: '#000',
          },
          STUDENT_UID,
        ),
      ),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('initializes both modules — module 1 unlocked, module 2 locked', async () => {
    const { progress } = await initializeStudentProgress.run(makeRequest({}, STUDENT_UID))
    const byModule = Object.fromEntries(progress.map((p: any) => [p.moduleId, p]))
    expect(byModule[MODULE_1].isUnlocked).toBe(true)
    expect(byModule[MODULE_2].isUnlocked).toBe(false)
    expect(byModule[MODULE_1].moduleCompleted).toBe(false)
  })

  it('completes the lesson and simulation for module 1', async () => {
    await completeLesson.run(makeRequest({ moduleId: MODULE_1 }, STUDENT_UID))
    await completeSimulation.run(makeRequest({ moduleId: MODULE_1 }, STUDENT_UID))

    const snap = await db.collection(COLLECTIONS.MODULE_PROGRESS).doc(`${STUDENT_UID}_${MODULE_1}`).get()
    const data = snap.data()!
    expect(data.lessonCompleted).toBe(true)
    expect(data.simulationCompleted).toBe(true)
  })

  it('a wrong-answer quiz submission still completes module 1 and unlocks module 2 — one attempt always advances', async () => {
    const result = await submitQuiz.run(
      makeRequest({ moduleId: MODULE_1, answers: { [QUESTION_ID]: WRONG_CHOICE_ID } }, STUDENT_UID),
    )
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.moduleCompleted).toBe(true)

    const module1 = await db.collection(COLLECTIONS.MODULE_PROGRESS).doc(`${STUDENT_UID}_${MODULE_1}`).get()
    expect(module1.data()!.moduleCompleted).toBe(true)
    expect(module1.data()!.quizCompleted).toBe(true)
    expect(module1.data()!.attempts).toBe(1)
    expect(module1.data()!.score).toBe(0)

    const module2 = await db.collection(COLLECTIONS.MODULE_PROGRESS).doc(`${STUDENT_UID}_${MODULE_2}`).get()
    expect(module2.exists).toBe(true)
    expect(module2.data()!.isUnlocked).toBe(true)
  })

  it('rejects a second quiz submission — only one attempt is allowed', async () => {
    await expect(
      submitQuiz.run(makeRequest({ moduleId: MODULE_1, answers: { [QUESTION_ID]: CORRECT_CHOICE_ID } }, STUDENT_UID)),
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    // The first (failing) attempt's score must survive untouched.
    const module1 = await db.collection(COLLECTIONS.MODULE_PROGRESS).doc(`${STUDENT_UID}_${MODULE_1}`).get()
    expect(module1.data()!.attempts).toBe(1)
    expect(module1.data()!.score).toBe(0)

    const attemptsSnap = await db
      .collection(COLLECTIONS.QUIZ_ATTEMPTS)
      .where('userId', '==', STUDENT_UID)
      .where('moduleId', '==', MODULE_1)
      .get()
    expect(attemptsSnap.size).toBe(1)
  })
})
