/**
 * lessonService.js
 * Firestore-backed access to the `moduleLessons` collection — one
 * module's lesson content exactly as the student Lesson Viewer renders
 * it: video id, learning objectives, the ordered reading sections, best
 * practices, key takeaways, and references.
 *
 * ── Why this file changed shape ──────────────────────────────────────
 * This collection used to store a different model than the one students
 * actually read (a single `lessonContent` blob plus `introduction` /
 * `realWorldExample`), while the Lesson Viewer read hardcoded local
 * files. Nothing bridged the two, so admin edits never reached anyone.
 * The stored shape is now the *student's* shape, seeded from the real
 * authored content in src/data/moduleContent/, and the Lesson Viewer
 * reads this collection through services/moduleLoader.js. Editing a
 * lesson in the admin Lesson Content Editor now changes what students
 * see.
 *
 * Documents carry `contentVersion: LESSON_CONTENT_VERSION`. A document
 * written under the old model has no `sections` array; rather than
 * trying to machine-translate that thinner placeholder text into
 * sections, `normalizeLesson` simply falls back to the authored seed —
 * nothing was ever reading those legacy documents, so there is no
 * student-visible content to preserve.
 */
import { MODULE_CONTENT_REGISTRY } from '../data/moduleContent'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { getOrSeedDoc, overwriteDoc, mergeDoc } from './firestoreDoc'

const COLLECTION = 'moduleLessons'

/** Bumped whenever the persisted lesson shape changes incompatibly. */
export const LESSON_CONTENT_VERSION = 2

/**
 * The authored default for a module — the content in
 * src/data/moduleContent/, reshaped into a standalone lesson document.
 * Never mutated: every caller gets a fresh copy.
 * @param {string} moduleId
 * @returns {object|null}
 */
function seedFor(moduleId) {
  const source = MODULE_CONTENT_REGISTRY[moduleId]
  if (!source) return null
  const { lesson } = source
  return {
    moduleId,
    contentVersion: LESSON_CONTENT_VERSION,
    videoId: source.videoId || '',
    objectives: [...lesson.objectives],
    sections: lesson.sections.map((s) => ({ ...s })),
    bestPractices: [...lesson.bestPractices],
    keyTakeaways: [...lesson.keyTakeaways],
    references: lesson.references.map((r) => ({ ...r })),
  }
}

/**
 * Coerces whatever came back from Firestore into a lesson document the
 * Lesson Viewer and Lesson Editor can both render, falling back field by
 * field to the authored seed. Never throws and never returns a document
 * missing a field a renderer indexes into — a half-written or
 * legacy-shaped document degrades to authored content rather than
 * crashing a student's lesson page.
 *
 * @param {object|null} stored  Raw Firestore data, or null.
 * @param {string} moduleId
 * @returns {object|null} null only when the moduleId isn't a real module.
 */
export function normalizeLesson(stored, moduleId) {
  const seed = seedFor(moduleId)
  if (!seed) return null
  if (!stored || !Array.isArray(stored.sections) || stored.sections.length === 0) return seed

  const list = (value, fallback) =>
    Array.isArray(value) && value.length > 0 ? value.filter((v) => typeof v === 'string') : fallback

  return {
    moduleId,
    contentVersion: LESSON_CONTENT_VERSION,
    videoId: typeof stored.videoId === 'string' ? stored.videoId : seed.videoId,
    objectives: list(stored.objectives, seed.objectives),
    sections: stored.sections
      .filter((s) => s && typeof s === 'object')
      .map((s, i) => ({
        id: s.id || `section-${i + 1}`,
        title: s.title || `Section ${i + 1}`,
        content: s.content || '',
      })),
    bestPractices: list(stored.bestPractices, seed.bestPractices),
    keyTakeaways: list(stored.keyTakeaways, seed.keyTakeaways),
    references: Array.isArray(stored.references)
      ? stored.references
          .filter((r) => r && typeof r === 'object')
          .map((r, i) => ({ id: r.id || `ref-${i + 1}`, title: r.title || '', link: r.link || '' }))
      : seed.references,
  }
}

/**
 * Read-only fetch used on the *student* path (via moduleLoader). Never
 * writes, so it works under the read-only student rule on this
 * collection, and never rejects — a Firestore failure falls back to the
 * authored content rather than leaving a student with a blank lesson.
 *
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function readLesson(moduleId) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, moduleId))
    return normalizeLesson(snap.exists() ? snap.data() : null, moduleId)
  } catch (err) {
    console.error(`[lessonService] readLesson(${moduleId}) failed — falling back to authored content:`, err)
    return seedFor(moduleId)
  }
}

/**
 * Admin-path fetch: reads the document, lazily seeding it from the
 * authored content on first open so the editor always starts from real
 * text rather than an empty form.
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function getLesson(moduleId) {
  const stored = await getOrSeedDoc(COLLECTION, moduleId, seedFor(moduleId))
  return normalizeLesson(stored, moduleId)
}

/**
 * @param {string} moduleId
 * @param {object} patch
 */
export async function updateLesson(moduleId, patch) {
  await mergeDoc(COLLECTION, moduleId, patch)
}

/**
 * @param {string} moduleId
 * @param {object} data  Full lesson document to overwrite with.
 */
export async function saveLesson(moduleId, data) {
  await overwriteDoc(COLLECTION, moduleId, { ...data, contentVersion: LESSON_CONTENT_VERSION })
}

/**
 * The original authored values — never mutated. Used by "Discard Changes"
 * / "Reset to Defaults".
 * @param {string} moduleId
 * @returns {object|null}
 */
export function getDefaultLesson(moduleId) {
  return seedFor(moduleId)
}
