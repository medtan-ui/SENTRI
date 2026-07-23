/**
 * quizConfigAdmin.types.js
 *
 * Like the Scenario Configuration feature, this project has no
 * TypeScript toolchain, so shapes are documented as JSDoc typedefs
 * rather than a .ts module.
 *
 * SENTRI has exactly six predefined modules, each with exactly one
 * predefined quiz. Nothing here supports creating additional quizzes,
 * categories, question banks, or imports — administrators only edit
 * the fixed set of questions and settings for one module's one quiz.
 */

/** Every question has exactly 4 choices — a fixed quiz-question shape,
 * not a variable-length list like the Scenario Engine's 2-3 choices. */
export const CHOICES_PER_QUESTION = 4

export const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard']

/**
 * @typedef {Object} QuizChoice
 * @property {string} id
 * @property {string} text
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {number} order              1-based, fixed count, reorderable via up/down only.
 * @property {string} text
 * @property {QuizChoice[]} choices       Always 4 entries.
 * @property {string} correctChoiceId     Must reference one of `choices`.
 * @property {string} explanation         Shown after the student submits an answer.
 * @property {'Easy'|'Medium'|'Hard'} difficulty
 */

/**
 * @typedef {Object} QuizSettings
 * @property {number} passingScore        Percentage, 0-100.
 * @property {number} timeLimitMinutes
 * @property {string} instructions        Shown to the student before starting.
 * @property {boolean} available          Whether students can currently take this quiz.
 */

/**
 * @typedef {Object} QuizConfig
 * @property {string} moduleId
 * @property {string} title
 * @property {QuizSettings} settings
 * @property {QuizQuestion[]} questions
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} field
 * @property {string} message
 */

/**
 * @typedef {Object} QuestionValidationResult
 * @property {string} questionId
 * @property {boolean} isValid
 * @property {ValidationIssue[]} issues
 */

export {}
