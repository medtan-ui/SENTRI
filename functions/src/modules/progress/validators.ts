import { z } from 'zod'

export const moduleIdOnlySchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
})

export const initializeStudentProgressSchema = z.object({
  moduleId: z.string().min(1).optional(),
  targetUserId: z.string().min(1).optional(),
})

export const resetModuleProgressSchema = z.object({
  userId: z.string().min(1, 'userId is required.'),
  moduleId: z.string().min(1, 'moduleId is required.'),
})

export const grantQuizRetrySchema = z.object({
  userId: z.string().min(1, 'userId is required.'),
  moduleId: z.string().min(1, 'moduleId is required.'),
  // Required, not optional: an appeal that isn't justified in writing
  // isn't auditable, and this is the one path around the one-attempt rule.
  reason: z.string().trim().min(5, 'Give a short reason for granting this retry.').max(500),
})
