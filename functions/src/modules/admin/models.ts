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
  id?: string
  title: string
  link: string
}

export interface LessonSection {
  id: string
  title: string
  content: string
}

/**
 * The published lesson document — the exact shape the student Lesson
 * Viewer renders (see src/services/lessonService.js). This used to model
 * a single `lessonContent` blob plus introduction/realWorldExample, which
 * nothing read; the collection now stores the student's own model, so
 * these types describe what is actually persisted.
 */
export interface LessonContent {
  moduleId?: string
  videoId?: string
  objectives?: string[]
  sections?: LessonSection[]
  bestPractices?: string[]
  keyTakeaways?: string[]
  references?: LessonReference[]
}

export interface UpdateLessonContentInput {
  moduleId: string
  patch: LessonContent
}

/**
 * The Scenario Engine's own configuration — the exact objects
 * src/features/scenario/engine/ consumes, under the exact field names the
 * stored documents use. Inventing a second vocabulary for the same data
 * is what let the old admin model drift away from reality in the first
 * place.
 */
export interface ScenarioChoice {
  scenarioChoiceId: string
  target: string
  choiceText: string
  isSafeChoice: boolean
  outcomeTitle: string
  consequenceType: string
  feedbackText: string
  feedbackMediaUrl?: string | null
}

export interface ScenarioItem {
  scenarioId: string
  scenarioOrder: number
  scenarioTitle: string
  scenarioDescription: string
  videoAvailable: boolean
  materialUrl?: string | null
  posterCaption: string
  scene: string
  coachTarget?: string
  postCompletionReflection?: string
  choices: ScenarioChoice[]
}

export interface ScenarioConfig {
  moduleId: string
  moduleTitle: string
  coachLevel: 'full' | 'idle' | 'none'
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
  /** Topic slug shared with the pre/post item bank. Optional so a quiz
   * authored before topic tagging still validates and grades normally. */
  topic?: string
}

export interface QuizSettings {
  passingScore: number
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
