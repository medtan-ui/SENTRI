/**
 * loginLockout.js
 * ─────────────────────────────────────────────────────────────
 * Client-side progressive lockout after repeated failed logins.
 *
 * IMPORTANT — this is a UX friction layer, not a real security boundary.
 * It's scoped to sessionStorage (this browser tab) and keyed by the
 * typed email, so it's trivially bypassed by clearing storage, opening
 * a new tab, or scripting directly against the Firebase Auth REST API.
 * The actual server-side protections against brute-forcing are:
 *   - Firebase Auth's own built-in throttling (auth/too-many-requests)
 *   - Firebase App Check (see src/services/firebase.js), which rejects
 *     requests that don't come from a verified instance of this app
 * This just slows down someone fat-fingering a password in the UI and
 * gives clearer feedback than silently re-throttling every attempt.
 * ─────────────────────────────────────────────────────────────
 */

const STORAGE_PREFIX = 'sentri_login_attempts_'
const LOCK_THRESHOLD = 5
const BASE_LOCKOUT_MS = 30_000
const MAX_LOCKOUT_MS = 5 * 60_000

function _key(email) {
  return STORAGE_PREFIX + (email || '').trim().toLowerCase()
}

function _read(email) {
  try {
    const raw = sessionStorage.getItem(_key(email))
    return raw ? JSON.parse(raw) : { count: 0, lockedUntil: 0 }
  } catch {
    return { count: 0, lockedUntil: 0 }
  }
}

function _write(email, state) {
  try {
    sessionStorage.setItem(_key(email), JSON.stringify(state))
  } catch {
    // sessionStorage unavailable (private browsing, quota, etc.) — fail open.
  }
}

/**
 * @param {string} email
 * @returns {{ locked: boolean, remainingMs: number }}
 */
export function getLockoutState(email) {
  const state = _read(email)
  const remainingMs = state.lockedUntil - Date.now()
  return { locked: remainingMs > 0, remainingMs: Math.max(0, remainingMs) }
}

/**
 * Call after a failed login attempt. Escalates the lockout window once the
 * failure count crosses LOCK_THRESHOLD (30s, 60s, 120s... capped at 5min).
 * @param {string} email
 * @returns {{ locked: boolean, remainingMs: number }}
 */
export function recordFailedAttempt(email) {
  const state = _read(email)
  const count = state.count + 1
  let lockedUntil = state.lockedUntil

  if (count >= LOCK_THRESHOLD) {
    const extraFailures = count - LOCK_THRESHOLD
    const backoff = Math.min(BASE_LOCKOUT_MS * 2 ** extraFailures, MAX_LOCKOUT_MS)
    lockedUntil = Date.now() + backoff
  }

  _write(email, { count, lockedUntil })
  return getLockoutState(email)
}

/**
 * Call after a successful login to clear the failure history for this email.
 * @param {string} email
 */
export function resetAttempts(email) {
  try {
    sessionStorage.removeItem(_key(email))
  } catch {
    // no-op
  }
}
