import React from 'react'
import styles from './ScenarioPlayer.module.css'

/**
 * ScenarioPlayer
 * Plays `material_url` when a scenario's clip is ready, or — for now,
 * since videoAvailable is false everywhere — shows a neutral poster
 * card naming the scenario. This never blocks interaction: the engine
 * moves straight from showing the poster into the paused_interactive
 * state after a short beat, whether or not a real clip exists.
 */
export default function ScenarioPlayer({ videoAvailable, materialUrl, posterCaption, scenarioTitle }) {
  if (videoAvailable && materialUrl) {
    return (
      <div className={styles.videoWrap}>
        <video className={styles.video} src={materialUrl} autoPlay muted playsInline />
      </div>
    )
  }

  return (
    <div className={styles.poster}>
      <span className={styles.posterIcon} aria-hidden="true">🎬</span>
      <h3 className={styles.posterTitle}>{scenarioTitle}</h3>
      {posterCaption && <p className={styles.posterCaption}>{posterCaption}</p>}
    </div>
  )
}
