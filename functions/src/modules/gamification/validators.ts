import { z } from 'zod'

export const getLeaderboardSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
})

export const getGamificationSchema = z.object({
  /** Admin-only when it isn't the caller's own uid (see resolveTargetUid). */
  userId: z.string().min(1).optional(),
})
