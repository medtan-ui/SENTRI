/**
 * passwordPolicy.js
 * ─────────────────────────────────────────────────────────────
 * Shared password rules for every place a new password is entered
 * client-side (reset-password completion page, future admin
 * create/reset-password forms via adminService.js).
 *
 * This is a UX layer only — immediate feedback so users don't submit
 * a doomed password. The real enforcement is server-side:
 *   - functions/index.js (assertValidPassword) for admin-created accounts
 *   - Firebase Auth's own minimum for self-service flows
 * Client-side checks can always be bypassed by calling the API directly,
 * so never treat this file as the security boundary.
 * ─────────────────────────────────────────────────────────────
 */

export const MIN_LENGTH = 8

/**
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const value = password || ''
  const errors = []

  if (value.length < MIN_LENGTH) errors.push(`At least ${MIN_LENGTH} characters`)
  if (!/[a-z]/.test(value)) errors.push('One lowercase letter')
  if (!/[A-Z]/.test(value)) errors.push('One uppercase letter')
  if (!/[0-9]/.test(value)) errors.push('One number')

  return { valid: errors.length === 0, errors }
}

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']

/**
 * Rough strength estimate for a live meter — not a substitute for validatePassword.
 * @param {string} password
 * @returns {{ score: number, label: string }} score is 0-4
 */
export function passwordStrength(password) {
  const value = password || ''
  if (!value) return { score: 0, label: '' }

  let score = 0
  if (value.length >= MIN_LENGTH) score += 1
  if (value.length >= 12) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/[0-9]/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  const clamped = Math.min(score, STRENGTH_LABELS.length - 1)
  return { score: clamped, label: STRENGTH_LABELS[clamped] }
}
