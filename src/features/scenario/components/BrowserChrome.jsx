import React from 'react'
import styles from './BrowserChrome.module.css'

/**
 * BrowserChrome
 * Mock desktop browser window wrapping the scenario player, used when a
 * config's `surface` is 'browser'. `url` is scenario-supplied (or a
 * generic fallback) — never hardcoded to any real site.
 */
export default function BrowserChrome({ url = 'https://example.com', children }) {
  return (
    <div className={styles.window}>
      <div className={styles.titleBar}>
        <span className={`${styles.dot} ${styles.dotRed}`} />
        <span className={`${styles.dot} ${styles.dotYellow}`} />
        <span className={`${styles.dot} ${styles.dotGreen}`} />
      </div>
      <div className={styles.addressBar}>
        <span className={styles.lock} aria-hidden="true">🔒</span>
        <span className={styles.url}>{url}</span>
      </div>
      <div className={styles.viewport}>{children}</div>
    </div>
  )
}
