import React from 'react'
import styles from './BrowserChrome.module.css'

/**
 * BrowserChrome
 * A deliberately ordinary, boring desktop browser window — plain
 * corporate blues/greys, not SENTRI's gold theme. If the cloned
 * interface looked like SENTRI's own UI, the illusion of "this is a
 * real website" collapses and the exercise stops teaching anything.
 *
 * `addressBar` and `chromeMenuSlot` are optional consumer-supplied
 * nodes (the same slot pattern for both) — when omitted, BrowserChrome
 * renders exactly as it always has, so every existing scene is
 * unaffected. `chromeMenuSlot` exists specifically so a scene can offer
 * a real "this is the browser's own menu" target (e.g. Settings ->
 * About) that's genuinely part of the chrome, not the page content
 * below it.
 */
export default function BrowserChrome({ url = 'https://example.com', addressBar, chromeMenuSlot, children }) {
  return (
    <div className={styles.window}>
      <div className={styles.titleBar}>
        <span className={styles.dot} data-color="red" />
        <span className={styles.dot} data-color="yellow" />
        <span className={styles.dot} data-color="green" />
      </div>
      <div className={styles.addressRow}>
        <span className={styles.navIcon} aria-hidden="true">←</span>
        <span className={styles.navIcon} aria-hidden="true">→</span>
        <span className={styles.navIcon} aria-hidden="true">⟳</span>
        {addressBar || (
          <div className={styles.addressDisplay}>
            <span className={styles.lock} aria-hidden="true">🔒</span>
            <span className={styles.url}>{url}</span>
          </div>
        )}
        {chromeMenuSlot}
      </div>
      <div className={styles.viewport}>{children}</div>
    </div>
  )
}
