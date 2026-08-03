/**
 * shared/withCallable.ts
 * Every onCall export in this backend goes through here. It is the single
 * seam that:
 *   - times the invocation and logs a structured entry (function, uid,
 *     moduleId, durationMs, outcome) on both success and failure
 *   - translates a thrown AppError into an HttpsError with the same
 *     { code, message, details } shape
 *   - catches anything unexpected, logs the full error (with stack) only
 *     server-side, and returns a generic 'internal' HttpsError so no
 *     internal detail ever crosses the wire to the client
 */
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https'
import { AppError } from './errors'
import { logError, logInfo, logWarn } from './logger'

type Handler<T, R> = (request: CallableRequest<T>) => Promise<R>

/**
 * ── App Check ────────────────────────────────────────────────────────
 * When enforced, the Functions runtime rejects any call that doesn't
 * carry a valid App Check token *before* the handler runs — that is what
 * proves a request came from a genuine instance of this app rather than a
 * script replaying the public Firebase config.
 *
 * It is off by default and switched on by setting APPCHECK_ENFORCED=true
 * in the functions environment, because enforcing it before the web app
 * has a reCAPTCHA site key (VITE_RECAPTCHA_V3_SITE_KEY) would lock every
 * real user out of every callable. The intended order is: register a
 * reCAPTCHA v3 key → set it in the web .env and deploy the frontend →
 * confirm attested traffic in Firebase Console → App Check → only then
 * set this flag and redeploy functions.
 *
 * Reading it per-deployment (at module load) rather than per-request is
 * deliberate: `enforceAppCheck` is deployment configuration, not
 * something to toggle mid-flight.
 */
const APP_CHECK_ENFORCED = process.env.APPCHECK_ENFORCED === 'true'

function extractModuleId(data: unknown): string | undefined {
  if (data && typeof data === 'object' && 'moduleId' in data) {
    const value = (data as { moduleId?: unknown }).moduleId
    return typeof value === 'string' ? value : undefined
  }
  return undefined
}

export function defineCallable<T = unknown, R = unknown>(
  name: string,
  handler: Handler<T, R>,
  options: CallableOptions = {},
) {
  // A caller-supplied enforceAppCheck still wins, so a single function
  // can opt out (or in) independently of the deployment-wide default.
  const callableOptions: CallableOptions = { enforceAppCheck: APP_CHECK_ENFORCED, ...options }

  return onCall(callableOptions, async (request: CallableRequest<T>): Promise<R> => {
    const startedAt = Date.now()
    const uid = request.auth?.uid ?? null
    const moduleId = extractModuleId(request.data) ?? null

    try {
      const result = await handler(request)
      logInfo(`[${name}] succeeded`, {
        function: name,
        uid,
        moduleId,
        durationMs: Date.now() - startedAt,
        outcome: 'success',
        // Logged even when enforcement is off, so the Console shows what
        // share of real traffic is already attested before the flag is
        // flipped — flipping it blind is how you lock out live users.
        appCheck: request.app ? 'verified' : 'absent',
      })
      return result
    } catch (err) {
      const durationMs = Date.now() - startedAt

      if (err instanceof AppError) {
        logWarn(`[${name}] rejected`, {
          function: name,
          uid,
          moduleId,
          durationMs,
          outcome: 'error',
          errorCode: err.code,
          message: err.message,
        })
        throw new HttpsError(err.code, err.message, err.details)
      }

      if (err instanceof HttpsError) {
        logWarn(`[${name}] rejected`, {
          function: name,
          uid,
          moduleId,
          durationMs,
          outcome: 'error',
          errorCode: err.code,
          message: err.message,
        })
        throw err
      }

      logError(`[${name}] unexpected error`, {
        function: name,
        uid,
        moduleId,
        durationMs,
        outcome: 'error',
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      })
      throw new HttpsError('internal', 'An unexpected error occurred. Please try again.')
    }
  })
}
