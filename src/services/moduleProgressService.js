/**
 * moduleProgressService.js
 * ─────────────────────────────────────────────────────────────
 * Firestore-backed access to the `moduleProgress` collection — one
 * document per (student, module) pair, doc id `${userId}_${moduleId}`.
 * This is the single place that reads or writes a student's progress;
 * every hook (useModuleProgress, useModuleUnlocks, useStudentModules)
 * and every page goes through the functions here instead of touching
 * Firestore or re-deriving status logic on their own.
 *
 * `status` (LOCKED/AVAILABLE/IN_PROGRESS/SIMULATION_COMPLETE/
 * QUIZ_AVAILABLE/COMPLETED) is never stored — it's derived from the
 * boolean fields plus the unlock/admin-enabled check every time it's
 * read, so it can never drift out of sync with the data it describes.
 * SIMULATION_COMPLETE is a real, valid status (the Scenario Runner's own
 * momentary "you just finished" screen represents it) but it collapses
 * into QUIZ_AVAILABLE for card display and route-guarding, since the
 * quiz is unlocked at the exact same instant the simulation is.
 *
 * Reads use the project's existing getOrSeedDoc lazy-migration pattern
 * (see firestoreDoc.js) and surface failures to the caller, matching
 * every other Training Curriculum hook. Progress *writes* triggered by
 * normal navigation (starting a lesson, reaching its last section,
 * finishing a simulation) fail soft — logged, never thrown — so a
 * network blip never traps a student mid-lesson; this mirrors
 * scenarioDecisionService's "a recording failure must never block
 * learning" rule. Quiz attempts are NOT recorded here — that write must
 * be atomic with grading itself (score + attempts + completion +
 * unlocking the next module), so it happens entirely server-side via the
 * submitQuiz Cloud Function (see quizService.js).
 * ─────────────────────────────────────────────────────────────
 */
import { doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { getOrSeedDoc, mergeDoc } from './firestoreDoc'
import { listModules } from './moduleService'

const COLLECTION = 'moduleProgress'

export const MODULE_STATUS = Object.freeze({
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  IN_PROGRESS: 'IN_PROGRESS',
  SIMULATION_COMPLETE: 'SIMULATION_COMPLETE',
  QUIZ_AVAILABLE: 'QUIZ_AVAILABLE',
  COMPLETED: 'COMPLETED',
})

function progressDocId(userId, moduleId) {
  return `${userId}_${moduleId}`
}

function defaultProgress(userId, moduleId, moduleOrder, isUnlocked) {
  return {
    userId,
    moduleId,
    moduleOrder,
    isUnlocked,
    preTestCompleted: false,
    preTestScore: null,
    preTestCompletedAt: null,
    postTestCompleted: false,
    postTestScore: null,
    postTestCompletedAt: null,
    normalizedGain: null,
    lessonStarted: false,
    lessonCompleted: false,
    simulationCompleted: false,
    quizCompleted: false,
    moduleCompleted: false,
    score: null,
    attempts: 0,
    // One quiz attempt unless an admin grants an appeal (grantQuizRetry).
    attemptsAllowed: 1,
    lastAccessed: serverTimestamp(),
    completionDate: null,
    createdAt: serverTimestamp(),
  }
}

/**
 * Pure derivation — see file header. Never returns SIMULATION_COMPLETE;
 * that status exists for the Scenario Runner's own transition screen,
 * not for cards or route guards.
 * @param {object|null} progress
 * @returns {'LOCKED'|'AVAILABLE'|'IN_PROGRESS'|'QUIZ_AVAILABLE'|'COMPLETED'}
 */
export function deriveModuleStatus(progress) {
  if (!progress || !progress.isUnlocked) return MODULE_STATUS.LOCKED
  if (progress.moduleCompleted) return MODULE_STATUS.COMPLETED
  if (progress.simulationCompleted) return MODULE_STATUS.QUIZ_AVAILABLE
  if (progress.lessonStarted) return MODULE_STATUS.IN_PROGRESS
  return MODULE_STATUS.AVAILABLE
}

function hasRealModuleProgress(progress) {
  return Boolean(
    progress.lessonStarted || progress.lessonCompleted || progress.simulationCompleted || progress.moduleCompleted,
  )
}

/**
 * `isUnlocked` is written once (at seed time, or when the previous module
 * is completed) and never revisited after that — correct as long as the
 * curriculum order never changes. But an admin CAN reorder modules
 * (ModulesPage's move()), and that only ever writes to the `modules`
 * collection, never to any student's moduleProgress docs, so a student's
 * stored unlock flags can silently go stale: unlock a module by moving it
 * to position 1, move it back, and it stays unlocked forever.
 *
 * This reconciles one module's stored `isUnlocked` against what it should
 * be under the *current* order, and self-heals the stored value so this
 * only has to correct itself once per drift. A module the student has any
 * real progress on is left exactly as stored — reordering must never look
 * like it took away something already started.
 */
function reconcileUnlock(userId, moduleId, progress, liveShouldBeUnlocked) {
  if (hasRealModuleProgress(progress) || progress.isUnlocked === liveShouldBeUnlocked) return
  progress.isUnlocked = liveShouldBeUnlocked
  mergeDoc(COLLECTION, progressDocId(userId, moduleId), { isUnlocked: liveShouldBeUnlocked }).catch((err) => {
    console.error('[moduleProgressService] unlock reconcile failed — continuing:', err)
  })
}

/**
 * One student's progress on one module, lazily initialized on first read
 * (module order 1 starts unlocked, every other module starts locked).
 * @param {string} userId
 * @param {string} moduleId
 * @returns {Promise<object|null>} null only if moduleId isn't a real module
 */
export async function getModuleProgress(userId, moduleId) {
  const modules = await listModules()
  const index = modules.findIndex((m) => m.moduleId === moduleId)
  if (index === -1) return null
  const moduleMeta = modules[index]
  const seed = defaultProgress(userId, moduleId, moduleMeta.moduleOrder, moduleMeta.moduleOrder === 1)
  const progress = await getOrSeedDoc(COLLECTION, progressDocId(userId, moduleId), seed)

  const liveShouldBeUnlocked =
    index === 0
      ? true
      : Boolean(
          (await getDoc(doc(db, COLLECTION, progressDocId(userId, modules[index - 1].moduleId)))).data()
            ?.moduleCompleted,
        )
  reconcileUnlock(userId, moduleId, progress, liveShouldBeUnlocked)

  return progress
}

/**
 * Every module's admin metadata (title, icon, order) merged with this
 * student's progress and derived status, sorted by moduleOrder. Used by
 * the Dashboard's and the Modules page's module grids. There is no
 * admin-disable concept — access is governed purely by curriculum order
 * (see deriveModuleStatus).
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function listStudentModuleProgress(userId) {
  const modules = await listModules()
  const progressDocs = await Promise.all(
    modules.map((m) =>
      getOrSeedDoc(
        COLLECTION,
        progressDocId(userId, m.moduleId),
        defaultProgress(userId, m.moduleId, m.moduleOrder, m.moduleOrder === 1),
      ),
    ),
  )

  // See reconcileUnlock — modules is already sorted by current moduleOrder,
  // so walking it in order and carrying forward the previous module's
  // completion is enough to catch every module the admin has reordered.
  let previousCompleted = true
  modules.forEach((m, i) => {
    reconcileUnlock(userId, m.moduleId, progressDocs[i], i === 0 ? true : previousCompleted)
    previousCompleted = Boolean(progressDocs[i].moduleCompleted)
  })

  return modules.map((m, i) => ({
    moduleId: m.moduleId,
    title: m.title,
    description: m.description,
    icon: m.icon,
    color: m.color,
    difficulty: m.difficulty,
    moduleOrder: m.moduleOrder,
    progress: progressDocs[i],
    status: deriveModuleStatus(progressDocs[i]),
  }))
}

/**
 * Same shape as listStudentModuleProgress, for an admin viewing another
 * student's progress (the Individual Analytics section of the View User
 * page). Deliberately plain getDoc reads with no seed/write fallback — an
 * admin only has read access to another student's moduleProgress docs
 * (see firestore.rules), not create/update, so a missing doc is defaulted
 * in memory for display only. In practice this default is rarely hit:
 * every real student already has all 6 docs from
 * initializeAllProgressForUser at account-creation time.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getStudentModuleProgressForAdmin(userId) {
  const modules = await listModules()
  const progressDocs = await Promise.all(
    modules.map(async (m) => {
      const snap = await getDoc(doc(db, COLLECTION, progressDocId(userId, m.moduleId)))
      return snap.exists() ? snap.data() : defaultProgress(userId, m.moduleId, m.moduleOrder, m.moduleOrder === 1)
    }),
  )

  // Same reconciliation as listStudentModuleProgress, for the same reason
  // (see reconcileUnlock) — but display-only: this function deliberately
  // never writes (an admin's client has no permission to update another
  // student's moduleProgress doc anyway, see firestore.rules).
  let previousCompleted = true
  modules.forEach((m, i) => {
    const progress = progressDocs[i]
    const liveShouldBeUnlocked = i === 0 ? true : previousCompleted
    if (!hasRealModuleProgress(progress) && progress.isUnlocked !== liveShouldBeUnlocked) {
      progress.isUnlocked = liveShouldBeUnlocked
    }
    previousCompleted = Boolean(progress.moduleCompleted)
  })

  return modules.map((m, i) => ({
    moduleId: m.moduleId,
    title: m.title,
    description: m.description,
    icon: m.icon,
    color: m.color,
    difficulty: m.difficulty,
    moduleOrder: m.moduleOrder,
    progress: progressDocs[i],
    status: deriveModuleStatus(progressDocs[i]),
  }))
}

export async function markLessonStarted(userId, moduleId) {
  try {
    await mergeDoc(COLLECTION, progressDocId(userId, moduleId), {
      lessonStarted: true,
      lastAccessed: serverTimestamp(),
    })
  } catch (err) {
    console.error('[moduleProgressService] markLessonStarted failed — continuing:', err)
  }
}

export async function markLessonCompleted(userId, moduleId) {
  try {
    await mergeDoc(COLLECTION, progressDocId(userId, moduleId), {
      lessonCompleted: true,
      lastAccessed: serverTimestamp(),
    })
  } catch (err) {
    console.error('[moduleProgressService] markLessonCompleted failed — continuing:', err)
  }
}

export async function markSimulationCompleted(userId, moduleId) {
  try {
    await mergeDoc(COLLECTION, progressDocId(userId, moduleId), {
      simulationCompleted: true,
      lastAccessed: serverTimestamp(),
    })
  } catch (err) {
    console.error('[moduleProgressService] markSimulationCompleted failed — continuing:', err)
  }
}

// Pre-test and post-test completion are no longer written from here.
// Both are recorded by the submitAssessment Cloud Function, which has to
// own that write anyway: it grades server-side, writes the per-question
// `quizResponses` rows no client may touch, and stores the normalized
// gain computed against a pre-test score a client must not be able to
// influence. See src/services/assessmentService.js.

