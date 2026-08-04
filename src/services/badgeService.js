/**
 * badgeService.js
 * Client service for fetching user gamification badges.
 */
import { httpsCallable } from 'firebase/functions'
import { doc, getDoc } from 'firebase/firestore'
import { functions, db } from './firebase'
import { friendlyCallableError } from './callableErrors'

/**
 * Fetches user badges using Cloud Function evaluator, falling back to direct Firestore read.
 * @returns {Promise<Array<{id: string, title: string, description: string, category: string, unlockedAt: string}>>}
 */
export async function getUserBadges(userId) {
  try {
    const call = httpsCallable(functions, 'getUserBadges')
    const { data } = await call({})
    return data?.badges || []
  } catch (err) {
    if (userId) {
      try {
        const snap = await getDoc(doc(db, 'userBadges', userId))
        if (snap.exists()) {
          return snap.data()?.badges || []
        }
      } catch (fallbackErr) {
        console.warn('Fallback badge read failed:', fallbackErr)
      }
    }
    return []
  }
}
