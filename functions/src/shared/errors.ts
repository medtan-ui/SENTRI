/**
 * shared/errors.ts
 * A structured, HttpsError-agnostic error type that every service/
 * repository throws. `withCallable` (see withCallable.ts) is the only
 * place that translates this into an HttpsError — this keeps service code
 * free of any dependency on the Functions runtime.
 */

/** The subset of Firebase Functions error codes this backend actually uses. */
export type AppErrorCode =
  | 'invalid-argument'
  | 'unauthenticated'
  | 'permission-denied'
  | 'not-found'
  | 'already-exists'
  | 'failed-precondition'
  | 'resource-exhausted'
  | 'internal'

export class AppError extends Error {
  code: AppErrorCode
  details?: unknown

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}
