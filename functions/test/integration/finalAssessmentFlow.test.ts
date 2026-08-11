/**
 * Integration test — the end-of-curriculum final assessment, run against
 * the Firestore + Auth emulators (see package.json's `test:integration`).
 * Callables are invoked through their real exported `.run()`, the same
 * controller -> service -> repository path production traffic takes.
 *
 * ── What replaced what ───────────────────────────────────────────────
 * Every module used to end with its own post-test that re-administered
 * that module's pre-test items minutes after its quiz. Six modules meant
 * three tests per module, two of them the same instrument. That was
 * replaced by one assessment taken after the whole curriculum, seeded
 * from the same six pre-test banks.
 *
 * That change puts real weight on this file, because it is the only place
 * three claims are checked end to end against a live datastore:
 *
 *   1. The gate is real. "All six modules complete" is re-checked inside
 *      the submit transaction, not just in the UI that hides the button.
 *   2. The gain is still a same-instrument comparison, computed
 *      server-side against pre-test scores the server itself recorded,
 *      and frozen at submit time so a later edit can't move a reported
 *      number.
 *   3. Per-module reporting survived. Each answer row is attributed to
 *      the module its item was seeded from, which is the only reason the
 *      module cards still show a pre/post movement at all.
 *
 * Uses `malware-awareness` for its per-module assertions specifically
 * because no other integration suite writes responses under that module —
 * `aggregateModuleAnalytics` reads across every student, so a module
 * shared with another suite would make these numbers depend on test
 * execution order.
 */
import { db } from '../../src/shared/admin'
import { createModuleConfiguration } from '../../src/modules/admin/controllers'
import { submitAssessment } from '../../src/modules/assessment/controllers'
import { submitFinalAssessment } from '../../src/modules/finalAssessment/controllers'
import { aggregateModuleAnalytics } from '../../src/modules/analytics/controllers'
import { COLLECTIONS, FINAL_ASSESSMENT_DOC_ID, REAL_MODULE_IDS } from '../../src/shared/constants'
import { makeRequest } from './helpers'

const ADMIN_UID = `final-admin-${Date.now()}`
const STUDENT_UID = `final-student-${Date.now()}`

/** The module this suite owns outright, for the per-module assertions. */
const MODULE_ID = 'malware-awareness'

const PRE_Q1 = 'fa-pre-q1'
const PRE_Q2 = 'fa-pre-q2'
const PRE_Q1_RIGHT = 'fa-pre-q1-right'
const PRE_Q1_WRONG = 'fa-pre-q1-wrong'
const PRE_Q2_RIGHT = 'fa-pre-q2-right'
const PRE_Q2_WRONG = 'fa-pre-q2-wrong'

/**
 * Four final assessment items: two seeded from this module's pre-test
 * bank (same topics, which is what makes a per-topic pre/post comparison
 * computable), two from another module so the per-module attribution has
 * something to actually separate.
 */
const FIN_M1 = 'final-fa-pre-q1'
const FIN_M2 = 'final-fa-pre-q2'
const FIN_O1 = 'final-other-q1'
const FIN_O2 = 'final-other-q2'
const OTHER_MODULE_ID = 'safe-browsing'

const finalProgressRef = () => db.collection(COLLECTIONS.FINAL_ASSESSMENT_PROGRESS).doc(STUDENT_UID)

function choice(id: string, text: string) {
  return { id, text }
}

/** Answers that score 3 of 4: both of this module's items right, one of
 *  the other module's wrong. 75%, and a clean per-module split. */
const GOOD_ANSWERS = {
  [FIN_M1]: `${FIN_M1}-right`,
  [FIN_M2]: `${FIN_M2}-right`,
  [FIN_O1]: `${FIN_O1}-right`,
  [FIN_O2]: `${FIN_O2}-wrong`,
}

async function postResponses() {
  const snap = await db
    .collection(COLLECTIONS.QUIZ_RESPONSES)
    .where('userId', '==', STUDENT_UID)
    .where('assessmentType', '==', 'posttest')
    .get()
  return snap.docs.map((d) => d.data())
}

