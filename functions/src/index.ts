/**
 * functions/src/index.ts
 * Entry point: initializes the Admin SDK app once (via shared/admin) and
 * sets the global region/instance options, then re-exports every callable
 * and trigger. Organized by the modules described in the project spec:
 * auth/ (account management), modules/admin (content configuration),
 * modules/scenario, modules/quiz, modules/progress, modules/analytics,
 * modules/gamification.
 */
import { setGlobalOptions } from 'firebase-functions/v2'
import './shared/admin'

setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

export {
  changeOwnPassword,
  createUserAccount,
  deleteUserAccount,
  getAuditLog,
  listUsers,
  registerStudentAccount,
  resetUserPassword,
  setUserAccountStatus,
  setUserSection,
  updateOwnNickname,
} from './auth/controllers'

export {
  createModuleConfiguration,
  updateAssignments,
  updateLessonContent,
  updateQuizConfiguration,
  updateScenarioConfiguration,
  validateModuleConfiguration,
} from './modules/admin/controllers'

export { submitScenarioDecision } from './modules/scenario/controllers'

export { submitQuiz } from './modules/quiz/controllers'

export { submitAssessment } from './modules/assessment/controllers'

export { getUserBadges } from './modules/badges/controllers'


export {
  completeLesson,
  completeModule,
  completeSimulation,
  grantQuizRetry,
  initializeStudentProgress,
  resetModuleProgress,
  unlockNextModule,
} from './modules/progress/controllers'

export {
  getLeaderboard,
  getMyGamification,
  recordDailyVisit,
  updateGamificationOnProgress,
} from './modules/gamification/controllers'

export {
  aggregateCohortAnalytics,
  aggregateModuleAnalytics,
  aggregateStudentAnalytics,
  listSections,
  recordAnalyticsEvent,
  scheduledAnalyticsAggregation,
  updateLearningAnalytics,
} from './modules/analytics/controllers'
