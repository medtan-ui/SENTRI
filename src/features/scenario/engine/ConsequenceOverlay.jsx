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
 * outcomeTitle/feedbackText; when feedbackMediaUrl is set for a
 * future module, it renders in place of the icon.
 */
export default function ConsequenceOverlay({ choice, onContinue }) {
  const icon = CONSEQUENCE_ICON[choice.consequenceType] || CONSEQUENCE_ICON.none
  const btnRef = React.useRef(null)

  React.useEffect(() => {
    btnRef.current?.focus()
  }, [])

  return (
    <div className={styles.overlay} role="alertdialog" aria-modal="true" aria-live="assertive">
      <div className={styles.panel}>
        {choice.feedbackMediaUrl ? (
          <img className={styles.media} src={choice.feedbackMediaUrl} alt="" />
        ) : (
          <span className={styles.icon} aria-hidden="true">{icon}</span>
        )}
        <h3 className={styles.title}>{choice.outcomeTitle}</h3>
        <p className={styles.text}>{choice.feedbackText}</p>
        <button ref={btnRef} type="button" className={styles.continueBtn} onClick={onContinue}>
          Continue →
        </button>
      </div>
    </div>
  )
}
