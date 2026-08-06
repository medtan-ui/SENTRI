import React from 'react'
import YouTubePlayer from '../../../../components/VideoPlayer/YouTubePlayer'
import badges from '../styles/badges.module.css'
import forms from '../styles/formControls.module.css'
import styles from './VideoSection.module.css'

/**
 * VideoSection
 * The scenario's opening clip and the poster shown in its place until one
 * exists. Both feed src/features/scenario/engine/ScenarioPlayer.jsx
 * directly: paste a YouTube link (or a direct video file URL) into
 * Material URL and it plays for students on their next run — no code
 * change, which is the whole point of keeping this field editable.
 *
 * `videoAvailable` is derived from whether a URL is present rather than
 * being a separate switch an admin can leave out of sync with reality.
 */
export default function VideoSection({ scenario, errors, onUpdate }) {
  const materialUrl = scenario.materialUrl || ''
  const captionError = errors.find((e) => e.field === 'posterCaption')?.message || ''

  return (
    <div className={styles.wrap}>
      <h4 className={styles.heading}>Opening Clip</h4>

      <YouTubePlayer url={materialUrl} title="Scenario clip" />

      <div className={forms.fieldGroup} style={{ marginTop: 'var(--space-4)' }}>
        <label className={forms.fieldLabel} htmlFor={`${scenario.scenarioId}-materialUrl`}>
          Material URL (YouTube link or video file)
        </label>
        <input
          id={`${scenario.scenarioId}-materialUrl`}
          type="text"
          className={styles.urlInput}
          value={materialUrl}
          onChange={(e) => {
            const value = e.target.value
            onUpdate({ materialUrl: value || null, videoAvailable: Boolean(value.trim()) })
          }}
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </div>

      <div className={forms.fieldGroup} style={{ marginTop: 'var(--space-3)' }}>
        <label className={forms.fieldLabel} htmlFor={`${scenario.scenarioId}-posterCaption`}>
          Poster Caption <span className={styles.hint}>(shown while the scene loads, and in place of a missing clip)</span>
        </label>
        <input
          id={`${scenario.scenarioId}-posterCaption`}
          type="text"
          className={`${styles.urlInput} ${captionError ? forms.textareaError : ''}`}
          value={scenario.posterCaption || ''}
          onChange={(e) => onUpdate({ posterCaption: e.target.value })}
        />
        {captionError && <span className={forms.errorText}>{captionError}</span>}
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={forms.fieldLabel}>Clip Status</span>
          <span
            className={`${badges.pill} ${scenario.videoAvailable ? badges.available : badges.placeholderStatus}`}
          >
            {scenario.videoAvailable ? 'Available' : 'Poster only'}
          </span>
        </div>
      </div>
    </div>
  )
}