describe('final assessment flow: six pre-tests -> whole curriculum -> one graded assessment', () => {
  beforeAll(async () => {
    await db.collection(COLLECTIONS.USERS).doc(ADMIN_UID).set({
      role: 'admin',
      email: `${ADMIN_UID}@test.local`,
      displayName: 'Final Assessment Admin',
      status: 'active',
      mustChangePassword: false,
    })

    await createModuleConfiguration.run(
      makeRequest(
        {
          moduleId: MODULE_ID,
          title: 'Malware Awareness',
          description: 'Spot and avoid malicious software.',
          difficulty: 'Medium',
          estimatedTime: '20 min',
          status: 'Enabled',
          prerequisite: null,
          moduleOrder: 3,
          icon: '🦠',
          color: '#B23A48',
        },
        ADMIN_UID,
      ),
    )

    // This module's pre-test bank. The final assessment's own items are
    // seeded from banks like this one, which is what keeps the gain a
    // comparison of one instrument against itself.
    await db
      .collection(COLLECTIONS.MODULE_PRETESTS)
      .doc(MODULE_ID)
      .set({
        moduleId: MODULE_ID,
        title: 'Malware Awareness — Pre-Test',
        questions: [
          {
            id: PRE_Q1,
            text: 'Does paying a ransomware demand guarantee your files back?',
            choices: [choice(PRE_Q1_RIGHT, 'No'), choice(PRE_Q1_WRONG, 'Yes')],
            correctChoiceId: PRE_Q1_RIGHT,
            explanation: 'Payment buys a promise from a criminal, nothing more.',
            topic: 'ransomware',
          },
          {
            id: PRE_Q2,
            text: 'Should you install security updates promptly?',
            choices: [choice(PRE_Q2_RIGHT, 'Yes'), choice(PRE_Q2_WRONG, 'No')],
            correctChoiceId: PRE_Q2_RIGHT,
            explanation: 'Most malware exploits a hole that was already patched.',
            topic: 'patching',
          },
        ],
      })

    await db
      .collection(COLLECTIONS.FINAL_ASSESSMENT)
      .doc(FINAL_ASSESSMENT_DOC_ID)
      .set({
        title: 'SENTRI Final Assessment',
        // One attempt, so the allowance rule is exercised by the second
        // submission below rather than needing a third.
        settings: { passingScore: 75, instructions: 'Covers all six modules.', available: true, attemptsAllowed: 1 },
        questions: [
          {
            id: FIN_M1,
            order: 1,
            text: 'Does paying a ransomware demand guarantee your files back?',
            choices: [choice(`${FIN_M1}-right`, 'No'), choice(`${FIN_M1}-wrong`, 'Yes')],
            correctChoiceId: `${FIN_M1}-right`,
            explanation: 'Payment buys a promise from a criminal, nothing more.',
            difficulty: 'Medium',
            topic: 'ransomware',
            sourceModuleId: MODULE_ID,
          },
          {
            id: FIN_M2,
            order: 2,
            text: 'Should you install security updates promptly?',
            choices: [choice(`${FIN_M2}-right`, 'Yes'), choice(`${FIN_M2}-wrong`, 'No')],
            correctChoiceId: `${FIN_M2}-right`,
            explanation: 'Most malware exploits a hole that was already patched.',
            difficulty: 'Medium',
            topic: 'patching',
            sourceModuleId: MODULE_ID,
          },
          {
            id: FIN_O1,
            order: 3,
            text: 'Does a padlock icon mean a site is trustworthy?',
            choices: [choice(`${FIN_O1}-right`, 'No'), choice(`${FIN_O1}-wrong`, 'Yes')],
            correctChoiceId: `${FIN_O1}-right`,
            explanation: 'It means the connection is encrypted, not that the site is honest.',
            difficulty: 'Medium',
            topic: 'https-misconception',
            sourceModuleId: OTHER_MODULE_ID,
          },
          {
            id: FIN_O2,
            order: 4,
            text: 'Is public Wi-Fi safe for banking without a VPN?',
            choices: [choice(`${FIN_O2}-right`, 'No'), choice(`${FIN_O2}-wrong`, 'Yes')],
            correctChoiceId: `${FIN_O2}-right`,
            explanation: 'Assume an open network is being watched.',
            difficulty: 'Medium',
            topic: 'public-wifi',
            sourceModuleId: OTHER_MODULE_ID,
          },
        ],
      })

    // A real pre-test submission, so this module's baseline and its
    // per-question rows are produced by the server rather than hand-written.
    // One of two right = 50.
    await submitAssessment.run(
      makeRequest(
        {
          moduleId: MODULE_ID,
          assessmentType: 'pretest',
          answers: { [PRE_Q1]: PRE_Q1_RIGHT, [PRE_Q2]: PRE_Q2_WRONG },
        },
        STUDENT_UID,
      ),
    )
  }, 30000)

  it('refuses to grade until every module is complete', async () => {
    // Only this module has any progress at all, so the gate must hold.
    // The message carries the count, because "come back later" without a
    // number is the version students ask an instructor about.
    await expect(
      submitFinalAssessment.run(makeRequest({ answers: GOOD_ANSWERS }, STUDENT_UID)),
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    const progress = await finalProgressRef().get()
    expect(progress.exists).toBe(false)
  })

  it('refuses while the assessment is closed, even with the curriculum finished', async () => {
    // Arrange the rest of the curriculum. The other five carry a pre-test
    // score of 50 so the average across all six is exactly 50, which
    // makes the gain below arithmetic anyone can check by hand.
    await Promise.all(
      REAL_MODULE_IDS.filter((id) => id !== MODULE_ID).map((moduleId) =>
        db
          .collection(COLLECTIONS.MODULE_PROGRESS)
          .doc(`${STUDENT_UID}_${moduleId}`)
          .set({ userId: STUDENT_UID, moduleId, moduleCompleted: true, preTestCompleted: true, preTestScore: 50 }),
      ),
    )
    await db
      .collection(COLLECTIONS.MODULE_PROGRESS)
      .doc(`${STUDENT_UID}_${MODULE_ID}`)
      .set({ moduleCompleted: true }, { merge: true })

    await db
      .collection(COLLECTIONS.FINAL_ASSESSMENT)
      .doc(FINAL_ASSESSMENT_DOC_ID)
      .set({ settings: { available: false } }, { merge: true })

    await expect(
      submitFinalAssessment.run(makeRequest({ answers: GOOD_ANSWERS }, STUDENT_UID)),
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    await db
      .collection(COLLECTIONS.FINAL_ASSESSMENT)
      .doc(FINAL_ASSESSMENT_DOC_ID)
      .set({ settings: { available: true } }, { merge: true })
  }, 30000)

  it('rejects an answer referencing a choice that does not exist', async () => {
    await expect(
      submitFinalAssessment.run(makeRequest({ answers: { [FIN_M1]: 'not-a-real-choice' } }, STUDENT_UID)),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('grades server-side and stores the gain against the six pre-test average', async () => {
    const result = await submitFinalAssessment.run(
      makeRequest({ answers: GOOD_ANSWERS, durations: { [FIN_M1]: 9000 } }, STUDENT_UID),
    )

    expect(result.score).toBe(75)
    expect(result.correctCount).toBe(3)
    expect(result.total).toBe(4)
    expect(result.passed).toBe(true)

    // Six pre-tests: this module's real 50, plus five seeded at 50.
    expect(result.averagePreTestScore).toBe(50)
    // (75 - 50) / (100 - 50) = 0.5. Half the available headroom closed.
    expect(result.normalizedGain).toBe(0.5)

    // Stored, not just returned — the student's own result screen reads
    // this document, and it is written once so a later item-bank edit
    // cannot move a number that has already been reported.
    const stored = (await finalProgressRef().get()).data()!
    expect(stored.completed).toBe(true)
    expect(stored.score).toBe(75)
    expect(stored.passed).toBe(true)
    expect(stored.averagePreTestScore).toBe(50)
    expect(stored.normalizedGain).toBe(0.5)
  }, 30000)

  it('writes one response row per item, attributed to the module it came from', async () => {
    const responses = await postResponses()
    expect(responses).toHaveLength(4)

    // The attribution that keeps per-module reporting alive: a row's
    // moduleId is the module its item was seeded from, not the module the
    // student happened to be in when they took the test (there isn't one).
    const byModule = responses.reduce<Record<string, number>>((acc, r) => {
      acc[r.moduleId] = (acc[r.moduleId] ?? 0) + 1
      return acc
    }, {})
    expect(byModule).toEqual({ [MODULE_ID]: 2, [OTHER_MODULE_ID]: 2 })

    // Stored as 'posttest' so the existing pre/post item analysis keeps
    // working without a single query changing.
    expect(responses.every((r) => r.assessmentType === 'posttest')).toBe(true)

    const m1 = responses.find((r) => r.questionId === FIN_M1)!
    expect(m1.topic).toBe('ransomware')
    expect(m1.isCorrect).toBe(true)
    expect(m1.durationMs).toBe(9000)

    // Unmeasured durations are null, never a fabricated 0 that would drag
    // every timing average toward zero.
    expect(responses.find((r) => r.questionId === FIN_M2)!.durationMs).toBeNull()
  })

  it('refuses a second attempt once the allowance is used up', async () => {
    await expect(
      submitFinalAssessment.run(makeRequest({ answers: GOOD_ANSWERS }, STUDENT_UID)),
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    const stored = (await finalProgressRef().get()).data()!
    expect(stored.attempts).toBe(1)
  })

  it('still reports a per-module learning gain, recovered from the final assessment', async () => {
    // The claim this whole change rests on: no per-module post-test
    // exists any more, and the module card must still show a movement.
    const summary = await aggregateModuleAnalytics.run(makeRequest({ moduleId: MODULE_ID }, ADMIN_UID))

    expect(summary.avgPreTestScore).toBe(50)
    // Both of this module's items answered correctly, scored on their own.
    expect(summary.avgPostTestScore).toBe(100)
    expect(summary.normalizedGain).toBe(1)
    expect(summary.pairedCount).toBe(1)
    expect(summary.postTestCompletedCount).toBe(1)

    // Per-topic movement across the two halves, which needs the final
    // assessment's items to carry the pre-test bank's topics.
    const patching = summary.topicMastery.find((t) => t.topic === 'patching')!
    expect(patching.preCorrectRate).toBe(0)
    expect(patching.postCorrectRate).toBe(100)
    expect(patching.gain).toBe(100)

    const ransomware = summary.topicMastery.find((t) => t.topic === 'ransomware')!
    expect(ransomware.preCorrectRate).toBe(100)
    expect(ransomware.postCorrectRate).toBe(100)
    expect(ransomware.gain).toBe(0)
  }, 30000)

  it('labels the choice distribution with the text a student actually read', async () => {
    // Item analysis reports which choice the answers went to. Resolving
    // that id back to its wording needs the item bank, which only the
    // aggregation can reach — so a raw id here means the lookup broke.
    const summary = await aggregateModuleAnalytics.run(makeRequest({ moduleId: MODULE_ID }, ADMIN_UID))

    const item = summary.itemAnalysis.find(
      (i) => i.questionId === FIN_M1 && i.assessmentType === 'posttest',
    )!
    expect(item.correctChoiceId).toBe(`${FIN_M1}-right`)
    expect(item.choiceDistribution).toEqual([
      { choiceId: `${FIN_M1}-right`, text: 'No', count: 1, rate: 100, isCorrect: true },
    ])

    // The pre-test half resolves against its own bank, so both halves of
    // the comparison are readable rather than only the newer one.
    const preItem = summary.itemAnalysis.find(
      (i) => i.questionId === PRE_Q2 && i.assessmentType === 'pretest',
    )!
    expect(preItem.choiceDistribution).toEqual([
      { choiceId: PRE_Q2_WRONG, text: 'No', count: 1, rate: 100, isCorrect: false },
    ])
  }, 30000)
})
