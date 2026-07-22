import React from 'react'
import styles from './FeedbackPanel.module.css'

/**
 * FeedbackPanel
 * Shown immediately after a choice is made, for both safe and risky
 * picks. Safe -> "Continue" resumes the story. Risky -> "See What
 * Happens" moves into the consequence playback.
 */
export default function FeedbackPanel({ choice, onContinue, onViewConsequence }) {
  const isSafe = choice.isSafe

  return (
    <div className={styles.overlay}>
      <div className={[styles.panel, isSafe ? styles.safe : styles.risky].join(' ')}>
        <span className={styles.icon} aria-hidden="true">{isSafe ? '✅' : '⚠️'}</span>
        <h3 className={styles.title}>{choice.feedbackTitle}</h3>
        <p className={styles.text}>{choice.feedbackText}</p>
        {isSafe ? (
          <button type="button" className={styles.primaryBtn} onClick={onContinue}>
            Continue →
          </button>
        ) : (
          <button type="button" className={styles.primaryBtn} onClick={onViewConsequence}>
            See What Happens →
          </button>
        )}
      </div>
    </div>
  )
}
