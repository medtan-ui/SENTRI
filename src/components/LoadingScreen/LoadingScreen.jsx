import React from 'react'
import styles from './LoadingScreen.module.css'

/**
 * LoadingScreen
 * Full-page loading state shown while Firebase resolves the initial
 * auth session (page load / refresh) so ProtectedRoute doesn't briefly
 * flash the login page before a persisted session is restored.
 */
export default function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.label}>{label}</p>
    </div>
  )
}
