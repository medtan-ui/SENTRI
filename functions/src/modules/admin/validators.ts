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

const lessonReferenceSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  link: z.string(),
})

const lessonSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Every lesson section needs a title.'),
  content: z.string().min(1, 'Every lesson section needs content.'),
})

export const updateLessonContentSchema = z.object({
  moduleId: z.string().min(1),
  patch: z
    .object({
      videoId: z.string().optional(),
      objectives: z.array(z.string()).optional(),
      // The ordered reading sections the student Lesson Viewer renders.
      // At least one, because a lesson with no sections leaves the viewer
      // indexing into an empty array.
      sections: z.array(lessonSectionSchema).min(1).optional(),
      bestPractices: z.array(z.string()).optional(),
      keyTakeaways: z.array(z.string()).optional(),
      references: z.array(lessonReferenceSchema).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: 'patch must include at least one field.' }),
})

const consequenceTypeSchema = z.enum([
  'credential_compromise',
  'account_takeover',
  'data_exposure',
  'device_compromise',
  'financial_loss',
  'physical_risk',
  'none',
])

const scenarioChoiceSchema = z.object({
  scenario_choice_id: z.string().min(1),
  target: z.string().min(1, 'Every choice must name the interactive target that resolves to it.'),
  choice_text: z.string(),
  is_safe_choice: z.boolean(),
  outcome_title: z.string(),
  consequence_type: consequenceTypeSchema,
  feedback_text: z.string(),
  feedback_media_url: z.string().nullable().optional(),
})

const scenarioItemSchema = z.object({
  scenario_id: z.string().min(1),
  scenario_order: z.number().int().positive(),
  scenario_title: z.string().min(1),
  scenario_description: z.string(),
  videoAvailable: z.boolean(),
  material_url: z.string().nullable().optional(),
  posterCaption: z.string(),
  // Names the bespoke React component that renders this scenario. A
  // scenario with no scene renders nothing at all.
  scene: z.string().min(1, 'Every scenario must name the scene component that renders it.'),
  coachTarget: z.string().optional(),
  postCompletionReflection: z.string().optional(),
  choices: z.array(scenarioChoiceSchema).min(2),
})

export const updateScenarioConfigurationSchema = z.object({
  moduleId: z.string().min(1),
  scenarioConfig: z.object({
    module_id: z.string().min(1),
    module_title: z.string().min(1),
    coachLevel: z.enum(['full', 'idle', 'none']),
    // No fixed count: how many scenarios a module has is decided by how
    // many scene components were authored for it, not by a rule here.
    scenarios: z.array(scenarioItemSchema).min(1),
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

  // At least one safe choice, not exactly one — mirrors the client rule
  // in src/features/admin/scenario-config/hooks/validateScenarioConfig.js.
  // A scene may legitimately offer several acceptable endings with
  // different feedback (Password Security's sign-up scenario treats
  // "three unique strong passwords" and "three unique but weak
  // passwords" as two distinct safe outcomes). Zero is the real defect:
  // the engine only advances on a safe choice, so the scenario would be
  // unwinnable.
  const safeCount = scenario.choices.filter((c) => c.is_safe_choice).length
  if (safeCount === 0) {
    issues.push({
      field: 'safeChoice',
      message: 'No safe choice exists — students could never complete this scenario.',
    })
  }

  if (!scenario.scenario_title || !scenario.scenario_title.trim()) {
    issues.push({ field: 'scenario_title', message: 'Scenario title is empty.' })
  }
  if (!scenario.scenario_description || !scenario.scenario_description.trim()) {
    issues.push({ field: 'scenario_description', message: 'Scenario description is empty.' })
  }
  if (!scenario.posterCaption || !scenario.posterCaption.trim()) {
    issues.push({
      field: 'posterCaption',
      message: 'Poster caption is empty — students see it while the scene loads.',
    })
  }

  const targets = new Set<string>()
  scenario.choices.forEach((choice, index) => {
    const label = `Choice ${index + 1}`
    const id = choice.scenario_choice_id
    if (!choice.choice_text || !choice.choice_text.trim()) {
      issues.push({ field: `choice-${id}-choice_text`, message: `${label}: choice description is empty.` })
    }
    if (!choice.outcome_title || !choice.outcome_title.trim()) {
      issues.push({ field: `choice-${id}-outcome_title`, message: `${label}: outcome title is empty.` })
    }
    if (!choice.feedback_text || !choice.feedback_text.trim()) {
      issues.push({ field: `choice-${id}-feedback_text`, message: `${label}: feedback text is empty.` })
    }
    // Two choices bound to the same interactive element means one of them
    // is unreachable — the scene can only resolve a target to one choice.
    if (targets.has(choice.target)) {
      issues.push({
        field: `choice-${id}-target`,
        message: `${label}: target "${choice.target}" is already used by another choice in this scenario.`,
      })
    }
    targets.add(choice.target)
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
