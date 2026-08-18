/**
 * scenarioService.js
 * Firestore-backed access to the `moduleScenarios` collection — one
 * module's Scenario Engine configuration.
 *
 * ── Why this file changed shape ──────────────────────────────────────
 * This collection used to store a *different* model than the engine
 * consumes (paused-video-plus-branching-choices: `{id, title, video,
 * pauseTimestamp, choices:[{text, isSafe, feedbackTitle…}]}`), while the
 * student engine ran on hand-authored local configs. Nothing bridged the
 * two, so admin edits to scenario text never reached students. The
 * stored shape is now the engine's own `ModuleScenarioConfig`, and
 * services/moduleLoader.js reads it on the student path.
 *
 * ── The structural / editable split ──────────────────────────────────
 * A scenario is half content and half *wiring*. `scene` names a bespoke
 * React component; `target` names a clickable element inside that
 * component; `isSafeChoice` is what that component's own logic was
 * written against. None of those can be regenerated from a form, and an
 * admin editing them would silently break the simulation — so they are
 * always taken from the authored config in
 * src/features/scenario/configs/ and shown read-only in the admin UI.
 *
 * Everything else — every piece of text a student reads, plus video
 * URLs and poster captions — is admin-editable and layered over the
 * authored config by mergeScenarioConfig below. That way a saved
 * document can never produce a scenario the engine cannot render, even
 * if a future code change adds, removes, or rewires a scenario.
 */
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { SCENARIO_CONFIG_REGISTRY } from '../features/scenario/configs'
import { getOrSeedDoc, overwriteDoc, mergeDoc } from './firestoreDoc'

const COLLECTION = 'moduleScenarios'

/** Bumped whenever the persisted scenario shape changes incompatibly.
 *
 * v3: the phishing module's safe path moved from reporting the email to
 * verifying with the instructor, and the malware module lost a scenario
 * and gained a site-check choice. Stored text written against v2 names
 * elements those scenes no longer have, so a v2 document has to be
 * treated as stale rather than layered over the new config — see
 * mergeScenarioConfig. */
export const SCENARIO_CONTENT_VERSION = 3

/** Scenario-level fields an admin may edit. Everything else is structural. */
export const EDITABLE_SCENARIO_FIELDS = [
  'scenarioTitle',
  'scenarioDescription',
  'posterCaption',
  'materialUrl',
  'videoAvailable',
  'postCompletionReflection',
]

/** Choice-level fields an admin may edit. Everything else is structural. */
export const EDITABLE_CHOICE_FIELDS = [
  'choiceText',
  'outcomeTitle',
  'consequenceType',
  'feedbackText',
  'feedbackMediaUrl',
  'consequenceVideoUrl',
]

/** The consequence types ConsequenceOverlay knows how to illustrate. */
export const CONSEQUENCE_TYPES = [
  'credential_compromise',
  'account_takeover',
  'data_exposure',
  'device_compromise',
  'financial_loss',
  'physical_risk',
  'none',
]

function clone(value) {
  return value === null || value === undefined ? value : JSON.parse(JSON.stringify(value))
}

/**
 * The authored engine config for a module, as a standalone document.
 * @param {string} moduleId
 * @returns {object|null}
 */
function seedFor(moduleId) {
  const authored = SCENARIO_CONFIG_REGISTRY[moduleId]
  if (!authored) return null
  return { ...clone(authored), contentVersion: SCENARIO_CONTENT_VERSION }
}

/**
 * Copies only `fields` from `stored` onto `base`, and only where the
 * stored value is actually present. A missing or undefined stored field
 * keeps the authored value rather than blanking it.
 */
function overlay(base, stored, fields) {
  if (!stored || typeof stored !== 'object') return base
  const result = { ...base }
  fields.forEach((field) => {
    const value = stored[field]
    if (value !== undefined) result[field] = value
  })
  return result
}

