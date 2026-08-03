/**
 * modules/badges/controllers.ts
 * Cloud Functions controller for retrieving user badges.
 */
import { requireAuth } from '../../shared/authGuards'
import { defineCallable } from '../../shared/withCallable'
import { evaluateAndAwardBadges } from './badges'

export const getUserBadges = defineCallable('getUserBadges', async (request) => {
  const { uid } = requireAuth(request)
  const badges = await evaluateAndAwardBadges(uid)
  return { badges }
})
