/**
 * modules/admin/validators.ts
 * zod schemas validate shape/types on the way in. The business-rule
 * checks below (validateScenarioItem/validateScenarioConfig,
 * validateQuizQuestionItem/validateQuizConfig) are a server-side
 * reimplementation of src/features/admin/scenario-config/hooks/
 * validateScenarioConfig.js and .../quiz-config/hooks/validateQuizQuestion.js
 * — the same rules the admin UI already enforces client-side, now also
 * enforced authoritatively before anything is persisted.
 */
import { z } from 'zod'
import { QuizConfig, QuizQuestion, ScenarioConfig, ScenarioItem, ValidationIssue, ValidationResult } from './models'

const difficultySchema = z.enum(['Easy', 'Medium', 'Hard'])
const moduleStatusSchema = z.enum(['Enabled', 'Disabled'])

export const createModuleConfigurationSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(1, 'title is required.'),
  description: z.string().trim().min(1, 'description is required.'),
  difficulty: difficultySchema,
  estimatedTime: z.string().trim().min(1, 'estimatedTime is required.'),
  status: moduleStatusSchema,
  prerequisite: z.string().min(1).nullable(),
  moduleOrder: z.number().int().min(1).max(6),
  icon: z.string().min(1),
  color: z.string().min(1),
})

const lessonReferenceSchema = z.object({ title: z.string(), url: z.string() })

export const updateLessonContentSchema = z.object({
  moduleId: z.string().min(1),
  patch: z
    .object({
      introduction: z.string().optional(),
      objectives: z.array(z.string()).optional(),
      lessonContent: z.string().optional(),
      realWorldExample: z.string().optional(),
      bestPractices: z.array(z.string()).optional(),
      keyTakeaways: z.array(z.string()).optional(),
      references: z.array(lessonReferenceSchema).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: 'patch must include at least one field.' }),
})

const scenarioVideoSchema = z.object({
  videoUrl: z.string(),
  videoAvailable: z.boolean(),
  thumbnail: z.string().optional(),
  duration: z.number().positive(),
})

const scenarioChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  isSafe: z.boolean(),
  feedbackTitle: z.string(),
  feedbackText: z.string(),
  consequenceVideo: scenarioVideoSchema.optional(),
})

const scenarioItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().positive(),
  simulatedUrl: z.string().optional(),
  video: scenarioVideoSchema,
  pauseTimestamp: z.number(),
  choices: z.array(scenarioChoiceSchema).min(2).max(3),
})

export const updateScenarioConfigurationSchema = z.object({
  moduleId: z.string().min(1),
  scenarioConfig: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    surface: z.enum(['browser', 'phone']),
    scenarios: z.array(scenarioItemSchema).length(3, 'A module always has exactly 3 scenarios.'),
  }),
})

const quizChoiceSchema = z.object({ id: z.string().min(1), text: z.string() })

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  text: z.string(),
  choices: z.array(quizChoiceSchema).length(4, 'Every question has exactly 4 choices.'),
  correctChoiceId: z.string().min(1),
  explanation: z.string(),
  difficulty: difficultySchema,
})

export const updateQuizConfigurationSchema = z.object({
  moduleId: z.string().min(1),
  quizConfig: z.object({
    moduleId: z.string().min(1),
    title: z.string().min(1),
    settings: z.object({
      passingScore: z.number().min(0).max(100),
      timeLimitMinutes: z.number().positive(),
      instructions: z.string(),
      available: z.boolean(),
    }),
    questions: z.array(quizQuestionSchema).min(1),
  }),
})

export const updateAssignmentsSchema = z
  .object({
    moduleId: z.string().min(1),
    assignmentType: z.enum(['all', 'students']),
    assignedStudentIds: z.array(z.string()).optional(),
  })
  .refine((data) => data.assignmentType !== 'students' || (data.assignedStudentIds?.length ?? 0) > 0, {
    message: 'assignedStudentIds must be non-empty when assignmentType is "students".',
  })

export const validateModuleConfigurationSchema = z.object({ moduleId: z.string().min(1) })

// ── Business-rule validators (server-side source of truth) ─────────────

export function validateScenarioItem(scenario: ScenarioItem): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  const safeCount = scenario.choices.filter((c) => c.isSafe).length
  if (safeCount === 0) {
    issues.push({ field: 'safeChoice', message: 'No safe choice exists — exactly one choice must be marked Safe.' })
  } else if (safeCount > 1) {
    issues.push({
      field: 'safeChoice',
      message: `Multiple safe choices exist (${safeCount}) — only one choice may be marked Safe.`,
    })
  }

  const duration = scenario.video?.duration
  const pause = scenario.pauseTimestamp
  const pauseNumber = Number(pause)
  const pauseInvalid =
    pause === null ||
    pause === undefined ||
    Number.isNaN(pauseNumber) ||
    pauseNumber <= 0 ||
    (typeof duration === 'number' && pauseNumber >= duration)
  if (pauseInvalid) {
    issues.push({
      field: 'pauseTimestamp',
      message:
        typeof duration === 'number'
          ? `Pause timestamp must be a number between 1 and ${duration - 1} seconds.`
          : 'Pause timestamp must be a positive number.',
    })
  }

  scenario.choices.forEach((choice, index) => {
    const label = `Choice ${index + 1}`
    if (!choice.text || !choice.text.trim()) {
      issues.push({ field: `choice-${choice.id}-text`, message: `${label}: choice text is empty.` })
    }
    if (!choice.feedbackTitle || !choice.feedbackTitle.trim()) {
      issues.push({ field: `choice-${choice.id}-feedbackTitle`, message: `${label}: feedback title is empty.` })
    }
    if (!choice.feedbackText || !choice.feedbackText.trim()) {
      issues.push({ field: `choice-${choice.id}-feedbackText`, message: `${label}: feedback text is empty.` })
    }
  })

  return issues
}

export function validateScenarioConfig(config: ScenarioConfig): ValidationResult {
  const issues = config.scenarios.flatMap(validateScenarioItem)
  return { valid: issues.length === 0, issues }
}

export function validateQuizQuestionItem(question: QuizQuestion): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!question.text || !question.text.trim()) {
    issues.push({ field: 'text', message: 'Question text is empty.' })
  }

  const filledChoices = question.choices.filter((c) => c.text && c.text.trim())
  if (filledChoices.length < 2) {
    issues.push({ field: 'choices', message: 'Less than two choices exist — at least two choices need text.' })
  }

  const correctChoice = question.choices.find((c) => c.id === question.correctChoiceId)
  if (!correctChoice || !correctChoice.text || !correctChoice.text.trim()) {
    issues.push({ field: 'correctChoiceId', message: 'No correct answer selected.' })
  }

  const seen = new Set<string>()
  let hasDuplicate = false
  filledChoices.forEach((c) => {
    const normalized = c.text.trim().toLowerCase()
    if (seen.has(normalized)) hasDuplicate = true
    seen.add(normalized)
  })
  if (hasDuplicate) {
    issues.push({ field: 'choices', message: 'Duplicate choices exist — each choice must be unique.' })
  }

  if (!question.explanation || !question.explanation.trim()) {
    issues.push({ field: 'explanation', message: 'Explanation is empty.' })
  }

  return issues
}

export function validateQuizConfig(config: QuizConfig): ValidationResult {
  const issues = config.questions.flatMap(validateQuizQuestionItem)
  return { valid: issues.length === 0, issues }
}
