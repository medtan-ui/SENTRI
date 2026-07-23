import { AppError } from '../../shared/errors'
import { assertRealModuleId } from '../../shared/moduleGuards'
import * as repo from './repository'
import {
  CreateModuleConfigurationInput,
  UpdateAssignmentsInput,
  UpdateLessonContentInput,
  UpdateQuizConfigurationInput,
  UpdateScenarioConfigurationInput,
  ValidationResult,
} from './models'
import { validateQuizConfig, validateScenarioConfig } from './validators'

export async function createModuleConfiguration(input: CreateModuleConfigurationInput) {
  assertRealModuleId(input.moduleId)
  if (input.prerequisite) {
    if (input.prerequisite === input.moduleId) {
      throw new AppError('invalid-argument', 'A module cannot be its own prerequisite.')
    }
    assertRealModuleId(input.prerequisite)
  }
  await repo.setModule(input.moduleId, input)
  return { moduleId: input.moduleId }
}

export async function updateLessonContent(input: UpdateLessonContentInput) {
  assertRealModuleId(input.moduleId)
  await repo.mergeLesson(input.moduleId, input.patch)
  return { moduleId: input.moduleId }
}

export async function updateScenarioConfiguration(input: UpdateScenarioConfigurationInput) {
  assertRealModuleId(input.moduleId)
  const validation = validateScenarioConfig(input.scenarioConfig)
  if (!validation.valid) {
    throw new AppError('invalid-argument', 'Scenario configuration failed validation.', { issues: validation.issues })
  }
  await repo.setScenarioConfig(input.moduleId, input.scenarioConfig)
  return { moduleId: input.moduleId }
}

export async function updateQuizConfiguration(input: UpdateQuizConfigurationInput) {
  assertRealModuleId(input.moduleId)
  const validation = validateQuizConfig(input.quizConfig)
  if (!validation.valid) {
    throw new AppError('invalid-argument', 'Quiz configuration failed validation.', { issues: validation.issues })
  }
  await repo.setQuizConfig(input.moduleId, input.quizConfig)
  return { moduleId: input.moduleId }
}

export async function updateAssignments(input: UpdateAssignmentsInput) {
  assertRealModuleId(input.moduleId)

  if (input.assignmentType === 'students' && input.assignedStudentIds && input.assignedStudentIds.length > 0) {
    const found = await repo.getUsersByIds(input.assignedStudentIds)
    const invalidIds = input.assignedStudentIds.filter((id) => found.get(id)?.role !== 'student')
    if (invalidIds.length > 0) {
      throw new AppError(
        'invalid-argument',
        'Some assigned student ids do not correspond to a real student account.',
        { invalidIds },
      )
    }
  }

  await repo.setAssignments(input.moduleId, input)
  return { moduleId: input.moduleId }
}

export async function validateModuleConfiguration(moduleId: string) {
  assertRealModuleId(moduleId)

  const [moduleDoc, lesson, scenario, quiz, assignments] = await Promise.all([
    repo.getModule(moduleId),
    repo.getLesson(moduleId),
    repo.getScenarioConfig(moduleId),
    repo.getQuizConfig(moduleId),
    repo.getAssignments(moduleId),
  ])

  const notConfigured = (field: string): ValidationResult => ({
    valid: false,
    issues: [{ field, message: `${field[0].toUpperCase()}${field.slice(1)} has not been configured yet.` }],
  })

  const sections = {
    module: moduleDoc ? ({ valid: true, issues: [] } as ValidationResult) : notConfigured('module'),
    lesson: lesson ? ({ valid: true, issues: [] } as ValidationResult) : notConfigured('lesson'),
    scenario: scenario ? validateScenarioConfig(scenario) : notConfigured('scenario'),
    quiz: quiz ? validateQuizConfig(quiz) : notConfigured('quiz'),
    assignments: assignments ? ({ valid: true, issues: [] } as ValidationResult) : notConfigured('assignments'),
  }

  const valid = Object.values(sections).every((section) => section.valid)
  return { moduleId, valid, sections }
}
