import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { requireAuth, resolveTargetUid } from '../../shared/authGuards'
import { COLLECTIONS } from '../../shared/constants'
import { logError, logInfo } from '../../shared/logger'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import { ModuleProgressDoc } from '../progress/models'
import * as service from './service'
import { getGamificationSchema, getLeaderboardSchema } from './validators'

/**
 * getMyGamification — points, rank, badges and streak for the caller
 * (or, for an admin, for a named student). Self-heals a missing document
 * from existing progress, so accounts created before this feature shipped
 * see a real score the first time they open the page rather than a zero
 * that fills in later.
 */
export const getMyGamification = defineCallable('getMyGamification', async (request) => {
  const input = parseOrThrow(getGamificationSchema, request.data ?? {})
  const userId = await resolveTargetUid(request, input.userId)
  const [state, catalog] = await Promise.all([service.getMine(userId), service.getBadgeCatalog()])
  return { gamification: state, catalog }
})

/**
 * recordDailyVisit — "I showed up today." The one write a student's own
 * page load is allowed to cause, and the only thing that advances a
 * streak on a day with no completed step. Idempotent within a day.
 */
export const recordDailyVisit = defineCallable('recordDailyVisit', async (request) => {
  const { uid } = requireAuth(request)
  const state = await service.recordDailyVisit(uid)
  return { gamification: state }
})

/**
 * getLeaderboard — a callable rather than an open collection read.
 * Students never get blanket read access to each other's records; this
 * returns exactly the columns a board needs (name, points, rank, streak,
 * badge count) and nothing else about anyone.
 */
export const getLeaderboard = defineCallable('getLeaderboard', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(getLeaderboardSchema, request.data ?? {})
  return service.getLeaderboard(uid, input)
})

/**
 * Fields whose change means a student actually got somewhere. Every
 * progress write also bumps `lastAccessed`, so without this check simply
 * opening a lesson would trigger a full recompute; with it, a recompute
 * only follows a step that was genuinely finished.
 */
const REWARDABLE_FIELDS: Array<keyof ModuleProgressDoc> = [
  'lessonCompleted',
  'simulationCompleted',
  'quizCompleted',
  'moduleCompleted',
  'preTestCompleted',
  'score',
]

function rewardableChange(
  before: Partial<ModuleProgressDoc> | undefined,
  after: Partial<ModuleProgressDoc> | undefined,
): boolean {
  if (!after) return false
  if (!before) return true
  return REWARDABLE_FIELDS.some((field) => before[field] !== after[field])
}

/**
 * updateGamificationOnProgress — the trigger that keeps points current.
 *
 * A trigger, not a call from each place progress is written, because
 * progress is written from two directions in this app: the student client
 * writes lesson and simulation milestones straight to Firestore, while
 * quiz and assessment results are written server-side by their own
 * callables. One trigger covers both without touching either, which is
 * also why adding rewards did not require editing a single line of the
 * code that already worked.
 *
 * Failures are logged and swallowed. Points are a reward layer; a
 * student's actual progress has already committed by the time this runs,
 * and losing a recompute costs nothing permanent since the next one
 * rebuilds the whole score from scratch anyway.
 */
export const updateGamificationOnProgress = onDocumentWritten(
  `${COLLECTIONS.MODULE_PROGRESS}/{progressId}`,
  async (event) => {
    const before = event.data?.before?.data() as Partial<ModuleProgressDoc> | undefined
    const after = event.data?.after?.data() as Partial<ModuleProgressDoc> | undefined
    const userId = after?.userId ?? before?.userId
    if (!userId || !rewardableChange(before, after)) return

    const startedAt = Date.now()
    try {
      const state = await service.recomputeFromProgress(userId, true)
      logInfo('[updateGamificationOnProgress] succeeded', {
        function: 'updateGamificationOnProgress',
        uid: userId,
        moduleId: after?.moduleId ?? null,
        durationMs: Date.now() - startedAt,
        outcome: 'success',
        points: state.points,
        level: state.level,
        badges: state.badges.length,
      })
    } catch (err) {
      logError('[updateGamificationOnProgress] failed', {
        function: 'updateGamificationOnProgress',
        uid: userId,
        moduleId: after?.moduleId ?? null,
        durationMs: Date.now() - startedAt,
        outcome: 'error',
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      })
    }
  },
)

