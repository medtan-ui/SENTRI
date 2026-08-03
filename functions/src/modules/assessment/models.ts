import { AssessmentType } from '../../shared/constants'

/**
 * modules/assessment/models.ts
 * The pre-test / post-test pair. Both run on the same item bank
 * (modulePretests/{moduleId}) so a normalized gain is computed from
 * identical questions, which is the only way the "awareness improvement"
 * objective can be reported honestly.
 */

/** Only the two ungraded bookend assessments run through this module —
 * the graded quiz has its own callable (modules/quiz). */
export type BookendAssessmentType = Extract<AssessmentType, 'pretest' | 'posttest'>

export interface SubmitAssessmentInput {
  moduleId: string
  assessmentType: BookendAssessmentType
  /** questionId -> choiceId */
  answers: Record<string, string>
  /** questionId -> milliseconds spent on that question. Optional: a
   * client that can't measure it simply omits it, and the item's
   * durationMs is stored as null rather than a fabricated zero. */
  durations?: Record<string, number>
}

export interface AssessmentChoice {
  id: string
  text: string
}

export interface AssessmentQuestion {
  id: string
  text: string
  choices: AssessmentChoice[]
  correctChoiceId: string
  explanation: string
  /** Topic slug — what makes per-topic mastery and transfer computable. */
  topic?: string
}

export interface AssessmentConfig {
  moduleId: string
  title: string
  questions: AssessmentQuestion[]
}

export interface AssessmentItemResult {
  questionId: string
  topic: string | null
  correct: boolean
  selectedChoiceId: string | null
  correctChoiceId: string
  explanation: string
  durationMs: number | null
}

export interface SubmitAssessmentResult {
  assessmentType: BookendAssessmentType
  score: number
  correctCount: number
  total: number
  perQuestionResults: AssessmentItemResult[]
  /** Present only on a post-test, and only once a pre-test score exists.
   * Hake's normalized gain: (post - pre) / (100 - pre), clamped to
   * [-1, 1]. Null when pre is 100 (no headroom, undefined gain). */
  normalizedGain: number | null
  preTestScore: number | null
}

/**
 * One document per answered question, in the `quiz_responses` collection.
 * Written for all three assessment types so item difficulty and
 * discrimination can be computed over any of them.
 */
export interface QuizResponseDoc {
  userId: string
  moduleId: string
  assessmentType: AssessmentType
  attemptId: string
  questionId: string
  topic: string | null
  selectedChoiceId: string | null
  correctChoiceId: string
  isCorrect: boolean
  /** Milliseconds on this question, or null when the client didn't
   * report one. Null is deliberate: an unmeasured item must not be
   * averaged in as a zero. */
  durationMs: number | null
  answeredAt: FirebaseFirestore.FieldValue
}
