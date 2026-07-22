import { MODULE_CONTENT_REGISTRY } from '../data/moduleContent'

// Stands in for future network latency (a real Firestore read). Keeping
// loadModuleConfig async now means swapping the body for a Firestore call
// later won't change any caller's code.
const SIMULATED_LOAD_DELAY_MS = 250

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * loadModuleConfig
 * The single seam between "a module id" and everything a student-facing
 * page needs to render it: lesson content, the Scenario Engine's config,
 * and a reserved (currently null) quiz config.
 *
 * Mock-data-only today — reads from MODULE_CONTENT_REGISTRY. Firebase
 * integration later only has to replace this function's body; every
 * caller already treats it as async and already handles a missing result.
 *
 * @param {string} moduleId
 * @returns {Promise<{ moduleId: string, title: string, description: string, difficulty: string, previousModuleId: string|null, lesson: object, scenario: object, quiz: object|null } | null>}
 */
export async function loadModuleConfig(moduleId) {
  await delay(SIMULATED_LOAD_DELAY_MS)
  return MODULE_CONTENT_REGISTRY[moduleId] ?? null
}
