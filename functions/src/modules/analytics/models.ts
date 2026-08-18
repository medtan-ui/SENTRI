import { BehaviourMetrics, ItemAnalysis, TopicMastery, TransferAnalysis } from './metrics'

export const ANALYTICS_EVENT_TYPES = [
  'lesson_viewed',
  'lesson_completed',
  'simulation_started',
  'simulation_completed',
  'pretest_submitted',
  'quiz_started',
  'quiz_submitted',
  'posttest_submitted',
  'module_completed',
  'dashboard_viewed',
] as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]

export interface RecordAnalyticsEventInput {
  moduleId?: string
  eventType: AnalyticsEventType
  payload?: Record<string, unknown>
  /**
   * How long the activity this event closes out actually took, in
   * milliseconds. Promoted to a top-level field rather than buried in
   * `payload` because it is the one piece of event metadata every
   * time-on-task question needs to filter and average on.
   */
  durationMs?: number
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

  // ── Learning Analytics framework ─────────────────────────────────
  /** Pre/post measurement over the shared item bank. */
  avgPreTestScore: number
  avgPostTestScore: number
  /** Hake's normalized gain, averaged per student. Null with no pairs. */
  normalizedGain: number | null
  /** How many students have both a pre- and a post-test on record. */
  pairedCount: number
  postTestCompletedCount: number
  topicMastery: TopicMastery[]
  itemAnalysis: ItemAnalysis[]
  behaviour: BehaviourMetrics

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

  // ── Learning Analytics framework, per student ────────────────────
  avgPreTestScore: number
  avgPostTestScore: number
  normalizedGain: number | null
  pairedCount: number
  topicMastery: TopicMastery[]
  behaviour: BehaviourMetrics
  transfer: TransferAnalysis
  /** Module-by-module snapshot in curriculum order — the per-student
   * time series the progress page charts. */
  timeline: StudentTimelinePoint[]

  updatedAt: FirebaseFirestore.FieldValue
}

export interface StudentTimelinePoint {
  moduleId: string
  moduleOrder: number
  preTestScore: number | null
  quizScore: number | null
  postTestScore: number | null
  normalizedGain: number | null
  firstAttemptSafeRate: number | null
  completedAt: FirebaseFirestore.Timestamp | null
}

/**
 * The one aggregate not keyed by a single module or student: everything
 * that only means something across the whole curriculum and the whole
 * cohort — transfer between modules, and the class-level rollup an
 * instructor reads instead of six separate module cards.
 */
export interface CohortAnalyticsDoc {
  totalStudents: number
  activeStudents: number
  studentsCompletedAll: number
  avgModulesCompleted: number
  avgPreTestScore: number
  avgPostTestScore: number
  normalizedGain: number | null
  pairedCount: number
  behaviour: BehaviourMetrics
  transfer: TransferAnalysis
  topicMastery: TopicMastery[]
  /** Per-module completion/score snapshot, in curriculum order. */
  moduleBreakdown: CohortModulePoint[]
  /** Completions per day over the trailing window — the time series the
   * admin dashboard charts, so progress is visible as a trend and not
   * only as a current snapshot. */
  completionTrend: TrendPoint[]
  /** How many students hold each badge, and the share of the cohort that
   * is. Read by the admin dashboard, and by getMyGamification so a
   * student's own shelf can show how rare each badge is. */
  badgeDistribution: BadgeDistributionPoint[]
  updatedAt: FirebaseFirestore.FieldValue
}

export interface BadgeDistributionPoint {
  badgeId: string
  name: string
  tier: string
  earnedCount: number
  /** Percent of the whole student roster, one decimal place. */
  earnedPct: number
}

export interface CohortModulePoint {
  moduleId: string
  moduleOrder: number
  title: string
  studentsStarted: number
  studentsCompleted: number
  completionRate: number
  avgScore: number
  normalizedGain: number | null
  firstAttemptSafeRate: number | null
}

export interface TrendPoint {
  /** ISO date, YYYY-MM-DD, in UTC. */
  date: string
  modulesCompleted: number
  quizzesSubmitted: number
  activeStudents: number
}

export interface LearningAnalyticsDoc {
  userId: string
  moduleId: string
  safeChoices: number
  riskyChoices: number
  totalDecisions: number
  lastDecisionAt: FirebaseFirestore.FieldValue
}
