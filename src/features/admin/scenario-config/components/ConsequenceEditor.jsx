import React from 'react'
import YouTubePlayer from '../../../../components/VideoPlayer/YouTubePlayer'
import forms from '../styles/formControls.module.css'
import styles from './ConsequenceEditor.module.css'

/**
 * ConsequenceEditor
 * Only rendered for a risky choice. Lets an admin toggle whether this
 * choice's consequence is a video (choice.consequenceVideo present) or a
 * still-image placeholder (no consequenceVideo at all) — the exact two
 * modes ConsequencePlayer already supports — and, when a video, paste its
 * real YouTube URL. There is no separate "title" or "explanation" field
 * here: those ARE choice.feedbackTitle/feedbackText, edited once in
 * ChoiceEditor and reused by both the FeedbackPanel and the
 * ConsequencePlayer's explanation card.
 */
export default function ConsequenceEditor({ choice, onSetEnabled, onChangeVideoUrl }) {
  const hasVideo = Boolean(choice.consequenceVideo)

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
          <YouTubePlayer url={choice.consequenceVideo.videoUrl} title="Consequence video" />
          <div className={forms.fieldGroup} style={{ marginTop: 'var(--space-3)' }}>
            <label className={forms.fieldLabel} htmlFor={`${choice.id}-consequence-url`}>YouTube Video URL</label>
            <input
              id={`${choice.id}-consequence-url`}
              type="text"
              className={styles.urlInput}
              value={choice.consequenceVideo.videoUrl || ''}
              onChange={(e) => onChangeVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>
        </div>
      ) : (
        <p className={styles.note}>
          This choice shows the engine's generic warning placeholder — no consequence video configured.
        </p>
      )}
    </div>
  )
}