/**
 * updateGamificationOnFinalAssessment — the final assessment lives in its
 * own collection rather than on any module's progress row, so the trigger
 * above never sees it. Without this, the points and the "Show Your Work"
 * badge for finishing the whole curriculum would not appear until the
 * student's next completed module step — which, after the final
 * assessment, is never.
 */
export const updateGamificationOnFinalAssessment = onDocumentWritten(
  `${COLLECTIONS.FINAL_ASSESSMENT_PROGRESS}/{userId}`,
  async (event) => {
    const userId = event.params.userId
    const after = event.data?.after?.data() as { completed?: boolean } | undefined
    if (!userId || !after?.completed) return

    const startedAt = Date.now()
    try {
      const state = await service.recomputeFromProgress(userId, true)
      logInfo('[updateGamificationOnFinalAssessment] succeeded', {
        function: 'updateGamificationOnFinalAssessment',
        uid: userId,
        durationMs: Date.now() - startedAt,
        outcome: 'success',
        points: state.points,
        level: state.level,
        badges: state.badges.length,
      })
    } catch (err) {
      logError('[updateGamificationOnFinalAssessment] failed', {
        function: 'updateGamificationOnFinalAssessment',
        uid: userId,
        durationMs: Date.now() - startedAt,
        outcome: 'error',
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      })
    }
  },
)

/**
 * updateGamificationOnBehaviour — the second trigger, for the one badge
 * whose evidence does not live on a progress document.
 *
 * "First Defender" needs to know a scenario was cleared with no risky
 * choice, and only `learningAnalytics` records that. Those counters are
 * written by their own trigger off scenarioDecisionRecords, so the
 * progress trigger above can fire before the last decision has been
 * counted — the badge would then not appear until the student's next
 * completed step, which on the final module could be never.
 *
 * The `riskyChoices === 0` guard is what keeps this cheap. A run that
 * has already gone wrong can never earn the badge, so there is nothing
 * to recompute for it; only a still-clean run is worth re-evaluating,
 * and that is both the shorter path and the rarer one. Badges are
 * union-only, so a later risky choice cannot revoke one already earned
 * and therefore never needs a recompute of its own.
 */
export const updateGamificationOnBehaviour = onDocumentWritten(
  `${COLLECTIONS.LEARNING_ANALYTICS}/{behaviourId}`,
  async (event) => {
    const after = event.data?.after?.data()
    if (!after) return

    const userId = typeof after.userId === 'string' ? after.userId : null
    const riskyChoices = Number(after.riskyChoices ?? 0)
    if (!userId || riskyChoices > 0) return

    const startedAt = Date.now()
    try {
      // No streak touch here: a decision inside a scenario is already
      // covered by the progress write that follows it, and counting the
      // same session twice would be harmless but misleading in the logs.
      const state = await service.recomputeFromProgress(userId, false)
      logInfo('[updateGamificationOnBehaviour] succeeded', {
        function: 'updateGamificationOnBehaviour',
        uid: userId,
        moduleId: typeof after.moduleId === 'string' ? after.moduleId : null,
        durationMs: Date.now() - startedAt,
        outcome: 'success',
        badges: state.badges.length,
      })
    } catch (err) {
      logError('[updateGamificationOnBehaviour] failed', {
        function: 'updateGamificationOnBehaviour',
        uid: userId,
        durationMs: Date.now() - startedAt,
        outcome: 'error',
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      })
    }
  },
)