/**
 * Layers an admin-saved document over the authored config, taking only
 * editable fields from storage and every structural field from code.
 * Scenarios and choices are matched by id, so a stored document that
 * predates a code change (a renamed scenario, a new choice) contributes
 * whatever still matches and is ignored everywhere else.
 *
 * @param {object|null} stored  Raw Firestore data, or null.
 * @param {string} moduleId
 * @returns {object|null} null only when moduleId has no authored config.
 */
export function mergeScenarioConfig(stored, moduleId) {
  const authored = seedFor(moduleId)
  if (!authored) return null
  if (!stored || !Array.isArray(stored.scenarios)) return authored

  // A document saved against an older authored config describes scenes
  // that have since changed shape: its choice text can name a control
  // that no longer exists, and its feedback can explain a decision the
  // student is no longer asked to make. Layering that over the new
  // config would produce a scenario that plays one way and reads
  // another, which is worse than losing an admin's edits, so a stale
  // document is ignored entirely and the authored content stands.
  if (stored.contentVersion !== SCENARIO_CONTENT_VERSION) return authored

  const storedScenarios = new Map(
    stored.scenarios.filter((s) => s && s.scenarioId).map((s) => [s.scenarioId, s]),
  )

  return {
    ...authored,
    moduleTitle: stored.moduleTitle || authored.moduleTitle,
    coachLevel: stored.coachLevel || authored.coachLevel,
    scenarios: authored.scenarios.map((scenario) => {
      const storedScenario = storedScenarios.get(scenario.scenarioId)
      const merged = overlay(scenario, storedScenario, EDITABLE_SCENARIO_FIELDS)

      const storedChoices = new Map(
        (storedScenario?.choices || [])
          .filter((c) => c && c.scenarioChoiceId)
          .map((c) => [c.scenarioChoiceId, c]),
      )

      return {
        ...merged,
        choices: scenario.choices.map((choice) =>
          overlay(choice, storedChoices.get(choice.scenarioChoiceId), EDITABLE_CHOICE_FIELDS),
        ),
      }
    }),
  }
}

/**
 * Read-only fetch used on the *student* path (via moduleLoader). Never
 * writes and never rejects — a Firestore failure falls back to the
 * authored config so a simulation always runs.
 *
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function readScenario(moduleId) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, moduleId))
    return mergeScenarioConfig(snap.exists() ? snap.data() : null, moduleId)
  } catch (err) {
    console.error(`[scenarioService] readScenario(${moduleId}) failed — falling back to authored config:`, err)
    return seedFor(moduleId)
  }
}

/**
 * Admin-path fetch: reads the document, lazily seeding it from the
 * authored config on first open.
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function getScenario(moduleId) {
  const seed = seedFor(moduleId)
  const stored = await getOrSeedDoc(COLLECTION, moduleId, seed)

  // On the admin path a stale document is also rewritten, not just
  // ignored: the editor should be editing what students are actually
  // being shown, and leaving the old text in Firestore would mean the
  // next save silently reintroduced it.
  if (seed && stored && stored.contentVersion !== SCENARIO_CONTENT_VERSION) {
    try {
      await overwriteDoc(COLLECTION, moduleId, seed)
    } catch (err) {
      console.error(`[scenarioService] refreshing stale ${moduleId} scenario doc failed — showing authored content anyway:`, err)
    }
    return mergeScenarioConfig(seed, moduleId)
  }

  return mergeScenarioConfig(stored, moduleId)
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
  await overwriteDoc(COLLECTION, moduleId, { ...data, contentVersion: SCENARIO_CONTENT_VERSION })
}

/**
 * The original authored values — never mutated. Used by "Reset to
 * Defaults" (distinct from "Cancel", which reverts to the last *saved*
 * state).
 * @param {string} moduleId
 * @returns {object|null}
 */
export function getDefaultScenario(moduleId) {
  return seedFor(moduleId)
}
