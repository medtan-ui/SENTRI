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
