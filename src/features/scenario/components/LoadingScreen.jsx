import React from 'react'
import styles from './LoadingScreen.module.css'

/**
 * LoadingScreen (scenario-feature-local)
 * Shown only for the brief LOADING state before a config's first INTRO
 * screen — deliberately separate from the app-wide LoadingScreen so this
 * feature stays fully self-contained and reusable on its own.
 */
export default function LoadingScreen({ label = 'Loading scenario…' }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.label}>{label}</p>
    </div>
  )
}
