/**
 * gamificationService.js
 * The client half of the reward layer: points, rank, badges, streak, and
 * the leaderboard.
 *
 * Every function here is a Cloud Function call, never a Firestore write.
 * Points are derived server-side from a student's own moduleProgress
 * documents (see functions/src/modules/gamification), so nothing on this
 * side ever computes or sends a score, and the `gamification` collection
 * is read-only to every client by rule.
 *
 * The leaderboard is a callable too, not a collection query. Showing five
 * classmates' names and scores does not require handing the client read
 * access to every student's record, and the callable returns only the
 * columns a board actually displays.
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { friendlyCallableError } from './callableErrors'

/**
 * The signed-in student's reward state plus the full badge catalog, so
 * the UI can show locked badges and what earns them rather than hiding
 * everything not yet unlocked.
 *
 * @returns {Promise<{ gamification: object, catalog: { badges: object[], total: number } }>}
 */
export async function getMyGamification() {
  try {
    const call = httpsCallable(functions, 'getMyGamification')
    const { data } = await call({})
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}

/**
 * Marks today as active, which is what keeps a streak alive on a day the
 * student reads without finishing anything. Idempotent within a day, so
 * calling it on every dashboard mount is safe.
 *
 * Fails soft on purpose: a streak ping that doesn't land is not worth an
 * error banner on a dashboard that is otherwise fine.
 *
 * @returns {Promise<object|null>} the refreshed state, or null if the call failed
 */
export async function recordDailyVisit() {
  try {
    const call = httpsCallable(functions, 'recordDailyVisit')
    const { data } = await call({})
    return data?.gamification ?? null
  } catch (err) {
    console.error('[gamificationService] recordDailyVisit failed — continuing:', err)
    return null
  }
}

/**
 * @param {{ scope?: 'all'|'section', limit?: number }} [options]
 * @returns {Promise<{ scope: string, section: string|null, entries: object[], you: object|null, totalRanked: number }>}
 */
export async function getLeaderboard(options = {}) {
  try {
    const call = httpsCallable(functions, 'getLeaderboard')
    const { data } = await call(options)
    return data
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}
