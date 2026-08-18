import React from 'react'
import YouTubePlayer from '../../../../components/VideoPlayer/YouTubePlayer'
import { CONSEQUENCE_TYPES, CONSEQUENCE_TYPE_LABELS } from '../types/scenarioConfigAdmin.types'
import forms from '../styles/formControls.module.css'
import styles from './ConsequenceEditor.module.css'

/**
 * ConsequenceEditor
 * Only rendered for a risky choice. Configures the dramatic beat the
 * engine shows before the explanatory feedback panel — see
 * src/features/scenario/engine/ConsequenceOverlay.jsx, which is what
 * actually renders this.
 *
 * `consequenceType` picks the illustrative icon the overlay falls back
 * to; `feedbackMediaUrl` replaces that icon with a real image once one
 * exists. There is no separate title or body field here: those ARE the
 * choice's outcomeTitle/feedbackText, edited once in ChoiceEditor and
 * reused by both the overlay and the feedback panel.
 *
 * `consequenceVideoUrl` is the clip the feedback panel leads with after
 * this risky choice — src/features/scenario/engine/FeedbackPanel.jsx.
 * Paste a YouTube link (or a direct video file URL) and it plays for
 * students on their next run; leave it empty and they get the placeholder
 * card, exactly as they do today. Same paste-only contract as a
 * scenario's own Material URL in VideoSection.
 */
export default function ConsequenceEditor({ choice, error, onUpdate }) {
  const id = choice.scenarioChoiceId
  const mediaUrl = choice.feedbackMediaUrl || ''
  const videoUrl = choice.consequenceVideoUrl || ''

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.heading}>Consequence</span>
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${id}-consequenceType`}>Consequence Type</label>
        <select
          id={`${id}-consequenceType`}
          className={`${styles.select} ${error ? forms.textareaError : ''}`}
          value={choice.consequenceType}
          onChange={(e) => onUpdate({ consequenceType: e.target.value })}
        >
          {CONSEQUENCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {CONSEQUENCE_TYPE_LABELS[type] || type}
            </option>
          ))}
        </select>
        {error && <span className={forms.errorText}>{error}</span>}
      </div>

      <div className={forms.fieldGroup} style={{ marginTop: 'var(--space-3)' }}>
        <label className={forms.fieldLabel} htmlFor={`${id}-feedbackMediaUrl`}>
          Consequence Image URL <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id={`${id}-feedbackMediaUrl`}
          type="text"
          className={styles.urlInput}
          value={mediaUrl}
          onChange={(e) => onUpdate({ feedbackMediaUrl: e.target.value || null })}
          placeholder="Leave empty to use the illustrative icon"
        />
      </div>

      {mediaUrl ? (
        <img className={styles.mediaPreview} src={mediaUrl} alt="" />
      ) : (
        <p className={styles.note}>
          No image set, so the consequence beat shows the icon for “
          {CONSEQUENCE_TYPE_LABELS[choice.consequenceType] || choice.consequenceType}”.
        </p>
      )}

      <div className={forms.fieldGroup} style={{ marginTop: 'var(--space-4)' }}>
        <label className={forms.fieldLabel} htmlFor={`${id}-consequenceVideoUrl`}>
          Consequence Clip URL <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id={`${id}-consequenceVideoUrl`}
          type="text"
          className={styles.urlInput}
          value={videoUrl}
          onChange={(e) => onUpdate({ consequenceVideoUrl: e.target.value || null })}
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </div>

      <div className={styles.videoPreview}>
        <YouTubePlayer url={videoUrl} title="Consequence clip" />
      </div>
    </div>
  )
}
