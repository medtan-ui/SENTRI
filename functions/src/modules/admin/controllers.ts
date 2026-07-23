import { requireAdmin } from '../../shared/authGuards'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as service from './service'
import {
  createModuleConfigurationSchema,
  updateAssignmentsSchema,
  updateLessonContentSchema,
  updateQuizConfigurationSchema,
  updateScenarioConfigurationSchema,
  validateModuleConfigurationSchema,
} from './validators'

export const createModuleConfiguration = defineCallable('createModuleConfiguration', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(createModuleConfigurationSchema, request.data)
  return service.createModuleConfiguration(input)
})

export const updateLessonContent = defineCallable('updateLessonContent', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(updateLessonContentSchema, request.data)
  return service.updateLessonContent(input)
})

export const updateScenarioConfiguration = defineCallable('updateScenarioConfiguration', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(updateScenarioConfigurationSchema, request.data)
  return service.updateScenarioConfiguration(input)
})

export const updateQuizConfiguration = defineCallable('updateQuizConfiguration', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(updateQuizConfigurationSchema, request.data)
  return service.updateQuizConfiguration(input)
})

export const updateAssignments = defineCallable('updateAssignments', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(updateAssignmentsSchema, request.data)
  return service.updateAssignments(input)
})

export const validateModuleConfiguration = defineCallable('validateModuleConfiguration', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(validateModuleConfigurationSchema, request.data)
  return service.validateModuleConfiguration(input.moduleId)
})
