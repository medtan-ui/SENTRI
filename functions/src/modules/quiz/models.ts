export interface SubmitQuizInput {
  moduleId: string
  answers: Record<string, string>
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
}

export interface SubmitQuizResult {
  score: number
  correctCount: number
  total: number
  passed: boolean
  passingScore: number
  moduleCompleted: boolean
  perQuestionResults: PerQuestionResult[]
}
