/**
 * scenarioConfigAdmin.types.js
 *
 * Admin-side documentation for the data this feature edits. Like the
 * student Scenario Engine (see src/features/scenario/types), this project
 * has no TypeScript toolchain, so shapes are documented as JSDoc typedefs
 * rather than a .ts module.
 *
 * IMPORTANT: an admin-edited scenario is the exact same shape the
 * Scenario Engine consumes (see ../../../scenario/types/scenario.types.js
 * — Scenario / ScenarioChoice / ScenarioVideo), plus one admin-only
 * field: `order`. The engine ignores unknown fields, so `order` never
 * needs to be stripped before this data reaches the engine.
 */

/** Fixed choice-count bounds — this is not a general-purpose builder. */
export const MIN_CHOICES = 2
export const MAX_CHOICES = 3

/** The only three scenarios that exist per module. Scenarios are never
 * added, removed, or reordered relative to each other — only their
 * content and their choices are editable. */
export const SCENARIOS_PER_MODULE = 3

/**
 * @typedef {Object} AdminScenarioVideo
 * @property {string} videoUrl
 * @property {boolean} videoAvailable
 * @property {string} [thumbnail]
 * @property {number} duration
 */

/**
 * @typedef {Object} AdminScenarioChoice
 * @property {string} id
 * @property {string} text
 * @property {boolean} isSafe
 * @property {string} feedbackTitle
 * @property {string} feedbackText
 * @property {AdminScenarioVideo} [consequenceVideo]  Present only for a
 *   "Video" consequence type. Absent = "Still Image" (the engine's
 *   generic warning placeholder — there is no separate image asset).
 */

/**
 * @typedef {Object} AdminScenario
 * @property {string} id
 * @property {string} title
 * @property {number} order          1-based position. Display-only, fixed.
 * @property {string} [simulatedUrl]
 * @property {AdminScenarioVideo} video
 * @property {number} pauseTimestamp
 * @property {AdminScenarioChoice[]} choices  2-3 entries.
 */

/**
 * @typedef {Object} AdminModuleScenarioConfig
 * @property {string} id
 * @property {string} title
 * @property {'browser'|'phone'} surface
 * @property {AdminScenario[]} scenarios  Always exactly 3.
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} field    Dot-path-ish identifier, e.g. "choice-1.text"
 * @property {string} message  Human-readable, shown inline near the field.
 */

/**
 * @typedef {Object} ScenarioValidationResult
 * @property {string} scenarioId
 * @property {boolean} isValid
 * @property {ValidationIssue[]} issues
 */

export {}
