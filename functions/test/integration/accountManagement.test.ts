/**
 * Integration test — account management against the Firestore + Auth
 * emulators (see package.json's test:integration). Every callable is
 * invoked through its real .run() path (controller -> service ->
 * repository, requireAuth/requireAdmin included), same as
 * progressFlow.test.ts. Covers the parts of this feature that unit tests
 * (which only exercise validators in isolation) can't: an actual Auth
 * user + Firestore profile getting created with a nickname, the
 * @tip.edu.ph domain rule, deactivate/reactivate flipping both the
 * Firestore status field and the real Auth `disabled` flag, an admin
 * aggregating another student's analytics, and the audit trail.
 */
import { authAdmin, db } from '../../src/shared/admin'
import {
  createUserAccount,
  deleteUserAccount,
  listUsers,
  registerStudentAccount,
  setUserAccountStatus,
  updateOwnNickname,
} from '../../src/auth/controllers'
import { aggregateStudentAnalytics } from '../../src/modules/analytics/controllers'
import { COLLECTIONS } from '../../src/shared/constants'
import { cohortDocId } from '../../src/shared/sections'
import { makeRequest } from './helpers'

const ADMIN_UID = `admin-${Date.now()}`
const OTHER_ADMIN_UID = `admin2-${Date.now()}`
const STUDENT_EMAIL = `student-${Date.now()}@tip.edu.ph`

async function seedAdmin(uid: string): Promise<void> {
  await db.collection(COLLECTIONS.USERS).doc(uid).set({
    role: 'admin',
    email: `${uid}@test.local`,
    displayName: 'Test Admin',
    nickname: 'Admin',
    status: 'active',
    mustChangePassword: false,
  })
}

