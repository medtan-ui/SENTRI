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
  MODULE_ASSIGNMENTS: 'moduleAssignments',
  MODULE_PROGRESS: 'moduleProgress',
  SCENARIO_DECISION_RECORDS: 'scenario_decision_records',
  QUIZ_ATTEMPTS: 'quizAttempts',
  ANALYTICS_EVENTS: 'analyticsEvents',
  MODULE_ANALYTICS: 'moduleAnalytics',
  STUDENT_ANALYTICS: 'studentAnalytics',
  LEARNING_ANALYTICS: 'learningAnalytics',
} as const

export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const

export const MODULE_STATUS = {
  ENABLED: 'Enabled',
  DISABLED: 'Disabled',
} as const

export const MIN_PASSWORD_LENGTH = 8
