import { z } from 'zod'
import { ANALYTICS_EVENT_TYPES } from './models'

export const recordAnalyticsEventSchema = z.object({
  moduleId: z.string().min(1).optional(),
  eventType: z.enum(ANALYTICS_EVENT_TYPES),
  payload: z.record(z.string(), z.unknown()).optional(),
  // Capped at 8 hours: longer than any real activity, so a tab left open
  // overnight is rejected rather than skewing every time-on-task average.
  durationMs: z.number().min(0).max(28_800_000).optional(),
})

export const aggregateModuleAnalyticsSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
})

export const aggregateStudentAnalyticsSchema = z.object({
  userId: z.string().min(1).optional(),
})

/**
 * The cohort rollup covers every student and takes no arguments. Declared
 * as an empty object rather than skipped so an unexpected payload is
 * rejected at the edge like every other callable's.
 */
export const aggregateCohortAnalyticsSchema = z.object({})
