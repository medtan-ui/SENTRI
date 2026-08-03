import { requireAuth, requireAdmin, resolveTargetUid } from '../../shared/authGuards'
import { getModuleOrThrow } from '../../shared/moduleGuards'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as service from './service'
import {
  grantQuizRetrySchema,
  initializeStudentProgressSchema,
  moduleIdOnlySchema,
  resetModuleProgressSchema,
} from './validators'

export const initializeStudentProgress = defineCallable('initializeStudentProgress', async (request) => {
  const input = parseOrThrow(initializeStudentProgressSchema, request.data ?? {})
  const userId = await resolveTargetUid(request, input.targetUserId)
  const progress = await service.initializeStudentProgress(userId, input.moduleId)
  return { progress }
})

export const completeLesson = defineCallable('completeLesson', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(moduleIdOnlySchema, request.data)
  await service.completeLesson(uid, input.moduleId)
  return { success: true }
})

export const completeSimulation = defineCallable('completeSimulation', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(moduleIdOnlySchema, request.data)
  await service.completeSimulation(uid, input.moduleId)
  return { success: true }
})

export const completeModule = defineCallable('completeModule', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(moduleIdOnlySchema, request.data)
  await service.completeModuleForUser(uid, input.moduleId)
  return { success: true }
})

export const unlockNextModule = defineCallable('unlockNextModule', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(moduleIdOnlySchema, request.data)
  const moduleDoc = await getModuleOrThrow(input.moduleId)
  const result = await service.unlockNextModuleForUser(uid, moduleDoc.moduleOrder)
  return result
})

export const resetModuleProgress = defineCallable('resetModuleProgress', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(resetModuleProgressSchema, request.data)
  await service.resetModuleProgress(input.userId, input.moduleId)
  return { success: true }
})

/**
 * grantQuizRetry — the admin appeal path for a failed single-attempt
 * quiz. Admin-only, and the caller's uid is recorded on the progress doc
 * alongside their stated reason, so a granted retry is attributable.
 */
export const grantQuizRetry = defineCallable('grantQuizRetry', async (request) => {
  const admin = await requireAdmin(request)
  const input = parseOrThrow(grantQuizRetrySchema, request.data)
  return service.grantQuizRetry(admin.uid, input.userId, input.moduleId, input.reason)
})
