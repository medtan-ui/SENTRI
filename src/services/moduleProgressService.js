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
import { serverTimestamp } from 'firebase/firestore'
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
    pretestCompleted: false,
    pretestScore: null,
    pretestCompletedAt: null,
    lessonStarted: false,
    lessonCompleted: false,
    simulationCompleted: false,
    quizCompleted: false,
    moduleCompleted: false,
    score: null,
    attempts: 0,
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

/**
 * One student's progress on one module, lazily initialized on first read
 * (module order 1 starts unlocked, every other module starts locked).
 * @param {string} userId
 * @param {string} moduleId
 * @returns {Promise<object|null>} null only if moduleId isn't a real module
 */
export async function getModuleProgress(userId, moduleId) {
  const modules = await listModules()
  const moduleMeta = modules.find((m) => m.moduleId === moduleId)
  if (!moduleMeta) return null
  const seed = defaultProgress(userId, moduleId, moduleMeta.moduleOrder, moduleMeta.moduleOrder === 1)
  return getOrSeedDoc(COLLECTION, progressDocId(userId, moduleId), seed)
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

/**
 * Records a completed pre-test attempt — unlike the markers above, this
 * one does NOT fail soft: the student is actively looking at a submit
 * button waiting for this to land, so a failure must surface as an error
 * they can retry, not disappear silently while the gate stays stuck.
 * @param {string} userId
 * @param {string} moduleId
 * @param {number} score  0-100, informational only — a pre-test has no
 *   passing threshold, this is purely for later comparison against the
 *   module's quiz score.
 */
export async function markPretestCompleted(userId, moduleId, score) {
  await mergeDoc(COLLECTION, progressDocId(userId, moduleId), {
    pretestCompleted: true,
    pretestScore: score,
    pretestCompletedAt: serverTimestamp(),
    lastAccessed: serverTimestamp(),
  })
}

