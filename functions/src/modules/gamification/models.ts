import { GamificationTotals } from './catalog'

/**
 * One document per student at `gamification/{userId}`.
 *
 * Everything except the streak block is derived (see
 * service.recomputeFromProgress) — `points`, `level` and `totals` are
 * stored rather than computed on read purely so the leaderboard can be a
 * single ordered query instead of a fan-out over every student's six
 * progress documents.
 *
 * The streak *is* state: it depends on when the student showed up, which
 * no progress document records.
 */
export interface GamificationDoc {
  userId: string
  /** Denormalized from users/{uid} so the leaderboard needs one read, not two. */
  displayName: string

  points: number
  level: number
  rankName: string
  /** Where the current rank started, and what the next one costs. Stored
   * rather than left for the client to look up, so the rank ladder exists
   * in exactly one place (catalog.ts) instead of being mirrored into the
   * frontend where the two copies could drift. `nextRankAt` is null at
   * the top rank. */
  rankFloor: number
  nextRankAt: number | null
  nextRankName: string | null

  /** Every badge ever earned. Union-only; a badge is never taken back. */
  badges: string[]
  /** Parallel record of when each badge landed, for "recently earned". */
  badgeLog: Array<{ id: string; earnedAt: FirebaseFirestore.Timestamp }>

  currentStreak: number
  longestStreak: number
  /** `YYYY-MM-DD` in Asia/Manila, the only timezone this app's days mean anything in. */
  lastActiveDate: string | null

  totals: GamificationTotals

  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
  updatedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  points: number
  level: number
  rankName: string
  currentStreak: number
  badgeCount: number
  rank: number
  isYou: boolean
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[]
  /** The caller's own standing, even when they placed outside the returned rows. */
  you: LeaderboardEntry | null
  totalRanked: number
}

export interface GetLeaderboardInput {
  limit?: number
}
