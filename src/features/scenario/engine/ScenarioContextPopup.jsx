import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../../components/Icon/Icon'
import feedbackStyles from './FeedbackPanel.module.css'
import styles from './ScenarioContextPopup.module.css'

/** A dismissible setup for the interactive, using the feedback dialog design. */
export default function ScenarioContextPopup({ open, onClose, title, narrative }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const narrativeId = useId()

  useEffect(() => {
    if (!open) return undefined
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    // The native modal keeps keyboard focus inside and makes the page inert.
    dialog.showModal()
    return () => {
      dialog.close()
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.backdrop}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={narrativeId}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className={`${feedbackStyles.panel} ${styles.panel}`}>
        <button type="button" className={styles.closeBtn} aria-label="Close scenario context" onClick={onClose}>
          <span aria-hidden="true">×</span>
        </button>
        <span className={`${feedbackStyles.icon} ${styles.icon}`} aria-hidden="true">
          <Icon name="book" size={26} strokeWidth={1.7} />
        </span>
        <h3 id={titleId} className={feedbackStyles.title}>{title}</h3>
        <p id={narrativeId} className={feedbackStyles.text}>{narrative}</p>
        <button type="button" className={feedbackStyles.primaryBtn} onClick={onClose} autoFocus>
          Got it — continue
        </button>
      </div>
    </dialog>,
    document.body,
  )
}
