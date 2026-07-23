/**
 * shared/authGuards.ts
 * Every callable starts with requireAuth() (or requireAdmin() for the
 * admin-only ones). A caller's role is always looked up fresh from
 * users/{uid} — never trusted from a client-sent claim — same rule the
 * original functions/index.js already enforced for account management.
 */
import { CallableRequest } from 'firebase-functions/v2/https'
import { db } from './admin'
import { COLLECTIONS, ROLES } from './constants'
import { AppError } from './errors'

export interface CallerProfile {
  uid: string
  email: string | null
  role: string
}

export function requireAuth(request: CallableRequest<unknown>): { uid: string } {
  if (!request.auth) {
    throw new AppError('unauthenticated', 'You must be signed in.')
  }
  return { uid: request.auth.uid }
}

export async function requireAdmin(request: CallableRequest<unknown>): Promise<CallerProfile> {
  const { uid } = requireAuth(request)
  const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get()
  const data = snap.data()
  if (!snap.exists || data?.role !== ROLES.ADMIN) {
    throw new AppError('permission-denied', 'Only admins can perform this action.')
  }
  return { uid, email: data.email ?? request.auth?.token.email ?? null, role: data.role }
}

/**
 * Resolves which uid a self-service function should act on: the caller by
 * default, or another uid ONLY if the caller is an admin. Prevents a
 * student from ever passing someone else's uid to act on their behalf.
 */
export async function resolveTargetUid(
  request: CallableRequest<unknown>,
  targetUserId?: string | null,
): Promise<string> {
  const { uid } = requireAuth(request)
  if (!targetUserId || targetUserId === uid) return uid
  await requireAdmin(request)
  return targetUserId
}
