import React, { useEffect, useState } from 'react'
import styles from './DesktopChrome.module.css'

function formatClock(date) {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const suffix = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`
}

/**
 * DesktopChrome
 * A minimal, deliberately ordinary OS shell — desktop content area on
 * top, a taskbar along the bottom with a live clock, an optional Start
 * icon/menu, and an optional system tray icon/menu. A downloads bar can
 * slide up from the bottom of whatever's rendered as `children` (e.g. a
 * <BrowserChrome>), the same way a real browser's download notification
 * does — implemented entirely here, without BrowserChrome needing any
 * awareness of it.
 *
 * Every interactive bit (the Start icon, its menu, the tray icon, its
 * menu, the downloads bar's own buttons) is supplied by the scene as a
 * ready-made node — usually an <InteractiveTarget> — the same "slot"
 * pattern BrowserChrome already uses for its address bar. This file has
 * no engine imports and no scenario logic of its own, so it's reusable
 * as-is by any future module.
 */
export default function DesktopChrome({
  startIconSlot,
  startMenuOpen,
  startMenuSlot,
  systemTraySlot,
  trayMenuOpen,
  trayMenuSlot,
  downloadsBarOpen,
  downloadsBarSlot,
  children,
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.desktop}>
      <div className={styles.desktopArea}>
        {children}

        {downloadsBarOpen && (
          <div className={styles.downloadsBar}>
            <div className={styles.downloadsBarInner}>{downloadsBarSlot}</div>
          </div>
        )}
      </div>

      <div className={styles.taskbar}>
        <div className={styles.taskbarLeft}>
          {startMenuOpen && (
            <div className={styles.startMenu}>{startMenuSlot}</div>
          )}
          {startIconSlot || <span className={styles.startIconDecorative} aria-hidden="true">⊞</span>}
        </div>

        <div className={styles.taskbarRight}>
          <div className={styles.trayGroup}>
            {trayMenuOpen && (
              <div className={styles.trayMenu}>{trayMenuSlot}</div>
            )}
            {systemTraySlot}
          </div>
          <span className={styles.clock}>{formatClock(now)}</span>
        </div>
      </div>
    </div>
  )
}
