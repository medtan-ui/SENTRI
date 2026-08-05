import React, { useEffect, useRef, useState } from 'react'
import BadgeMedal from './BadgeMedal'
import Icon from '../Icon/Icon'
import { useGamificationState } from '../../context/GamificationContext'
import styles from './BadgeToaster.module.css'

const VISIBLE_MS = 7000

/**
 * BadgeToaster
 * Announces a badge the moment it is earned, anywhere in the app.
 *
 * Before this, a badge landing was almost entirely silent. The
 * simulation-complete screen listed new badges, but that is one of five
 * paths that can award one — finishing a quiz, taking a post-test,
 * completing a module and keeping a streak alive all earned badges that
 * a student would only discover by going and looking at their profile.
 * A reward nobody is told about is not much of a reward.
 *
 * Mounted once, next to the provider, so it works on every page rather
 * than being something each page has to remember to render.
 *
 * ── How "new" is decided ─────────────────────────────────────────────
 * By diffing the badge list against the last one seen, with one
 * important exception: the FIRST list of a session establishes the
 * baseline silently. Without that, every page load would announce every
 * badge the student has ever earned. That also means a badge earned
 * while the tab was closed is not announced on next open, which is the
 * right trade — a notification is for something that just happened.
 */
export default function BadgeToaster() {
  const { status, gamification, catalog } = useGamificationState()
  const [queue, setQueue] = useState([])
  const knownRef = useRef(null)

  useEffect(() => {
    if (status !== 'success' || !gamification) return
    const current = gamification.badges ?? []

    // First sighting: remember, announce nothing.
    if (knownRef.current === null) {
      knownRef.current = new Set(current)
      return
    }

    const fresh = current.filter((id) => !knownRef.current.has(id))
    if (fresh.length === 0) return

    knownRef.current = new Set(current)
    setQueue((prev) => [...prev, ...fresh.filter((id) => !prev.includes(id))])
  }, [status, gamification])

  // Each toast times out independently of the others, so a burst (three
  // badges landing on one module completion) doesn't hold the last one
  // on screen for three times as long.
  useEffect(() => {
    if (queue.length === 0) return undefined
    const timers = queue.map((id) =>
      setTimeout(() => setQueue((prev) => prev.filter((queued) => queued !== id)), VISIBLE_MS),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length])

  if (queue.length === 0) return null

  const shown = queue
    .map((id) => catalog.find((badge) => badge.id === id))
    .filter(Boolean)

  if (shown.length === 0) return null

  return (
    // `polite` rather than `assertive`: earning a badge is good news, not
    // something worth interrupting a screen reader mid-sentence for.
    <div className={styles.stack} role="status" aria-live="polite" data-print-hide>
      {shown.map((badge) => (
        <div key={badge.id} className={styles.toast}>
          <span className={styles.eyebrow}>
            <Icon name="sparkle" size={13} />
            Badge earned
          </span>
          <BadgeMedal badge={badge} earned />
          <button
            type="button"
            className={styles.dismiss}
            aria-label={`Dismiss ${badge.name} notification`}
            onClick={() => setQueue((prev) => prev.filter((id) => id !== badge.id))}
          >
            <Icon name="arrowRight" size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
