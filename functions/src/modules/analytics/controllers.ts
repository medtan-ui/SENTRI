import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { requireAdmin, requireAuth, resolveTargetUid } from '../../shared/authGuards'
import { COLLECTIONS } from '../../shared/constants'
import { logError, logInfo } from '../../shared/logger'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as repo from './repository'
import * as service from './service'
import {
  aggregateCohortAnalyticsSchema,
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
 * aggregateCohortAnalytics — the class-level rollup. Admin-only: it reads
 * across every student's progress and responses, so it is not something a
 * student may trigger or see. With a `section`, the same rollup is scoped
 * to one class group and written to that section's own document.
 */
export const aggregateCohortAnalytics = defineCallable('aggregateCohortAnalytics', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(aggregateCohortAnalyticsSchema, request.data ?? {})
  return service.aggregateCohortAnalytics(input.section ?? null)
})

/**
 * listSections — the class groups currently in use, with student counts.
 * Admin-only, and read from the account roster rather than a separate
 * collection, so the picker can never offer a section nobody is in.
 */
export const listSections = defineCallable('listSections', async (request) => {
  await requireAdmin(request)
  const sections = await repo.listSections()
  return { sections }
})

/**
 * scheduledAnalyticsAggregation — the nightly recompute.
 *
 * Every aggregate in this backend used to exist only after somebody
 * clicked Refresh, which meant the dashboard's honest state on any given
 * morning was "as of whenever an admin last visited". This runs the exact
 * same work `Refresh All` does — six modules, the whole-cohort rollup, and
 * one rollup per section in use — so opening the page shows numbers that
 * are at most a day old without anyone having to remember.
 *
 * On-demand refresh is deliberately kept: a schedule is the floor, not a
 * replacement for wanting the current figure right now (during a defense,
 * say, immediately after a class finishes a module).
 *
 * 02:00 Manila, chosen because it is outside any plausible class session,
 * so a full-collection read never competes with students using the app.
 * A failure is logged and swallowed — the next night's run recomputes
 * everything from the raw collections anyway, so there is nothing a retry
 * storm could repair that waiting does not.
 */
export const scheduledAnalyticsAggregation = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'Asia/Manila',
    // The whole point is that this is the slow, complete pass; the
    // default 60s would time out once a real cohort's worth of responses
    // exists.
    timeoutSeconds: 540,
    retryCount: 0,
  },
  async () => {
    const startedAt = Date.now()
    try {
      const result = await service.aggregateAllAnalytics()
      logInfo('[scheduledAnalyticsAggregation] completed', {
        function: 'scheduledAnalyticsAggregation',
        durationMs: Date.now() - startedAt,
        outcome: result.failures.length > 0 ? 'partial' : 'success',
        modulesAggregated: result.modules,
        sectionsAggregated: result.sections,
        failures: result.failures,
      })
    } catch (err) {
      logError('[scheduledAnalyticsAggregation] failed', {
        function: 'scheduledAnalyticsAggregation',
        durationMs: Date.now() - startedAt,
        outcome: 'error',
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      })
    }
  },
)

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
