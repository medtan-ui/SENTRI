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
  return onCall(options, async (request: CallableRequest<T>): Promise<R> => {
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