describe('account management: register -> nickname -> deactivate -> reactivate -> analytics', () => {
  let studentUid: string

  beforeAll(async () => {
    await seedAdmin(ADMIN_UID)
    await seedAdmin(OTHER_ADMIN_UID)
  }, 30000)

  it('rejects registration with a non-@tip.edu.ph email', async () => {
    await expect(
      createUserAccount.run(
        makeRequest(
          {
            email: `nope-${Date.now()}@gmail.com`,
            password: 'Str0ngPass1',
            displayName: 'Bad Email',
            nickname: 'Nope',
            role: 'student',
          },
          ADMIN_UID,
        ),
      ),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects registration from a non-admin caller', async () => {
    await expect(
      createUserAccount.run(
        makeRequest(
          {
            email: `blocked-${Date.now()}@tip.edu.ph`,
            password: 'Str0ngPass1',
            displayName: 'Should Not Exist',
            nickname: 'Nope',
            role: 'student',
          },
          'some-random-student-uid',
        ),
      ),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('registers a new student account with a nickname, stored in Firestore', async () => {
    const result = await createUserAccount.run(
      makeRequest(
        {
          email: STUDENT_EMAIL,
          password: 'Str0ngPass1',
          displayName: 'Juan Dela Cruz',
          nickname: 'Juan',
          role: 'student',
        },
        ADMIN_UID,
      ),
    )
    expect(result.uid).toBeTruthy()
    studentUid = result.uid

    const profileSnap = await db.collection(COLLECTIONS.USERS).doc(studentUid).get()
    const profile = profileSnap.data()!
    expect(profile.nickname).toBe('Juan')
    expect(profile.displayName).toBe('Juan Dela Cruz')
    expect(profile.email).toBe(STUDENT_EMAIL.toLowerCase())
    expect(profile.role).toBe('student')
    expect(profile.status).toBe('active')

    // The Auth user itself must also exist, and its own displayName set —
    // not just the Firestore profile.
    const authUser = await authAdmin.getUser(studentUid)
    expect(authUser.email).toBe(STUDENT_EMAIL.toLowerCase())
    expect(authUser.disabled).toBe(false)
  })

  it('defaults nickname to displayName when omitted, for backward compatibility', async () => {
    const result = await createUserAccount.run(
      makeRequest(
        {
          email: `nonick-${Date.now()}@tip.edu.ph`,
          password: 'Str0ngPass1',
          displayName: 'No Nickname Given',
          role: 'student',
        },
        ADMIN_UID,
      ),
    )
    const snap = await db.collection(COLLECTIONS.USERS).doc(result.uid).get()
    expect(snap.data()!.nickname).toBe('No Nickname Given')
  })

  it('lists the new account with its nickname and active status', async () => {
    const { users } = await listUsers.run(makeRequest({}, ADMIN_UID))
    const match = users.find((u: any) => u.uid === studentUid)
    expect(match).toBeTruthy()
    expect(match!.nickname).toBe('Juan')
    expect(match!.status).toBe('active')
  })

  it('an admin cannot deactivate their own account', async () => {
    await expect(
      setUserAccountStatus.run(makeRequest({ uid: ADMIN_UID, status: 'disabled' }, ADMIN_UID)),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('a non-admin cannot deactivate any account', async () => {
    await expect(
      setUserAccountStatus.run(makeRequest({ uid: studentUid, status: 'disabled' }, studentUid)),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('deactivates the student account — Firestore status and the real Auth record both flip', async () => {
    const result = await setUserAccountStatus.run(makeRequest({ uid: studentUid, status: 'disabled' }, ADMIN_UID))
    expect(result.success).toBe(true)

    const profileSnap = await db.collection(COLLECTIONS.USERS).doc(studentUid).get()
    expect(profileSnap.data()!.status).toBe('disabled')

    const authUser = await authAdmin.getUser(studentUid)
    expect(authUser.disabled).toBe(true)
  })

  it('reactivates the student account — Firestore status and the real Auth record both flip back', async () => {
    const result = await setUserAccountStatus.run(makeRequest({ uid: studentUid, status: 'active' }, OTHER_ADMIN_UID))
    expect(result.success).toBe(true)

    const profileSnap = await db.collection(COLLECTIONS.USERS).doc(studentUid).get()
    expect(profileSnap.data()!.status).toBe('active')

    const authUser = await authAdmin.getUser(studentUid)
    expect(authUser.disabled).toBe(false)
  })

  it('records both the deactivate and activate actions in the audit log', async () => {
    const snap = await db.collection(COLLECTIONS.AUDIT_LOGS).where('targetUid', '==', studentUid).get()
    const actions = snap.docs.map((d) => d.data().action)
    expect(actions).toContain('deactivate_user')
    expect(actions).toContain('activate_user')
    expect(actions).toContain('create_user')
  })

  it("an admin can aggregate another student's analytics by uid", async () => {
    const summary = await aggregateStudentAnalytics.run(makeRequest({ userId: studentUid }, ADMIN_UID))
    expect(summary.userId).toBe(studentUid)
    expect(summary.modulesCompleted).toBe(0)

    const snap = await db.collection(COLLECTIONS.STUDENT_ANALYTICS).doc(studentUid).get()
    expect(snap.exists).toBe(true)
  })

  it("a non-admin cannot aggregate another student's analytics", async () => {
    await expect(
      aggregateStudentAnalytics.run(makeRequest({ userId: ADMIN_UID }, studentUid)),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('a user can update their own nickname, and it lands in Firestore', async () => {
    const result = await updateOwnNickname.run(makeRequest({ nickname: 'Johnny' }, studentUid))
    expect(result.success).toBe(true)

    const profileSnap = await db.collection(COLLECTIONS.USERS).doc(studentUid).get()
    expect(profileSnap.data()!.nickname).toBe('Johnny')
    // Full name is untouched by a nickname-only edit.
    expect(profileSnap.data()!.displayName).toBe('Juan Dela Cruz')
  })

  it('rejects an empty nickname', async () => {
    await expect(updateOwnNickname.run(makeRequest({ nickname: '  ' }, studentUid))).rejects.toMatchObject({
      code: 'invalid-argument',
    })
  })

  it('an admin can update their own nickname too (not student-only)', async () => {
    const result = await updateOwnNickname.run(makeRequest({ nickname: 'Chief' }, ADMIN_UID))
    expect(result.success).toBe(true)

    const profileSnap = await db.collection(COLLECTIONS.USERS).doc(ADMIN_UID).get()
    expect(profileSnap.data()!.nickname).toBe('Chief')
  })

  it('delete still removes the account — unchanged behavior (regression check)', async () => {
    const result = await deleteUserAccount.run(makeRequest({ uid: studentUid }, ADMIN_UID))
    expect(result.success).toBe(true)

    const profileSnap = await db.collection(COLLECTIONS.USERS).doc(studentUid).get()
    expect(profileSnap.exists).toBe(false)

    await expect(authAdmin.getUser(studentUid)).rejects.toMatchObject({ code: 'auth/user-not-found' })
  })
})

/**
 * Deleting an account must take every row keyed to that uid with it.
 *
 * This is written as an exhaustive sweep rather than a spot check for a
 * concrete reason: `quiz_responses` was added later, for item analysis,
 * and was missed from the cascade. A deleted student's per-question
 * answers stayed in the corpus and kept feeding topic mastery, item
 * difficulty, and discrimination forever. Nothing on screen revealed it;
 * the numbers were just quietly wrong.
 *
 * So when a new uid-bearing collection is added, add it here too. A test
 * that only checks the collections someone remembered is a test that
 * fails the same way the code did.
 */
describe('account deletion: cascading data cleanup', () => {
  const ADMIN = `cascade-admin-${Date.now()}`
  const MODULE_ID = 'password-security'
  let uid: string

  beforeAll(async () => {
    await seedAdmin(ADMIN)

    const created = (await createUserAccount.run(
      makeRequest(
        {
          email: `cascade-${Date.now()}@tip.edu.ph`,
          password: 'Str0ngPass1',
          displayName: 'Cascade Student',
          nickname: 'Cascade',
          role: 'student',
          section: 'BSIT-9Z',
        },
        ADMIN,
      ),
    )) as { uid: string }
    uid = created.uid

    // One row in every collection that stores this student's uid.
    await Promise.all([
      db.collection(COLLECTIONS.MODULE_PROGRESS).doc(`${uid}_${MODULE_ID}`).set({
        userId: uid,
        moduleId: MODULE_ID,
        moduleCompleted: true,
        pretestScore: 40,
        postTestScore: 80,
      }),
      db.collection(COLLECTIONS.LEARNING_ANALYTICS).doc(`${uid}_${MODULE_ID}`).set({
        userId: uid,
        moduleId: MODULE_ID,
        safeChoices: 2,
        riskyChoices: 1,
        totalDecisions: 3,
      }),
      db.collection(COLLECTIONS.STUDENT_ANALYTICS).doc(uid).set({ userId: uid, modulesCompleted: 1 }),
      db.collection(COLLECTIONS.QUIZ_ATTEMPTS).add({ userId: uid, moduleId: MODULE_ID, score: 80, passed: true }),
      db.collection(COLLECTIONS.QUIZ_RESPONSES).add({
        userId: uid,
        moduleId: MODULE_ID,
        assessmentType: 'quiz',
        questionId: 'q1',
        topic: 'mfa',
        isCorrect: true,
      }),
      db.collection(COLLECTIONS.SCENARIO_DECISION_RECORDS).add({
        user_id: uid,
        module_id: MODULE_ID,
        scenario_id: 's1',
        scenario_choice_id: 'c1',
        is_safe_choice: true,
        attempt_number: 1,
      }),
      db.collection(COLLECTIONS.ANALYTICS_EVENTS).add({ userId: uid, moduleId: MODULE_ID, eventType: 'quiz_submitted' }),
    ])
  }, 60000)

  it('leaves no row behind in any collection keyed to the deleted uid', async () => {
    await deleteUserAccount.run(makeRequest({ uid }, ADMIN))

    const [progress, learning, studentAnalytics] = await Promise.all([
      db.collection(COLLECTIONS.MODULE_PROGRESS).doc(`${uid}_${MODULE_ID}`).get(),
      db.collection(COLLECTIONS.LEARNING_ANALYTICS).doc(`${uid}_${MODULE_ID}`).get(),
      db.collection(COLLECTIONS.STUDENT_ANALYTICS).doc(uid).get(),
    ])
    expect(progress.exists).toBe(false)
    expect(learning.exists).toBe(false)
    expect(studentAnalytics.exists).toBe(false)

    const queried: Array<[string, string]> = [
      [COLLECTIONS.QUIZ_ATTEMPTS, 'userId'],
      [COLLECTIONS.QUIZ_RESPONSES, 'userId'],
      [COLLECTIONS.SCENARIO_DECISION_RECORDS, 'user_id'],
      [COLLECTIONS.ANALYTICS_EVENTS, 'userId'],
    ]
    for (const [collectionName, field] of queried) {
      // eslint-disable-next-line no-await-in-loop
      const snap = await db.collection(collectionName).where(field, '==', uid).get()
      expect({ collection: collectionName, remaining: snap.size }).toEqual({
        collection: collectionName,
        remaining: 0,
      })
    }
  }, 60000)

  it('keeps the audit trail, which must outlive the account it describes', async () => {
    const logs = await db
      .collection(COLLECTIONS.AUDIT_LOGS)
      .where('action', '==', 'delete_user')
      .where('targetUid', '==', uid)
      .get()
    expect(logs.size).toBe(1)
  })

  it('removes the deleted student from the cohort rollup immediately', async () => {
    // Not on the next nightly run: the cohort card is a cached singleton,
    // so without an immediate recompute it would keep counting a student
    // who no longer exists.
    const snap = await db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(cohortDocId('BSIT-9Z')).get()
    if (snap.exists) {
      expect(snap.data()!.totalStudents).toBe(0)
    }
  }, 60000)
})

describe('public self-registration: no auth required, always creates a student account', () => {
  const email = `selfreg-${Date.now()}@tip.edu.ph`
  let newUid: string

  it('lets a completely unauthenticated caller register a student account', async () => {
    // makeRequest with no uid -> request.auth is undefined, exactly like a
    // real logged-out visitor on the public /register page.
    const result = await registerStudentAccount.run(
      makeRequest({
        email,
        password: 'Str0ngPass1',
        displayName: 'New Student',
        nickname: 'Newbie',
      }),
    )
    expect(result.uid).toBeTruthy()
    newUid = result.uid

    const profileSnap = await db.collection(COLLECTIONS.USERS).doc(newUid).get()
    const profile = profileSnap.data()!
    expect(profile.role).toBe('student')
    expect(profile.nickname).toBe('Newbie')
    expect(profile.displayName).toBe('New Student')
    expect(profile.email).toBe(email.toLowerCase())
    expect(profile.status).toBe('active')
    // Unlike admin-created accounts: the student set their own real
    // password just now, so there's no temporary password to replace.
    expect(profile.mustChangePassword).toBe(false)

    const authUser = await authAdmin.getUser(newUid)
    expect(authUser.email).toBe(email.toLowerCase())
  })

  it('records the registration in the audit log as a self_register action', async () => {
    const snap = await db.collection(COLLECTIONS.AUDIT_LOGS).where('targetUid', '==', newUid).get()
    const actions = snap.docs.map((d) => d.data().action)
    expect(actions).toContain('self_register')
    const entry = snap.docs.find((d) => d.data().action === 'self_register')!.data()
    expect(entry.actorUid).toBe(newUid) // self-registration: actor is the new account itself
  })

  it('rejects a non-@tip.edu.ph email, unauthenticated', async () => {
    await expect(
      registerStudentAccount.run(
        makeRequest({
          email: `blocked-${Date.now()}@gmail.com`,
          password: 'Str0ngPass1',
          displayName: 'Nope',
          nickname: 'Nope',
        }),
      ),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects a missing nickname, unauthenticated', async () => {
    await expect(
      registerStudentAccount.run(
        makeRequest({
          email: `nonick-${Date.now()}@tip.edu.ph`,
          password: 'Str0ngPass1',
          displayName: 'No Nickname',
          nickname: '',
        }),
      ),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  afterAll(async () => {
    if (newUid) {
      await deleteUserAccount.run(makeRequest({ uid: newUid }, ADMIN_UID))
    }
  })
})
