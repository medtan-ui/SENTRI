/**
 * callableErrors.js
 * Translates a Firebase callable-function error (err.code like
 * 'functions/permission-denied') into a friendly, user-facing message.
 * Shared by every service that wraps an httpsCallable — originally
 * inlined in adminService.js; factored out so quizService/analyticsService
 * don't have to duplicate the same switch.
 *
 * `overrides` lets a specific caller substitute a more context-appropriate
 * message for one code (e.g. adminService's "No account found for this
 * user." for 'not-found') without every caller sharing the exact same
 * generic wording.
 * @param {unknown} err
 * @param {Partial<Record<'permission-denied'|'unauthenticated'|'already-exists'|'not-found'|'invalid-argument'|'failed-precondition', string>>} [overrides]
 */
export function friendlyCallableError(err, overrides = {}) {
  const code = err?.code?.replace(/^functions\//, '')
  if (code && overrides[code]) return overrides[code]

  switch (code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action.'
    case 'unauthenticated':
      return 'Your session has expired. Please sign in again.'
    case 'already-exists':
      return 'An account with this email already exists.'
    case 'not-found':
      return 'The requested item could not be found.'
    case 'invalid-argument':
    case 'failed-precondition':
      return err.message || 'Please check the information you entered.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
