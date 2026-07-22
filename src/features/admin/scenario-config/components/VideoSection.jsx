import React, { useState } from 'react'
import badges from '../styles/badges.module.css'
import forms from '../styles/formControls.module.css'
import styles from './VideoSection.module.css'

/**
 * VideoSection
 * Read-only video metadata plus the one truly editable field that
 * affects playback: pauseTimestamp. Replace/Preview/Remove are mock-only
 * — there is no real upload pipeline yet, so they only show a transient
 * notice rather than doing nothing silently.
 */
export default function VideoSection({ video, pauseTimestamp, pauseError, onChangePauseTimestamp }) {
  const [notice, setNotice] = useState('')

  function mockAction(label) {
    setNotice(`${label} — mock action, no backend connected yet.`)
    setTimeout(() => setNotice(''), 2500)
  }

  return (
    <div className={styles.wrap}>
      <h4 className={styles.heading}>Video</h4>

      <div className={styles.frame}>
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" className={styles.thumbnail} />
        ) : (
          <span className={styles.frameIcon} aria-hidden="true">🎬</span>
        )}
        <span className={styles.frameLabel}>Placeholder video</span>
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

        <div className={styles.metaItem}>
          <span className={forms.fieldLabel}>Video Available</span>
          <span className={`${badges.pill} ${video.videoAvailable ? badges.available : badges.placeholderStatus}`}>
            {video.videoAvailable ? 'Yes' : 'Not yet'}
          </span>
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

      <div className={styles.actions}>
        <button type="button" className={styles.actionBtn} onClick={() => mockAction('Replace Video')}>
          Replace Video
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => mockAction('Preview')}>
          Preview
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => mockAction('Remove Placeholder')}>
          Remove Placeholder
        </button>
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}
    </div>
  )
}
