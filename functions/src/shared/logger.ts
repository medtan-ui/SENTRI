/**
 * shared/logger.ts
 * Thin wrapper around firebase-functions' structured logger so every log
 * line this backend emits has a consistent shape: { function, uid, moduleId,
 * durationMs, outcome, ... }. Structured fields (not string concatenation)
 * so Cloud Logging can filter/aggregate on them.
 */
import * as logger from 'firebase-functions/logger'

export interface LogFields {
  function: string
  uid?: string | null
  moduleId?: string | null
  durationMs?: number
  outcome?: 'success' | 'error'
  errorCode?: string
  [key: string]: unknown
}

export function logInfo(message: string, fields: LogFields): void {
  logger.info(message, fields)
}

export function logWarn(message: string, fields: LogFields): void {
  logger.warn(message, fields)
}

export function logError(message: string, fields: LogFields): void {
  logger.error(message, fields)
}
