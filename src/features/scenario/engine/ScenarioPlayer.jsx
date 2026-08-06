import React from 'react'
import Icon from '../../../components/Icon/Icon'
import YouTubePlayer, { parseYouTubeId } from '../../../components/VideoPlayer/YouTubePlayer'
import styles from './ScenarioPlayer.module.css'

/**
 * ScenarioPlayer
 * Plays a scenario's intro clip when one is configured, or shows a
 * neutral poster card naming the scenario. This never blocks
 * interaction: the engine moves straight from showing the poster into
 * the paused_interactive state after a short beat, whether or not a real
 * clip exists.
 *
 * `materialUrl` accepts either a YouTube link/id — the same format the
 * lesson video slot takes, so recording a clip and pasting its link into
 * Scenario Configuration is all that's needed — or a direct video file
 * URL, which plays inline via <video>.
 */
export default function ScenarioPlayer({ videoAvailable, materialUrl, posterCaption, scenarioTitle }) {
  if (videoAvailable && materialUrl) {
    const youTubeId = parseYouTubeId(materialUrl)
    if (youTubeId) {
      return (
        <div className={styles.videoWrap}>
          <YouTubePlayer videoId={youTubeId} title={scenarioTitle} />
        </div>
      )
    }
    return (
      <div className={styles.videoWrap}>
        <video className={styles.video} src={materialUrl} autoPlay muted playsInline />
      </div>
    )
  }

  return (
    <div className={styles.poster}>
      <span className={styles.posterIcon} aria-hidden="true"><Icon name="play" size={26} strokeWidth={1.6} /></span>
      <h3 className={styles.posterTitle}>{scenarioTitle}</h3>
      {posterCaption && <p className={styles.posterCaption}>{posterCaption}</p>}
    </div>
  )
}
