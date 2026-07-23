export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type ModuleStatus = 'Enabled' | 'Disabled'

export interface CreateModuleConfigurationInput {
  moduleId: string
  title: string
  description: string
  difficulty: Difficulty
  estimatedTime: string
  status: ModuleStatus
  prerequisite: string | null
  moduleOrder: number
  icon: string
  color: string
}

export interface LessonReference {
  title: string
  url: string
}

export interface LessonContent {
  moduleId?: string
  introduction?: string
  objectives?: string[]
  lessonContent?: string
  realWorldExample?: string
  bestPractices?: string[]
  keyTakeaways?: string[]
  references?: LessonReference[]
}

export interface UpdateLessonContentInput {
  moduleId: string
  patch: LessonContent
}

export interface ScenarioVideo {
  videoUrl: string
  videoAvailable: boolean
  thumbnail?: string
  duration: number
}

export interface ScenarioChoice {
  id: string
  text: string
  isSafe: boolean
  feedbackTitle: string
  feedbackText: string
  consequenceVideo?: ScenarioVideo
}

export interface ScenarioItem {
  id: string
  title: string
  order: number
  simulatedUrl?: string
  video: ScenarioVideo
  pauseTimestamp: number
  choices: ScenarioChoice[]
}

export interface ScenarioConfig {
  id: string
  title: string
  surface: 'browser' | 'phone'
  scenarios: ScenarioItem[]
}

export interface UpdateScenarioConfigurationInput {
  moduleId: string
  scenarioConfig: ScenarioConfig
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
  difficulty: Difficulty
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

export interface UpdateQuizConfigurationInput {
  moduleId: string
  quizConfig: QuizConfig
}

export type AssignmentType = 'all' | 'students'

export interface UpdateAssignmentsInput {
  moduleId: string
  assignmentType: AssignmentType
  assignedStudentIds?: string[]
}

export interface ValidationIssue {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}
