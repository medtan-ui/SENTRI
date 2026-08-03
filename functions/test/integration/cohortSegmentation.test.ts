/**
 * Integration test — per-section cohort reporting, against the Firestore
 * + Auth emulators (see package.json's `test:integration`). Every callable
 * runs through its real exported `.run()`: controller -> service ->
 * repository, requireAdmin included.
 *
 * What this exists to prove, which no unit test can: a section rollup
 * really is scoped to that section's students. The filtering happens in
 * memory against the account roster (telemetry rows carry a uid but not a
 * section), so the only way to know it works is to put two students in two
 * sections, give them different results, and check that each section's
 * document reports only its own — and that the whole-cohort document still
 * reports both.
 */
import { db } from '../../src/shared/admin'
import { createUserAccount, listUsers, setUserSection } from '../../src/auth/controllers'
import { aggregateCohortAnalytics, listSections } from '../../src/modules/analytics/controllers'
import { aggregateAllAnalytics } from '../../src/modules/analytics/service'
import { COLLECTIONS } from '../../src/shared/constants'
import { cohortDocId } from '../../src/shared/sections'
import { makeRequest } from './helpers'

const STAMP = Date.now()
const ADMIN_UID = `section-admin-${STAMP}`
const SECTION_A = 'BSIT-3A'
const SECTION_B = 'BSIT-3B'
const MODULE_ID = 'password-security'

async function seedAdmin(uid: string): Promise<void> {
  await db.collection(COLLECTIONS.USERS).doc(uid).set({
    role: 'admin',
    email: `${uid}@test.local`,
    displayName: 'Section Admin',
    nickname: 'Admin',
    status: 'active',
    mustChangePassword: false,
  })
}

/** A finished module for one student, with a pre/post pair the cohort
 * rollup can compute a normalized gain from. */
async function seedProgress(uid: string, pre: number, post: number): Promise<void> {
  await db
    .collection(COLLECTIONS.MODULE_PROGRESS)
    .doc(`${uid}_${MODULE_ID}`)
    .set({
      userId: uid,
      moduleId: MODULE_ID,
      moduleOrder: 1,
      isUnlocked: true,
      lessonStarted: true,
      lessonCompleted: true,
      simulationCompleted: true,
      moduleCompleted: true,
      pretestCompleted: true,
      postTestCompleted: true,
      pretestScore: pre,
      postTestScore: post,
      score: post,
    })
}

async function createStudent(label: string, section: string | null): Promise<string> {
  const result = (await createUserAccount.run(
    makeRequest(
      {
        email: `${label}-${STAMP}@tip.edu.ph`,
        password: 'Str0ngPass1',
        displayName: `Student ${label}`,
        nickname: label,
        role: 'student',
        section,
      },
      ADMIN_UID,
    ),
  )) as { uid: string }
  return result.uid
}

