export interface SubmitQuizInput {
  moduleId: string
  answers: Record<string, string>
  /** questionId -> milliseconds spent on that question. Optional; a
   * missing entry is stored as null, never as a fabricated 0. */
  durations?: Record<string, number>
}

export interface QuizChoice {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  order: number
  text: string
  choices: QuizChoice[]
  correctChoiceId: string
  explanation: string
  difficulty: string
  /** Topic slug, shared with the pre/post item bank. Optional so a quiz
   * document authored before topic tagging still grades normally — it
   * just doesn't contribute to per-topic analysis. */
  topic?: string
}

export interface QuizSettings {
  passingScore: number
  timeLimitMinutes: number
  instructions: string
  available: boolean
}

export interface QuizConfig {
  moduleId: string
  title: string
  settings: QuizSettings
  questions: QuizQuestion[]
}

export interface PerQuestionResult {
  questionId: string
  correct: boolean
  selectedChoiceId: string | null
  correctChoiceId: string
  explanation: string
  topic: string | null
  durationMs: number | null
}

export interface SubmitQuizResult {
  score: number
  correctCount: number
  total: number
  passed: boolean
  passingScore: number
  moduleCompleted: boolean
  perQuestionResults: PerQuestionResult[]
  attemptNumber: number
  attemptsAllowed: number
  attemptsRemaining: number
}
