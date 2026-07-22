/**
 * adminService.js
 * ─────────────────────────────────────────────────────────────
 * Thin client wrapper around the admin-only account-management Cloud
 * Functions defined in functions/index.js (createUserAccount,
 * deleteUserAccount, resetUserPassword, listUsers).
 *
 * All authorization is enforced server-side inside those functions —
 * this file only shapes requests/responses and translates callable
 * error codes into user-friendly messages. A non-admin calling these
 * will be rejected by the function itself, not by anything here.
 * ─────────────────────────────────────────────────────────────
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { validatePassword } from '../utils/passwordPolicy'

function _friendlyCallableError(err) {
  switch (err?.code) {
    case 'functions/permission-denied':
      return 'You do not have permission to perform this action.'
    case 'functions/unauthenticated':
      return 'Your session has expired. Please sign in again.'
    case 'functions/already-exists':
      return 'An account with this email already exists.'
    case 'functions/not-found':
      return 'No account found for this user.'
    case 'functions/invalid-argument':
    case 'functions/failed-precondition':
      return err.message || 'Please check the information you entered.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

/**
 * Create a new student/admin account.
 * @param {{ email: string, password: string, displayName: string, role: 'student'|'admin' }} input
 * @returns {Promise<{ uid: string }>}
 */
export async function createUserAccount(input) {
  // Immediate feedback before the round trip — the Cloud Function enforces
  // the same rule server-side regardless, so this is UX only.
  const { valid, errors } = validatePassword(input?.password)
  if (!valid) {
    throw new Error(`Password requirements not met: ${errors.join(', ')}.`)
  }
  try {
    const call = httpsCallable(functions, 'createUserAccount')
    const { data } = await call(input)
    return data
  } catch (err) {
    throw new Error(_friendlyCallableError(err))
  }
}

/**
 * Permanently remove a student/admin account (Auth + Firestore profile).
 * @param {string} uid
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteUserAccount(uid) {
  try {
    const call = httpsCallable(functions, 'deleteUserAccount')
    const { data } = await call({ uid })
    return data
  } catch (err) {
    throw new Error(_friendlyCallableError(err))
  }
}

/**
 * Directly set a new password for another user's account.
 * @param {string} uid
 * @param {string} newPassword
 * @returns {Promise<{ success: boolean }>}
 */
export async function resetUserPassword(uid, newPassword) {
  const { valid, errors } = validatePassword(newPassword)
  if (!valid) {
    throw new Error(`Password requirements not met: ${errors.join(', ')}.`)
  }
  try {
    const call = httpsCallable(functions, 'resetUserPassword')
    const { data } = await call({ uid, newPassword })
    return data
  } catch (err) {
    throw new Error(_friendlyCallableError(err))
  }
}

/**
 * List all student/admin account profiles for the account management screen.
 * @returns {Promise<Array<{ uid, role, displayName, email, status, createdAt }>>}
 */
export async function listUsers() {
  try {
    const call = httpsCallable(functions, 'listUsers')
    const { data } = await call()
    return data.users
  } catch (err) {
    throw new Error(_friendlyCallableError(err))
  }
}

/**
 * Fetch recent admin account-management actions (create/delete/reset).
 * @param {number} [limit=50]
 * @returns {Promise<Array<{ id, action, actorUid, actorEmail, targetUid, targetEmail, details, createdAt }>>}
 */
export async function getAuditLog(limit = 50) {
  try {
    const call = httpsCallable(functions, 'getAuditLog')
    const { data } = await call({ limit })
    return data.logs
  } catch (err) {
    throw new Error(_friendlyCallableError(err))
  }
}