describe('cohort segmentation: assign sections -> aggregate per section', () => {
  let studentA: string
  let studentB: string
  let studentUnassigned: string

  beforeAll(async () => {
    await seedAdmin(ADMIN_UID)

    studentA = await createStudent('alpha', SECTION_A)
    studentB = await createStudent('bravo', SECTION_B)
    studentUnassigned = await createStudent('charlie', null)

    // Distinct pre/post pairs, so a section report that accidentally
    // included the other section's student would show a different gain
    // rather than the same one.
    await seedProgress(studentA, 40, 90)
    await seedProgress(studentB, 20, 30)
    await seedProgress(studentUnassigned, 50, 50)
  }, 60000)

  it('stores the section on the profile and returns it from listUsers', async () => {
    const { users } = (await listUsers.run(makeRequest({}, ADMIN_UID))) as {
      users: Array<{ uid: string; section: string | null }>
    }
    expect(users.find((u) => u.uid === studentA)?.section).toBe(SECTION_A)
    expect(users.find((u) => u.uid === studentUnassigned)?.section).toBeNull()
  })

  it('lists only sections that actually have students, with counts', async () => {
    const { sections } = (await listSections.run(makeRequest({}, ADMIN_UID))) as {
      sections: Array<{ key: string; label: string; studentCount: number }>
    }
    const a = sections.find((s) => s.label === SECTION_A)
    expect(a?.studentCount).toBe(1)
    expect(sections.some((s) => s.label === SECTION_B)).toBe(true)
    // An unassigned student is in no section, not in a section named ''.
    expect(sections.some((s) => s.key === '')).toBe(false)
  })

  it('refuses to list sections for a non-admin caller', async () => {
    await expect(listSections.run(makeRequest({}, studentA))).rejects.toMatchObject({
      code: 'permission-denied',
    })
  })

  it('scopes a section rollup to that section only', async () => {
    const summary = (await aggregateCohortAnalytics.run(
      makeRequest({ section: SECTION_A }, ADMIN_UID),
    )) as { section: string; totalStudents: number; pairedCount: number; avgPostTestScore: number }

    expect(summary.section).toBe(SECTION_A)
    expect(summary.totalStudents).toBe(1)
    expect(summary.pairedCount).toBe(1)
    // Section A's student alone: 90, not an average with B's 30 in it.
    expect(summary.avgPostTestScore).toBe(90)
  })

  it('writes each section to its own document, leaving the others alone', async () => {
    await aggregateCohortAnalytics.run(makeRequest({ section: SECTION_B }, ADMIN_UID))

    const docA = await db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(cohortDocId(SECTION_A)).get()
    const docB = await db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(cohortDocId(SECTION_B)).get()

    expect(docA.data()?.avgPostTestScore).toBe(90)
    expect(docB.data()?.avgPostTestScore).toBe(30)
  })

  it('matches a section however its label was typed', async () => {
    const summary = (await aggregateCohortAnalytics.run(
      makeRequest({ section: 'bsit 3a' }, ADMIN_UID),
    )) as { totalStudents: number; avgPostTestScore: number }

    expect(summary.totalStudents).toBe(1)
    expect(summary.avgPostTestScore).toBe(90)
  })

  it('still counts every student, sectioned or not, in the whole-cohort rollup', async () => {
    const summary = (await aggregateCohortAnalytics.run(makeRequest({}, ADMIN_UID))) as {
      section: string | null
      pairedCount: number
    }

    expect(summary.section).toBeNull()
    // All three seeded students, including the one with no section — an
    // unassigned student must never fall out of the class-wide report.
    expect(summary.pairedCount).toBeGreaterThanOrEqual(3)
  })

  it('moves a student between sections and records who did it', async () => {
    await setUserSection.run(makeRequest({ uid: studentB, section: SECTION_A }, ADMIN_UID))

    const summary = (await aggregateCohortAnalytics.run(
      makeRequest({ section: SECTION_A }, ADMIN_UID),
    )) as { totalStudents: number; pairedCount: number }
    expect(summary.totalStudents).toBe(2)
    expect(summary.pairedCount).toBe(2)

    const logs = await db
      .collection(COLLECTIONS.AUDIT_LOGS)
      .where('action', '==', 'set_user_section')
      .where('targetUid', '==', studentB)
      .get()
    expect(logs.size).toBe(1)
    expect(logs.docs[0].data().details).toMatchObject({ from: SECTION_B, to: SECTION_A })
  })

  it('clears a section with a blank value rather than storing an empty group', async () => {
    const result = (await setUserSection.run(
      makeRequest({ uid: studentB, section: '' }, ADMIN_UID),
    )) as { section: string | null }
    expect(result.section).toBeNull()

    const profile = await db.collection(COLLECTIONS.USERS).doc(studentB).get()
    expect(profile.data()?.section).toBeNull()
  })

  it('refuses a section change from a non-admin caller', async () => {
    await expect(
      setUserSection.run(makeRequest({ uid: studentA, section: 'HACKED' }, studentA)),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  /**
   * The nightly job's body. Two things matter here and neither is
   * cosmetic: it must cover every section without being told which ones
   * exist, and a module that can't be aggregated must not take the cohort
   * work down with it — otherwise the first night someone leaves a module
   * mid-edit, the whole run silently becomes a no-op.
   */
  describe('aggregateAllAnalytics (the scheduled pass)', () => {
    beforeAll(async () => {
      // Put the two sectioned students back where the earlier tests left
      // them, so this pass has more than one group to cover.
      await setUserSection.run(makeRequest({ uid: studentA, section: SECTION_A }, ADMIN_UID))
      await setUserSection.run(makeRequest({ uid: studentB, section: SECTION_B }, ADMIN_UID))
    })

    it('writes every section plus the whole cohort, and survives unconfigured modules', async () => {
      const result = await aggregateAllAnalytics()

      expect(result.sections).toBeGreaterThanOrEqual(2)

      // No module was configured in this suite, so every module target is
      // expected to fail — and the cohort work must still have happened.
      expect(result.failures.every((f) => f.target.startsWith('module:'))).toBe(true)

      const [all, docA, docB] = await Promise.all([
        db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(cohortDocId(null)).get(),
        db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(cohortDocId(SECTION_A)).get(),
        db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(cohortDocId(SECTION_B)).get(),
      ])

      expect(all.data()?.section).toBeNull()
      expect(docA.data()?.section).toBe(SECTION_A)
      expect(docB.data()?.section).toBe(SECTION_B)

      // Each still scoped to its own group, not overwritten by the pass
      // that came after it.
      expect(docA.data()?.avgPostTestScore).toBe(90)
      expect(docB.data()?.avgPostTestScore).toBe(30)
    })
  })
})
