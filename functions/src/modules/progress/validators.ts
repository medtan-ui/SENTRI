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
