import React from 'react'
import styles from './PhoneFrame.module.css'

/**
 * PhoneFrame
 * Mock phone bezel wrapping the scenario player, used when a config's
 * `surface` is 'phone'. `statusLabel` is optional cosmetic text for the
 * fake status bar (e.g. a carrier name) — never hardcoded content.
 */
export default function PhoneFrame({ statusLabel = '', children }) {
  return (
    <div className={styles.bezel}>
      <div className={styles.notch} aria-hidden="true" />
      <div className={styles.statusBar}>
        <span>9:41</span>
        {statusLabel ? <span>{statusLabel}</span> : null}
        <span>🔋</span>
      </div>
      <div className={styles.viewport}>{children}</div>
    </div>
  )
}
