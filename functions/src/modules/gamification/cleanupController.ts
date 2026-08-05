/**
 * modules/gamification/cleanupController.ts
 * ─────────────────────────────────────────────────────────────
 * TEMPORARY — delete this file, its export in functions/src/index.ts,
 * and scripts/purgeRewardOrphans.mjs once the purge has been run.
 *
 * Two one-off jobs against live data that the app itself has no reason
 * to be able to do:
 *
 *   1. `userBadges` — an entire retired collection. The second badge
 *      system that briefly ran alongside the reward layer is gone; its
 *      documents are unreachable (nothing reads them, the rules deny
 *      access) but still stored.
 *
 *   2. Orphaned `gamification` documents — one per student deleted
 *      before deleteStudentData learned to clean this collection up.
 *      These are the visible bug: the leaderboard is an ordered read of
 *      this collection, so a deleted student stayed on the board, and
 *      re-registering the same person produced a second row under the
 *      same name.
 *
 * "Orphan" is defined conservatively as: a gamification document whose
 * matching `users/{uid}` profile does not exist. That check is the same
 * one the leaderboard would need to make to hide the row, and it cannot
 * false-positive on a live student — every real account has a profile,
 * created before any progress can be recorded.
 *
 * Defaults to a dry run. It has to be asked, explicitly and in writing,
 * to delete anything.
 * ─────────────────────────────────────────────────────────────
 */
import { z } from 'zod'
import { requireAdmin } from '../../shared/authGuards'
import { db } from '../../shared/admin'
import { COLLECTIONS } from '../../shared/constants'
import { logInfo } from '../../shared/logger'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'

const purgeSchema = z.object({
  /** Nothing is deleted unless this is explicitly false. */
  dryRun: z.boolean().optional(),
})

interface OrphanReport {
  userId: string
  displayName: string
  points: number
}

export const purgeRewardOrphans = defineCallable('purgeRewardOrphans', async (request) => {
  const admin = await requireAdmin(request)
  const input = parseOrThrow(purgeSchema, request.data ?? {})
  const dryRun = input.dryRun !== false

  // ── 1. The retired collection, in full ──
  const badgeSnap = await db.collection('userBadges').get()
  const userBadgeIds = badgeSnap.docs.map((doc) => doc.id)

  // ── 2. Gamification documents with no surviving profile ──
  const gamificationSnap = await db.collection(COLLECTIONS.GAMIFICATION).get()
  const orphans: OrphanReport[] = []

  for (const doc of gamificationSnap.docs) {
    const profile = await db.collection(COLLECTIONS.USERS).doc(doc.id).get()
    if (profile.exists) continue
    const data = doc.data()
    orphans.push({
      userId: doc.id,
      displayName: String(data.displayName ?? '(unnamed)'),
      points: Number(data.points ?? 0),
    })
  }

  if (!dryRun) {
    await Promise.all([
      ...badgeSnap.docs.map((doc) => doc.ref.delete()),
      ...orphans.map((orphan) => db.collection(COLLECTIONS.GAMIFICATION).doc(orphan.userId).delete()),
    ])
  }

  logInfo('[purgeRewardOrphans] completed', {
    function: 'purgeRewardOrphans',
    uid: admin.uid,
    outcome: 'success',
    dryRun,
    userBadgesFound: userBadgeIds.length,
    orphansFound: orphans.length,
  })

  return {
    dryRun,
    userBadges: { found: userBadgeIds.length, ids: userBadgeIds, deleted: dryRun ? 0 : userBadgeIds.length },
    gamificationOrphans: { found: orphans.length, rows: orphans, deleted: dryRun ? 0 : orphans.length },
    gamificationTotal: gamificationSnap.size,
  }
})
