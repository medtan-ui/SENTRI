/**
 * scenarioConfigAdmin.types.js
 *
 * Admin-side documentation for the data this feature edits. Like the
 * student Scenario Engine (see src/features/scenario/types), this project
 * has no TypeScript toolchain, so shapes are documented as JSDoc typedefs
 * rather than a .ts module.
 *
 * IMPORTANT: an admin-edited scenario is now the *exact* shape the
 * Scenario Engine consumes — src/features/scenario/configs/*.config.js —
 * with no admin-only fields and no translation layer. The engine renders
 * whatever this feature saves, via services/moduleLoader.js.
 *
 * ── What an admin may and may not change ─────────────────────────────
 * Editable (all student-visible copy and media):
 *   scenario: scenario_title, scenario_description, posterCaption,
 *             material_url, videoAvailable, postCompletionReflection
 *   choice:   choice_text, outcome_title, consequence_type,
 *             feedback_text, feedback_media_url
 *
 * Structural, shown read-only (wired to hand-authored React scene
 * components — a form cannot regenerate these, and changing them would
 * silently break the simulation):
 *   scenario: scenario_id, scenario_order, scene, coachTarget
 *   choice:   scenario_choice_id, target, is_safe_choice
 *
 * That split is enforced in one place, not here: mergeScenarioConfig in
 * src/services/scenarioService.js always takes structural fields from the
 * authored config regardless of what a stored document says. The
 * read-only rendering in this feature is the visible half of the same
 * rule.
 */

/** The canonical editable/structural field lists live with the merge
 * logic that enforces them, so there is exactly one definition. */
export {
  EDITABLE_SCENARIO_FIELDS,
  EDITABLE_CHOICE_FIELDS,
  CONSEQUENCE_TYPES,
} from '../../../../services/scenarioService'

/** Human-readable labels for the consequence types, for the editor's
 * dropdown and the flow diagram. */
export const CONSEQUENCE_TYPE_LABELS = {
  credential_compromise: 'Credential compromise',
  account_takeover: 'Account takeover',
  data_exposure: 'Data exposure',
  device_compromise: 'Device compromise',
  financial_loss: 'Financial loss',
  physical_risk: 'Physical risk',
  none: 'No consequence (safe choice)',
}

/**
 * @typedef {Object} ScenarioChoiceConfig
 * @property {string} scenario_choice_id  Structural — read-only.
 * @property {string} target              Structural — read-only.
 * @property {boolean} is_safe_choice     Structural — read-only.
 * @property {string} choice_text
 * @property {string} outcome_title
 * @property {'credential_compromise'|'account_takeover'|'data_exposure'|'device_compromise'|'financial_loss'|'physical_risk'|'none'} consequence_type
 * @property {string} feedback_text
 * @property {string|null} feedback_media_url
 */

/**
 * @typedef {Object} ScenarioConfig
 * @property {string} scenario_id         Structural — read-only.
 * @property {number} scenario_order      Structural — read-only.
 * @property {string} scene               Structural — read-only.
 * @property {string} [coachTarget]       Structural — read-only.
 * @property {string} scenario_title
 * @property {string} scenario_description
 * @property {boolean} videoAvailable
 * @property {string|null} material_url
 * @property {string} posterCaption
 * @property {string} [postCompletionReflection]
 * @property {ScenarioChoiceConfig[]} choices
 */

/**
 * @typedef {Object} ModuleScenarioConfig
 * @property {string} module_id
 * @property {string} module_title
 * @property {'full'|'idle'|'none'} coachLevel
 * @property {ScenarioConfig[]} scenarios
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} field    Dot-path-ish identifier, e.g. "choice-ps-01-a-text"
 * @property {string} message  Human-readable, shown inline near the field.
 */

/**
 * @typedef {Object} ScenarioValidationResult
 * @property {string} scenarioId
 * @property {boolean} isValid
 * @property {ValidationIssue[]} issues
 */
