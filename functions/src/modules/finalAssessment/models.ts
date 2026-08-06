/**
 * modules/finalAssessment/models.ts
 * The single end-of-curriculum assessment — one graded test taken after
 * all six modules are complete, replacing what used to be six separate
 * per-module post-tests.
 *
 * Its item bank is seeded from the six modules' pre-test banks
 * (modulePretests/{moduleId}), which is what keeps the normalized-gain
 * claim honest: the "after" measurement uses the same items as the six
 * "before" measurements, so gain is computed from identical questions
 * rather than two different instruments. An admin may edit the questions
 * afterward exactly like a module quiz; doing so weakens that guarantee,
 * which is why the stored gain is written once at submit time and never
 * recomputed on read.
 */

export interface FinalAssessmentChoice {
  id: string
  text: string
}

export interface FinalAssessmentQuestion {
  id: string
  order: number
  text: string
  choices: FinalAssessmentChoice[]
  correctChoiceId: string
  explanation: string
  difficulty: string
  /** Topic slug, shared with the per-module pre-test bank — this is what
   * makes per-topic pre/post comparison computable. */
  topic?: string
  /** Which module's pre-test bank this item was seeded from. Kept so the
   * admin editor can group items by module, and so per-module gain stays
   * derivable from item-level responses even though the assessment itself
   * is no longer per-module. */
  sourceModuleId?: string
}

export interface FinalAssessmentSettings {
  passingScore: number
  timeLimitMinutes: number
  instructions: string
  /** An admin can close the final assessment without deleting it. */
  available: boolean
  /** Attempts a student gets by default. */
  attemptsAllowed: number
}

export interface FinalAssessmentConfig {
  title: string
  settings: FinalAssessmentSettings
  questions: FinalAssessmentQuestion[]
}

export interface SubmitFinalAssessmentInput {
  answers: Record<string, string>
  durations?: Record<string, number>
}

export interface FinalAssessmentItemResult {
  questionId: string
  topic: string | null
  sourceModuleId: string | null
  correct: boolean
  selectedChoiceId: string | null
  correctChoiceId: string
  explanation: string
  durationMs: number | null
}

/**
 * One document per student, in `finalAssessmentProgress`. Written only by
 * this module's Cloud Function.
 */
export interface FinalAssessmentProgressDoc {
  userId: string
  completed: boolean
  score: number | null
  passed: boolean
  attempts: number
  attemptsAllowed: number
  /** Mean of the student's six per-module pre-test scores, stored at
   * submit time so a later pre-test reset can't retroactively move a
   * reported gain. Null when no pre-test was ever taken. */
  averagePreTestScore: number | null
  /** Hake's normalized gain: (post - pre) / (100 - pre), clamped to
   * [-1, 1]. Null when there is no pre-test average, or when it was
   * already 100 (no headroom, so the ratio is undefined rather than 0). */
  normalizedGain: number | null
  completedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null
  lastAttemptAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null
  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
}

export interface SubmitFinalAssessmentResult {
  score: number
  correctCount: number
  total: number
  passed: boolean
  passingScore: number
  perQuestionResults: FinalAssessmentItemResult[]
  attemptNumber: number
  attemptsAllowed: number
  attemptsRemaining: number
  averagePreTestScore: number | null
  normalizedGain: number | null
}
