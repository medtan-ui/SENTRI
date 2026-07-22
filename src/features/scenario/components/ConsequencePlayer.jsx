import React, { useState } from 'react'
import styles from './ConsequencePlayer.module.css'

/**
 * ConsequencePlayer
 * Shown after a risky choice. Plays `choice.consequenceVideo` if one was
 * configured and is available; otherwise falls back to a generic warning
 * placeholder. Either way, the explanation (from the same choice) and a
 * "Try Again" button appear once the consequence has been shown.
 */
export default function ConsequencePlayer({ choice, onTryAgain }) {
  const consequence = choice.consequenceVideo
  const hasPlayableVideo = Boolean(consequence?.videoAvailable)
  const [explanationVisible, setExplanationVisible] = useState(!hasPlayableVideo)

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {hasPlayableVideo ? (
          <video
            className={styles.video}
            src={consequence.videoUrl}
            poster={consequence.thumbnail}
            autoPlay
            muted
            playsInline
            onEnded={() => setExplanationVisible(true)}
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon} aria-hidden="true">⚠️</span>
            <p className={styles.placeholderLabel}>
              {consequence ? 'Consequence video coming soon' : 'Here\'s what could happen'}
            </p>
          </div>
        )}

        {explanationVisible && (
          <div className={styles.explanation}>
            <h3 className={styles.title}>{choice.feedbackTitle}</h3>
            <p className={styles.text}>{choice.feedbackText}</p>
            <button type="button" className={styles.retryBtn} onClick={onTryAgain}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
