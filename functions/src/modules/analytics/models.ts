export const ANALYTICS_EVENT_TYPES = [
  'lesson_viewed',
  'lesson_completed',
  'simulation_started',
  'simulation_completed',
  'quiz_started',
  'quiz_submitted',
  'module_completed',
  'dashboard_viewed',
] as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]

export interface RecordAnalyticsEventInput {
  moduleId?: string
  eventType: AnalyticsEventType
  payload?: Record<string, unknown>
}

export interface ModuleAnalyticsDoc {
  moduleId: string
  totalStudents: number
  completedCount: number
  completionRate: number
  attemptedQuizCount: number
  passCount: number
  passRate: number
  avgScore: number
  /** scenarioId -> choiceId -> selection count, across every student. */
  choiceBreakdown: Record<string, Record<string, number>>
  updatedAt: FirebaseFirestore.FieldValue
}

export interface StudentAnalyticsDoc {
  userId: string
  modulesCompleted: number
  modulesInProgress: number
  avgQuizScore: number
  totalSafeChoices: number
  totalRiskyChoices: number
  lastActivityAt: FirebaseFirestore.Timestamp | null
  updatedAt: FirebaseFirestore.FieldValue
}

export interface LearningAnalyticsDoc {
  userId: string
  moduleId: string
  safeChoices: number
  riskyChoices: number
  totalDecisions: number
  lastDecisionAt: FirebaseFirestore.FieldValue
}
