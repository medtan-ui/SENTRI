import React, { useEffect } from 'react'
import styles from './ScenarioContextPopup.module.css'

/**
 * ScenarioContextPopup
 * A storyboard-styled popup that appears at the start of a scenario to
 * give the student narrative context — what just happened in the video
 * they watched, so they understand the situation they're walking into.
 *
 * Styled to match the sketch treatment: ink borders, paper textures,
 * hand-drawn feel. Closes on the "Got it" button or Escape key.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title: string,
 *   narrative: string,
 *   hints?: string[],
 * }} props
 */
export default function ScenarioContextPopup({ open, onClose, title, narrative, hints }) {
  useEffect(() => {
    if (!open) return undefined
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.icon} aria-hidden="true">📋</span>
          <h3 className={styles.title}>{title}</h3>
        </div>

        <div className={styles.body}>
          <p className={styles.narrative}>{narrative}</p>

          {hints && hints.length > 0 && (
            <div className={styles.hintsSection}>
              <h4 className={styles.hintsTitle}>
                <span aria-hidden="true">💡</span> Things to watch for:
              </h4>
              <ul className={styles.hintsList}>
                {hints.map((hint, i) => (
                  <li key={i} className={styles.hintItem}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.gotItBtn}
            onClick={onClose}
            autoFocus
          >
            Got it — let me in →
          </button>
        </div>
      </div>
    </div>
  )
}
