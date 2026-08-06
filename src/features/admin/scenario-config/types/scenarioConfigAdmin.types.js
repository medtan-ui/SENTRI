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
 *   scenario: scenarioTitle, scenarioDescription, posterCaption,
 *             materialUrl, videoAvailable, postCompletionReflection
 *   choice:   choiceText, outcomeTitle, consequenceType,
 *             feedbackText, feedbackMediaUrl
 *
 * Structural, shown read-only (wired to hand-authored React scene
 * components — a form cannot regenerate these, and changing them would
 * silently break the simulation):
 *   scenario: scenarioId, scenarioOrder, scene, coachTarget
 *   choice:   scenarioChoiceId, target, isSafeChoice
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
 * @property {string} scenarioChoiceId  Structural — read-only.
 * @property {string} target              Structural — read-only.
 * @property {boolean} isSafeChoice     Structural — read-only.
 * @property {string} choiceText
 * @property {string} outcomeTitle
 * @property {'credential_compromise'|'account_takeover'|'data_exposure'|'device_compromise'|'financial_loss'|'physical_risk'|'none'} consequenceType
 * @property {string} feedbackText
 * @property {string|null} feedbackMediaUrl
 */

/**
 * @typedef {Object} ScenarioConfig
 * @property {string} scenarioId         Structural — read-only.
 * @property {number} scenarioOrder      Structural — read-only.
 * @property {string} scene               Structural — read-only.
 * @property {string} [coachTarget]       Structural — read-only.
 * @property {string} scenarioTitle
 * @property {string} scenarioDescription
 * @property {boolean} videoAvailable
 * @property {string|null} materialUrl
 * @property {string} posterCaption
 * @property {string} [postCompletionReflection]
 * @property {ScenarioChoiceConfig[]} choices
 */

/**
 * @typedef {Object} ModuleScenarioConfig
 * @property {string} moduleId
 * @property {string} moduleTitle
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
