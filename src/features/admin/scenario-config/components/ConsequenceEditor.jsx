import React from 'react'
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
 * `consequence_type` picks the illustrative icon the overlay falls back
 * to; `feedback_media_url` replaces that icon with a real image once one
 * exists. There is no separate title or body field here: those ARE the
 * choice's outcome_title/feedback_text, edited once in ChoiceEditor and
 * reused by both the overlay and the feedback panel.
 */
export default function ConsequenceEditor({ choice, error, onUpdate }) {
  const id = choice.scenario_choice_id
  const mediaUrl = choice.feedback_media_url || ''

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.heading}>Consequence</span>
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${id}-consequence_type`}>Consequence Type</label>
        <select
          id={`${id}-consequence_type`}
          className={`${styles.select} ${error ? forms.textareaError : ''}`}
          value={choice.consequence_type}
          onChange={(e) => onUpdate({ consequence_type: e.target.value })}
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
        <label className={forms.fieldLabel} htmlFor={`${id}-feedback_media_url`}>
          Consequence Image URL <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id={`${id}-feedback_media_url`}
          type="text"
          className={styles.urlInput}
          value={mediaUrl}
          onChange={(e) => onUpdate({ feedback_media_url: e.target.value || null })}
          placeholder="Leave empty to use the illustrative icon"
        />
      </div>

      {mediaUrl ? (
        <img className={styles.mediaPreview} src={mediaUrl} alt="" />
      ) : (
        <p className={styles.note}>
          No image set, so the consequence beat shows the icon for “
          {CONSEQUENCE_TYPE_LABELS[choice.consequence_type] || choice.consequence_type}”.
        </p>
      )}
    </div>
  )
}
