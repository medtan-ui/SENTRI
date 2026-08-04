/**
 * shared/constants.ts
 * SENTRI's curriculum is fixed at exactly these six modules (mirrors the
 * independent copy already kept in firestore.rules' isRealModuleId() and
 * src/pages/Admin/Modules/mockModules.js on the frontend — the frontend
 * build can't be imported into this one, so this is a deliberate, narrow
 * duplication of the same fixed reference list, not general business logic).
 */
export const REAL_MODULE_IDS = [
  'password-security',
  'phishing-awareness',
  'malware-awareness',
  'safe-browsing',
  'data-privacy',
  'online-safety',
] as const

export type ModuleId = (typeof REAL_MODULE_IDS)[number]

export const COLLECTIONS = {
  USERS: 'users',
  AUDIT_LOGS: 'auditLogs',
  MODULES: 'modules',
  MODULE_LESSONS: 'moduleLessons',
  MODULE_SCENARIOS: 'moduleScenarios',
  MODULE_QUIZZES: 'moduleQuizzes',
  MODULE_PRETESTS: 'modulePretests',
  MODULE_ASSIGNMENTS: 'moduleAssignments',
  MODULE_PROGRESS: 'moduleProgress',
  SCENARIO_DECISION_RECORDS: 'scenario_decision_records',
  QUIZ_ATTEMPTS: 'quizAttempts',
  /** One document per answered question, across pre-test, quiz, and
   * post-test. This is the grain item analysis needs — a quizAttempts
   * document only carries a whole-attempt score. */
  QUIZ_RESPONSES: 'quiz_responses',
  ANALYTICS_EVENTS: 'analyticsEvents',
  MODULE_ANALYTICS: 'moduleAnalytics',
  STUDENT_ANALYTICS: 'studentAnalytics',
  LEARNING_ANALYTICS: 'learningAnalytics',
  /** Cross-module, cohort-level rollup — the one aggregate that isn't
   * keyed by a single module or a single student. */
  COHORT_ANALYTICS: 'cohortAnalytics',
  /** One document per student: points, rank, badges, streak. Derived from
   * MODULE_PROGRESS on every meaningful write (see modules/gamification),
   * so it is a cache of the reward layer, never a second source of truth
   * about what a student has actually completed. */
  GAMIFICATION: 'gamification',
} as const

/**
 * The three points a student is measured at. Pre-test and post-test use
 * the *same* instrument (modulePretests/{moduleId}) on purpose — a
 * normalized learning gain is only interpretable when both measurements
 * come from identical items.
 */
export const ASSESSMENT_TYPES = ['pretest', 'quiz', 'posttest'] as const
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number]

export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const

export const MODULE_STATUS = {
  ENABLED: 'Enabled',
  DISABLED: 'Disabled',
} as const

export const MIN_PASSWORD_LENGTH = 8
