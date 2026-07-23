import { z } from 'zod'
import { ANALYTICS_EVENT_TYPES } from './models'

export const recordAnalyticsEventSchema = z.object({
  moduleId: z.string().min(1).optional(),
  eventType: z.enum(ANALYTICS_EVENT_TYPES),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export const aggregateModuleAnalyticsSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
})

export const aggregateStudentAnalyticsSchema = z.object({
  userId: z.string().min(1).optional(),
})
