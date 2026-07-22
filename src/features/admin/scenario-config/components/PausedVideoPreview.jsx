import React from 'react'
import styles from './PausedVideoPreview.module.css'

/**
 * PausedVideoPreview
 * A static illustration of "the video paused at pauseTimestamp" for the
 * admin preview. Deliberately NOT the engine's real ScenarioPlayer —
 * that component runs real intervals/timers meant for an actual student
 * session, which would be wrong to trigger from a static admin form.
 * This shows the same visual language (dark frame, placeholder icon,
 * progress fill) sized to the *configured* pause ratio instead.
 */
export default function PausedVideoPreview({ video, pauseTimestamp }) {
  const pct = video.duration > 0 ? Math.min(100, (Number(pauseTimestamp || 0) / video.duration) * 100) : 0

  return (
    <div className={styles.wrap}>
      <span className={styles.icon} aria-hidden="true">🎬</span>
      <p className={styles.label}>Video paused for decision</p>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.time}>
        {pauseTimestamp || 0}s / {video.duration}s
      </span>
    </div>
  )
}
