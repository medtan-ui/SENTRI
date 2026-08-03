/**
 * modules/badges/controllers.ts
 * Cloud Functions controller for retrieving user badges.
 */
import { onCall } from 'firebase-functions/v2/https'
import { enforceAuth, withCallable } from '../../shared/callable'
import { evaluateAndAwardBadges, getUserBadgesDoc } from './badges'

export const getUserBadges = onCall(
  withCallable(async (request) => {
    const auth = enforceAuth(request)
    const badges = await evaluateAndAwardBadges(auth.uid)
    return { badges }
  }),
)
