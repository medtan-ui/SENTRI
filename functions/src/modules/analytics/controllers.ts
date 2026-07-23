import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { requireAdmin, requireAuth, resolveTargetUid } from '../../shared/authGuards'
import { COLLECTIONS } from '../../shared/constants'
import { logError, logInfo } from '../../shared/logger'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as service from './service'
import {
  aggregateModuleAnalyticsSchema,
  aggregateStudentAnalyticsSchema,
  recordAnalyticsEventSchema,
} from './validators'

export const recordAnalyticsEvent = defineCallable('recordAnalyticsEvent', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(recordAnalyticsEventSchema, request.data)
  return service.recordAnalyticsEvent(uid, input)
})

export const aggregateModuleAnalytics = defineCallable('aggregateModuleAnalytics', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(aggregateModuleAnalyticsSchema, request.data)
  return service.aggregateModuleAnalytics(input.moduleId)
})

export const aggregateStudentAnalytics = defineCallable('aggregateStudentAnalytics', async (request) => {
  const input = parseOrThrow(aggregateStudentAnalyticsSchema, request.data ?? {})
  const userId = await resolveTargetUid(request, input.userId)
  return service.aggregateStudentAnalytics(userId)
})

/**
 * updateLearningAnalytics — a Firestore trigger, not a callable. This is
 * exactly the "a Cloud Function is expected to trigger off writes to this
 * collection" TODO already left in
 * src/features/scenario/services/scenarioDecisionService.js: every new
 * scenario_decision_records doc increments the matching student+module's
 * safe/risky counters.
 */
export const updateLearningAnalytics = onDocumentCreated(
  `${COLLECTIONS.SCENARIO_DECISION_RECORDS}/{recordId}`,
  async (event) => {
    const data = event.data?.data()
    if (!data) return

    const userId = data.user_id as string | undefined
    const moduleId = data.module_id as string | undefined
    const isSafe = Boolean(data.is_safe_choice)
    if (!userId || !moduleId) return

    const startedAt = Date.now()
    try {
      await service.incrementLearningAnalytics(userId, moduleId, isSafe)
      logInfo('[updateLearningAnalytics] succeeded', {
        function: 'updateLearningAnalytics',
        uid: userId,
        moduleId,
        durationMs: Date.now() - startedAt,
        outcome: 'success',
      })
    } catch (err) {
      logError('[updateLearningAnalytics] failed', {
        function: 'updateLearningAnalytics',
        uid: userId,
        moduleId,
        durationMs: Date.now() - startedAt,
        outcome: 'error',
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      })
    }
  },
)
