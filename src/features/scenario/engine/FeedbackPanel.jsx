import React from 'react'
import styles from './FeedbackPanel.module.css'

/**
 * FeedbackPanel
 * The explanatory word after a decision resolves — safe choices get a
 * "Continue" into the next scenario, risky choices get "Try Again"
 * (which the engine routes back to paused_interactive at the same
 * pause point, never back to the start of the clip). After 3 risky
 * attempts on the same scenario, this expands into a longer guided
 * explanation instead of repeating the same short line — there are no
 * dead ends, the student always reaches the safe choice eventually,
 * on their own click.
 */
export default function FeedbackPanel({ choice, attemptCount, onRetry, onContinue }) {
  const isSafe = choice.is_safe_choice
  const guided = !isSafe && attemptCount >= 3

  return (
    <div className={styles.overlay}>
      <div className={[styles.panel, isSafe ? styles.safe : styles.risky].join(' ')}>
        <span className={styles.icon} aria-hidden="true">{isSafe ? '✅' : '⚠️'}</span>
        <h3 className={styles.title}>{choice.outcome_title}</h3>
        <p className={styles.text}>{choice.feedback_text}</p>

        {guided && (
          <div className={styles.guidedHint}>
            <span aria-hidden="true">💡</span>
            Look for the highlighted element — that's the safer move here.
          </div>
        )}

        {isSafe ? (
          <button type="button" className={styles.primaryBtn} onClick={onContinue}>
            Continue →
          </button>
        ) : (
          <button type="button" className={styles.primaryBtn} onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
