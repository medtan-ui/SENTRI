import React, { useState } from 'react'
import badges from '../styles/badges.module.css'
import styles from './ConsequenceEditor.module.css'

/**
 * ConsequenceEditor
 * Only rendered for a risky choice. Lets an admin toggle whether this
 * choice's consequence is a video (choice.consequenceVideo present) or a
 * still-image placeholder (no consequenceVideo at all) — the exact two
 * modes ConsequencePlayer already supports. There is no separate "title"
 * or "explanation" field here: those ARE choice.feedbackTitle/feedbackText,
 * edited once in ChoiceEditor and reused by both the FeedbackPanel and
 * the ConsequencePlayer's explanation card — duplicating them here would
 * create a second field the engine never reads.
 */
export default function ConsequenceEditor({ choice, onSetEnabled }) {
  const [notice, setNotice] = useState('')
  const hasVideo = Boolean(choice.consequenceVideo)

  function handleReplaceMedia() {
    setNotice('Mock action — connect Firestore Storage to enable real uploads.')
    setTimeout(() => setNotice(''), 2500)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.heading}>Consequence</span>
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={`${styles.typeBtn} ${!hasVideo ? styles.typeBtnActive : ''}`}
            onClick={() => onSetEnabled(false)}
          >
            Still Image
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${hasVideo ? styles.typeBtnActive : ''}`}
            onClick={() => onSetEnabled(true)}
          >
            Video
          </button>
        </div>
      </div>

      {hasVideo ? (
        <div className={styles.videoInfo}>
          <span className={`${badges.pill} ${badges.placeholderStatus}`}>Placeholder</span>
          <span className={styles.duration}>{choice.consequenceVideo.duration}s</span>
          <button type="button" className={styles.replaceBtn} onClick={handleReplaceMedia}>
            Replace placeholder media
          </button>
        </div>
      ) : (
        <p className={styles.note}>
          This choice shows the engine's generic warning placeholder — no consequence video configured.
        </p>
      )}

      {notice && <p className={styles.notice}>{notice}</p>}
    </div>
  )
}
