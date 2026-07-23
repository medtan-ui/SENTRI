import React from 'react'
import YouTubePlayer from '../../../../components/VideoPlayer/YouTubePlayer'
import badges from '../styles/badges.module.css'
import forms from '../styles/formControls.module.css'
import styles from './VideoSection.module.css'

/**
 * VideoSection
 * The scenario's video: a real YouTube URL field (paste a link, done —
 * videoAvailable is derived automatically from whether it's non-empty)
 * plus the pauseTimestamp field that affects playback. Replaces what used
 * to be three "mock action" buttons with no real effect.
 */
export default function VideoSection({ video, pauseTimestamp, pauseError, onChangePauseTimestamp, onChangeVideoUrl }) {
  return (
    <div className={styles.wrap}>
      <h4 className={styles.heading}>Video</h4>

      <YouTubePlayer url={video.videoUrl} title="Scenario video" />

      <div className={forms.fieldGroup} style={{ marginTop: 'var(--space-4)' }}>
        <label className={forms.fieldLabel} htmlFor="videoUrl">YouTube Video URL</label>
        <input
          id="videoUrl"
          type="text"
          className={styles.urlInput}
          value={video.videoUrl || ''}
          onChange={(e) => onChangeVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={forms.fieldLabel}>Video Status</span>
          <span className={`${badges.pill} ${video.videoAvailable ? badges.available : badges.placeholderStatus}`}>
            {video.videoAvailable ? 'Available' : 'Placeholder'}
          </span>
        </div>

        <div className={styles.metaItem}>
          <span className={forms.fieldLabel}>Duration</span>
          <span className={styles.metaValue}>{video.duration}s</span>
        </div>

        <div className={forms.fieldGroup}>
          <label className={forms.fieldLabel} htmlFor="pauseTimestamp">Pause Timestamp (seconds)</label>
          <input
            id="pauseTimestamp"
            type="number"
            min={0}
            className={`${styles.numberInput} ${pauseError ? forms.textareaError : ''}`}
            value={pauseTimestamp}
            onChange={(e) => onChangePauseTimestamp(e.target.value === '' ? '' : Number(e.target.value))}
          />
          {pauseError && <span className={forms.errorText}>{pauseError}</span>}
        </div>
      </div>
    </div>
  )
}
