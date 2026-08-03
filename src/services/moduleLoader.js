import { MODULE_CONTENT_REGISTRY } from '../data/moduleContent'
import { DIFFICULTY_TO_CURRICULUM } from '../pages/Admin/ModuleConfiguration/mockConfigData'
import { readLesson } from './lessonService'
import { readScenario } from './scenarioService'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

/**
 * loadModuleConfig
 * The single seam between "a module id" and everything a student-facing
 * page needs to render it: the module's own metadata, its lesson
 * content, and its Scenario Engine config.
 *
 * This is now genuinely Firestore-backed. Three documents are read in
 * parallel and layered over the authored local content in
 * src/data/moduleContent/:
 *
 *   modules/{id}        → title, description, difficulty  (Overview tab)
 *   moduleLessons/{id}  → video id + lesson body          (Lesson Editor)
 *   moduleScenarios/{id}→ scenario copy/media             (Scenario Config)
 *
 * The local registry stays as the authoritative *fallback* and as the
 * owner of everything structural that admins can't edit (which bespoke
 * scene renders a scenario, which interactive target maps to which
 * choice, the curriculum ordering). So an admin's text edits reach
 * students, while a Firestore outage, a permission error, or a
 * half-written document still leaves a working lesson on screen instead
 * of a blank page.
 *
 * @param {string} moduleId
 * @returns {Promise<{ moduleId: string, title: string, description: string, difficulty: string, previousModuleId: string|null, videoId: string, lesson: object, scenario: object, quiz: object|null } | null>}
 */
export async function loadModuleConfig(moduleId) {
  const local = MODULE_CONTENT_REGISTRY[moduleId] ?? null
  if (!local) return null

  const [moduleDoc, lesson, scenario] = await Promise.all([
    readModuleDoc(moduleId),
    readLesson(moduleId),
    readScenario(moduleId),
  ])

  return {
    ...local,
    title: moduleDoc?.title || local.title,
    description: moduleDoc?.description || local.description,
    difficulty: normalizeDifficulty(moduleDoc?.difficulty) || local.difficulty,
    videoId: lesson?.videoId ?? local.videoId,
    lesson: lesson ?? local.lesson,
    scenario: scenario ?? local.scenario,
  }
}

/**
 * Read-only fetch of the module's base record. Deliberately does *not*
 * lazily seed (unlike moduleService.getModule) — this runs on a student's
 * lesson/scenario page load, where a missing document should quietly fall
 * back to authored content rather than trigger a write.
 */
async function readModuleDoc(moduleId) {
  try {
    const snap = await getDoc(doc(db, 'modules', moduleId))
    return snap.exists() ? snap.data() : null
  } catch (err) {
    console.error(`[moduleLoader] readModuleDoc(${moduleId}) failed — using authored metadata:`, err)
    return null
  }
}

/**
 * The Overview tab persists Easy/Medium/Hard; the student badge is styled
 * per Beginner/Intermediate/Advanced. Values already on the student scale
 * pass through untouched.
 */
function normalizeDifficulty(value) {
  if (!value) return null
  return DIFFICULTY_TO_CURRICULUM[value] || value
}
