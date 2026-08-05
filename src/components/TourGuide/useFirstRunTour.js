import { useCallback, useEffect, useState } from 'react'

const KEY_PREFIX = 'sentri:tourDone'

export function tourStorageKey(uid) {
  return `${KEY_PREFIX}:${uid || 'guest'}`
}

/**
 * useFirstRunTour
 * Decides whether a dashboard should offer its walkthrough, and records
 * that it has been seen.
 *
 * Shared by the student and admin dashboards because both want exactly
 * the same behaviour around a different set of steps: show it once per
 * account, wait until the page has real data so the spotlight measures
 * elements in their final position, and never nag if it has already been
 * dismissed.
 *
 * "Seen" lives in localStorage rather than on the user's profile. A
 * walkthrough being watched is not a fact about the account worth a
 * Firestore write, a schema field, or a rules change — and the worst
 * case of losing it (a new browser) is that a student is offered a
 * 30 second tour they can skip in one click.
 *
 * @param {{ uid?: string, ready: boolean }} options
 *   `ready` should be true once the page's own data has loaded.
 */
export function useFirstRunTour({ uid, ready }) {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (!uid || !ready) return undefined
    try {
      if (window.localStorage.getItem(tourStorageKey(uid)) === 'true') return undefined
    } catch {
      // Storage blocked (private mode): skip rather than offer it on
      // every single load, which is the more annoying failure.
      return undefined
    }
    // A beat after the data lands, so layout has settled before anything
    // is measured. Re-armed on every effect run, which is what keeps it
    // working under StrictMode's mount/cleanup/mount.
    const timer = setTimeout(() => setShowTour(true), 500)
    return () => clearTimeout(timer)
  }, [uid, ready])

  const finishTour = useCallback(() => {
    setShowTour(false)
    try {
      window.localStorage.setItem(tourStorageKey(uid), 'true')
    } catch {
      // Nothing to do; worst case it offers itself again next visit.
    }
  }, [uid])

  return { showTour, finishTour }
}

/**
 * Clears the "seen" flag so the dashboard offers the tour again. Wired to
 * the "Replay the tour" control on both profile pages, which is what
 * makes the tour's own "you can come back to it" copy true.
 */
export function resetFirstRunTour(uid) {
  try {
    window.localStorage.removeItem(tourStorageKey(uid))
  } catch {
    // Storage unavailable; the dashboard simply won't offer it.
  }
}
