/**
 * Security-rules tests, run against the Firestore emulator with the real
 * firestore.rules loaded.
 *
 * This session changed who can read what: `moduleLessons` and
 * `moduleScenarios` went from admin-only to student-readable (because the
 * Lesson Viewer and Scenario Engine now genuinely read them), and a new
 * `quizResponses` collection was added that no client may ever write.
 * Those are exactly the changes where a mistake is silent — the app keeps
 * working while the data is either unreachable or wide open — so they get
 * asserted directly rather than assumed.
 *
 * Running these also compiles firestore.rules, so a syntax error fails
 * the suite instead of surfacing at deploy time.
 */
import fs from 'fs'
import path from 'path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

const STUDENT_UID = 'rules-student'
const OTHER_UID = 'rules-other-student'
const ADMIN_UID = 'rules-admin'
const MODULE_ID = 'password-security'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-sentri-rules',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../../firestore.rules'), 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  })

  // Seed the two user profiles the rules' isAdmin() helper reads, plus
  // one document per collection under test. withSecurityRulesDisabled is
  // the only way in — every one of these is deliberately unwritable by
  // clients, which is the point.
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await db.doc(`users/${ADMIN_UID}`).set({ role: 'admin', email: 'admin@test.local' })
    await db.doc(`users/${STUDENT_UID}`).set({ role: 'student', email: 'student@test.local' })
    await db.doc(`moduleLessons/${MODULE_ID}`).set({ moduleId: MODULE_ID, sections: [] })
    await db.doc(`moduleScenarios/${MODULE_ID}`).set({ moduleId: MODULE_ID, scenarios: [] })
    await db.doc('quizResponses/response-1').set({ userId: STUDENT_UID, moduleId: MODULE_ID })
    await db.doc('cohortAnalytics/current').set({ totalStudents: 1 })
    await db.doc(`moduleProgress/${STUDENT_UID}_${MODULE_ID}`).set({
      userId: STUDENT_UID,
      moduleId: MODULE_ID,
      isUnlocked: true,
    })
  })
}, 30000)

afterAll(async () => {
  if (testEnv) await testEnv.cleanup()
})

const asStudent = () => testEnv.authenticatedContext(STUDENT_UID).firestore()
const asOtherStudent = () => testEnv.authenticatedContext(OTHER_UID).firestore()
const asAdmin = () => testEnv.authenticatedContext(ADMIN_UID).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

describe('firestore.rules — published content', () => {
  it('lets a signed-in student read published lesson content', async () => {
    // The Lesson Viewer's own read. If this fails, every student sees a
    // fallback lesson and no admin edit ever reaches anyone.
    await assertSucceeds(asStudent().doc(`moduleLessons/${MODULE_ID}`).get())
  })

  it('lets a signed-in student read published scenario configuration', async () => {
    await assertSucceeds(asStudent().doc(`moduleScenarios/${MODULE_ID}`).get())
  })

  it('refuses a signed-out visitor', async () => {
    await assertFails(asGuest().doc(`moduleLessons/${MODULE_ID}`).get())
    await assertFails(asGuest().doc(`moduleScenarios/${MODULE_ID}`).get())
  })

  it('refuses a student writing lesson or scenario content', async () => {
    await assertFails(asStudent().doc(`moduleLessons/${MODULE_ID}`).set({ sections: [] }))
    await assertFails(asStudent().doc(`moduleScenarios/${MODULE_ID}`).update({ moduleTitle: 'Hacked' }))
  })

  it('lets an admin write lesson and scenario content', async () => {
    await assertSucceeds(
      asAdmin().doc(`moduleLessons/${MODULE_ID}`).set({ moduleId: MODULE_ID, sections: [] }),
    )
    await assertSucceeds(asAdmin().doc(`moduleScenarios/${MODULE_ID}`).update({ moduleTitle: 'Edited' }))
  })
})

describe('firestore.rules — item-analysis responses', () => {
  it('refuses a student reading response rows', async () => {
    // Reading these would expose the answer key across every assessment.
    await assertFails(asStudent().doc('quizResponses/response-1').get())
  })

  it('refuses a student writing a response row, even their own', async () => {
    // The measurement that a learning gain is computed from must not be
    // forgeable by the person being measured.
    await assertFails(
      asStudent().doc('quizResponses/forged').set({ userId: STUDENT_UID, isCorrect: true }),
    )
  })

  it('refuses even an admin writing a response row', async () => {
    await assertFails(asAdmin().doc('quizResponses/forged').set({ userId: STUDENT_UID }))
  })

  it('lets an admin read response rows for analytics', async () => {
    await assertSucceeds(asAdmin().doc('quizResponses/response-1').get())
  })
})

describe('firestore.rules — cohort analytics', () => {
  it('refuses a student reading the class-wide rollup', async () => {
    await assertFails(asStudent().doc('cohortAnalytics/current').get())
  })

  it('lets an admin read it and nobody write it', async () => {
    await assertSucceeds(asAdmin().doc('cohortAnalytics/current').get())
    await assertFails(asAdmin().doc('cohortAnalytics/current').set({ totalStudents: 999 }))
  })
})

describe('firestore.rules — progress ownership', () => {
  it('lets a student read their own progress', async () => {
    await assertSucceeds(asStudent().doc(`moduleProgress/${STUDENT_UID}_${MODULE_ID}`).get())
  })

  it('refuses another student reading it', async () => {
    await assertFails(asOtherStudent().doc(`moduleProgress/${STUDENT_UID}_${MODULE_ID}`).get())
  })

  it('refuses another student writing it', async () => {
    await assertFails(
      asOtherStudent().doc(`moduleProgress/${STUDENT_UID}_${MODULE_ID}`).update({ score: 100 }),
    )
  })

  it('refuses an admin writing a student progress doc from the client', async () => {
    // Admin reads are allowed for the Individual Analytics view; writes
    // stay server-side, so granting a retry has to go through the
    // audited grantQuizRetry callable rather than a direct edit.
    await assertFails(
      asAdmin().doc(`moduleProgress/${STUDENT_UID}_${MODULE_ID}`).update({ attemptsAllowed: 5 }),
    )
  })
})
