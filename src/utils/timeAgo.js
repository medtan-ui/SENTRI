/**
 * timeAgo.js
 * Formats a Firestore Timestamp (or Date, or millis) as a short relative
 * string like "5 min ago" — used anywhere a raw timestamp from Firestore
 * needs to read as recent activity instead of an ISO string.
 */
const UNITS = [
  { limit: 60, divisor: 1, label: 'sec' },
  { limit: 3600, divisor: 60, label: 'min' },
  { limit: 86400, divisor: 3600, label: 'hr' },
  { limit: 604800, divisor: 86400, label: 'day' },
]

/**
 * @param {import('firebase/firestore').Timestamp | {_seconds:number} | Date | number | null | undefined} value
 *   A Cloud Function's JSON response serializes an Admin SDK Timestamp as
 *   {_seconds, _nanoseconds} (its toJSON() shape) rather than a real
 *   Timestamp instance — no .toDate() survives the trip — so that shape
 *   needs its own branch alongside the client SDK's Timestamp and a plain
 *   Date/millis value.
 * @returns {string}
 */
export function timeAgo(value) {
  if (!value) return ''
  const date =
    typeof value.toDate === 'function'
      ? value.toDate()
      : typeof value._seconds === 'number'
        ? new Date(value._seconds * 1000)
        : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))

  if (seconds < 5) return 'just now'
  for (const { limit, divisor, label } of UNITS) {
    if (seconds < limit) {
      const amount = Math.floor(seconds / divisor)
      return `${amount} ${label}${amount === 1 ? '' : 's'} ago`
    }
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
