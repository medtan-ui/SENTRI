/**
 * analyticsEventService.js
 * Fire-and-forget activity telemetry — the `analyticsEvents` collection,
 * written server-side by the recordAnalyticsEvent Cloud Function.
 *
 * This is the time-on-task layer, distinct from the two finer-grained
 * ones: `quiz_responses` measures a single question, and
 * `scenario_decision_records` measures a single decision. Here an event
 * covers a whole activity — how long a student spent reading a lesson,
 * running a simulation, or taking a quiz.
 *
 * ── Two rules ────────────────────────────────────────────────────────
 * 1. Recording never blocks learning. Every function here swallows its
 *    own errors, exactly like scenarioDecisionService. A student whose
 *    telemetry write fails should notice nothing at all.
 * 2. An unmeasured duration is omitted, never sent as 0. The backend
 *    stores it as null so the item is excluded from averages rather than
 *    dragging them toward zero.
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

/**
 * @param {'lesson_viewed'|'lesson_completed'|'simulation_started'|'simulation_completed'|
 *   'pretest_submitted'|'quiz_started'|'quiz_submitted'|'posttest_submitted'|
 *   'module_completed'|'dashboard_viewed'} eventType
 * @param {{ moduleId?: string, durationMs?: number|null, payload?: object }} [options]
 * @returns {Promise<void>}
 */
export async function recordEvent(eventType, { moduleId, durationMs, payload } = {}) {
  try {
    const call = httpsCallable(functions, 'recordAnalyticsEvent')
    await call({
      eventType,
      ...(moduleId ? { moduleId } : {}),
      ...(typeof durationMs === 'number' && durationMs >= 0 ? { durationMs: Math.round(durationMs) } : {}),
      ...(payload ? { payload } : {}),
    })
  } catch (err) {
    console.error(`[analyticsEventService] recordEvent(${eventType}) failed — continuing:`, err)
  }
}

/**
 * Starts a stopwatch for an activity and returns the function that ends
 * it and records the event.
 *
 * Returning a closure rather than exposing start/stop separately means a
 * caller can't accidentally record a duration measured from the wrong
 * moment — the start time is captured here and can't be reassigned.
 *
 * @param {string} eventType   The event to record when the activity ends.
 * @param {string} [moduleId]
 * @returns {(payload?: object) => Promise<void>}
 */
export function startTimedEvent(eventType, moduleId) {
  const startedAt = Date.now()
  return (payload) => recordEvent(eventType, { moduleId, durationMs: Date.now() - startedAt, payload })
}
