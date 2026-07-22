/**
 * scenarioService.js
 * Firestore-backed access to the `moduleScenarios` collection — one
 * module's Scenario Engine configuration: scenario order, pause
 * timestamp, video URL/availability, choices (with the single safe
 * choice), feedback, consequence, and surface type (browser/phone).
 *
 * This is exactly the shape the Scenario Engine already consumes (see
 * src/features/scenario/types/scenario.types.js) — Firestore only
 * replaces where that shape is stored, never the shape itself, so the
 * engine requires zero changes.
 *
 * Seeded lazily from the existing Scenario Configuration mock data —
 * see getDefaultScenarioConfig in src/features/admin/scenario-config/
 * services/scenarioConfigService.js — so the already-authored scenario
 * content (including Password Security's real engine config) becomes
 * each document's initial Firestore value instead of being thrown away.
 */
import { getDefaultScenarioConfig } from '../features/admin/scenario-config/services/scenarioConfigService'
import { getOrSeedDoc, overwriteDoc, mergeDoc } from './firestoreDoc'

const COLLECTION = 'moduleScenarios'

/**
 * @param {string} moduleId
 * @returns {Promise<import('../features/admin/scenario-config/types/scenarioConfigAdmin.types').AdminModuleScenarioConfig | null>}
 */
export async function getScenario(moduleId) {
  return getOrSeedDoc(COLLECTION, moduleId, getDefaultScenarioConfig(moduleId))
}

/**
 * @param {string} moduleId
 * @param {object} patch
 */
export async function updateScenario(moduleId, patch) {
  await mergeDoc(COLLECTION, moduleId, patch)
}

/**
 * @param {string} moduleId
 * @param {object} data  Full scenario document to overwrite with.
 */
export async function saveScenario(moduleId, data) {
  await overwriteDoc(COLLECTION, moduleId, data)
}

/**
 * The original seed values — never mutated. Used by "Reset to Defaults".
 * @param {string} moduleId
 * @returns {object|null}
 */
export function getDefaultScenario(moduleId) {
  return getDefaultScenarioConfig(moduleId)
}
