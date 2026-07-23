import React from 'react'
import styles from './ConsequenceOverlay.module.css'

const CONSEQUENCE_ICON = {
  credential_compromise: '🔓',
  account_takeover: '🕵️',
  data_exposure: '📤',
  device_compromise: '🖥️',
  financial_loss: '💸',
  physical_risk: '⚠️',
  none: '⚠️',
}

/**
 * ConsequenceOverlay
 * A full-bleed dramatic beat shown only for risky choices, before the
 * explanatory FeedbackPanel — the "your accounts just fell" moment
 * (Scenario 2), or a shorter version for the others. No clip exists
 * yet, so this is a static panel built from the choice's own
 * outcome_title/feedback_text; when feedback_media_url is set for a
 * future module, it renders in place of the icon.
 */
export default function ConsequenceOverlay({ choice, onContinue }) {
  const icon = CONSEQUENCE_ICON[choice.consequence_type] || CONSEQUENCE_ICON.none

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {choice.feedback_media_url ? (
          <img className={styles.media} src={choice.feedback_media_url} alt="" />
        ) : (
          <span className={styles.icon} aria-hidden="true">{icon}</span>
        )}
        <h3 className={styles.title}>{choice.outcome_title}</h3>
        <p className={styles.text}>{choice.feedback_text}</p>
        <button type="button" className={styles.continueBtn} onClick={onContinue}>
          Continue →
        </button>
      </div>
    </div>
  )
}
