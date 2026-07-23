import React, { useEffect, useState } from 'react'
import styles from './PhoneFrame.module.css'

function formatClock(date) {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const suffix = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`
}

const DEFAULT_NAV_ICONS = ['🏠', '🔍', '🔔', '👤']

/**
 * PhoneFrame
 * A deliberately ordinary phone shell — bezel, notch, a status bar
 * (live clock, signal, battery), a scrollable viewport, and a bottom
 * nav bar. Fixed aspect ratio and centered on desktop; near-fullscreen
 * on narrow/mobile viewports. Shared as-is by Modules 5 and 6.
 *
 * `bottomNavSlot` is an optional consumer-supplied node (same slot
 * pattern as BrowserChrome/DesktopChrome) for scenes that need a real,
 * interactive nav item (e.g. a Settings tab). When omitted, a plain
 * decorative 4-icon nav renders instead so the frame still looks
 * complete. This file has no engine imports and no scenario logic —
 * reusable as-is by any future phone-surface module.
 */
export default function PhoneFrame({ statusLabel = '', bottomNavSlot, children }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.bezel}>
      <div className={styles.notch} aria-hidden="true" />

      <div className={styles.statusBar}>
        <span className={styles.time}>{formatClock(now)}</span>
        {statusLabel && <span className={styles.carrierLabel}>{statusLabel}</span>}
        <div className={styles.statusIcons} aria-hidden="true">
          <span>📶</span>
          <span>📡</span>
          <span>🔋</span>
        </div>
      </div>

      <div className={styles.viewport}>{children}</div>

      <div className={styles.bottomNav}>
        {bottomNavSlot || (
          <div className={styles.defaultNav} aria-hidden="true">
            {DEFAULT_NAV_ICONS.map((icon, i) => (
              <span key={i} className={styles.defaultNavIcon}>{icon}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
