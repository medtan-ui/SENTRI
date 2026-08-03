import { z } from 'zod'
import { MAX_SECTION_LENGTH } from '../../shared/sections'
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
 * Omitting `section` (or sending null) recomputes the whole cohort — the
 * report the dashboard opens on. Passing one scopes the same computation
 * to that class group. Length-bounded here so a section string can never
 * be long enough to produce an unusable Firestore document id.
 */
export const aggregateCohortAnalyticsSchema = z.object({
  section: z.string().trim().max(MAX_SECTION_LENGTH).nullable().optional(),
})
