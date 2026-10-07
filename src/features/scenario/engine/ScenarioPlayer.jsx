import React, { useState } from 'react'
import Icon from '../../../components/Icon/Icon'
import YouTubePlayer, { parseYouTubeId } from '../../../components/VideoPlayer/YouTubePlayer'
import styles from './ScenarioPlayer.module.css'

/**
 * ScenarioPlayer
 * Plays a scenario's intro clip when one is configured, or shows a
 * neutral poster card naming the scenario.
 *
 * Two behaviours, decided by whether a clip actually exists:
 *
 *  - No clip (every module until the videos are recorded): the engine
 *    moves straight past this after a short beat, so a scenario stays
 *    fully testable with nothing but the poster.
 *  - A clip: the engine holds here and this renders a Start Scenario
 *    button, disabled until the clip reports that it finished. YouTube's
 *    IFrame Player API is what reports that; a direct video file reports
 *    it natively. If the clip cannot be tracked at all (API blocked, or
 *    an unplayable video) the button unlocks instead of stranding the
 *    student: an unverifiable clip is a reason to trust them, not to
 *    trap them.
 *
 * `materialUrl` accepts either a YouTube link/id — the same format the
 * lesson video slot takes, so recording a clip and pasting its link into
 * Scenario Configuration is all that's needed — or a direct video file
 * URL, which plays inline via <video>.
 */
export default function ScenarioPlayer({
  videoAvailable,
  materialUrl,
  posterCaption,
  scenarioTitle,
  onStart,
  isReview = false,
}) {
  const [clipEnded, setClipEnded] = useState(false)
  const [trackingUnavailable, setTrackingUnavailable] = useState(false)
  const canStart = clipEnded || trackingUnavailable || isReview
  const videoRef = React.useRef(null)

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.defaultMuted = false
    video.muted = false
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // If unmuted autoplay without gesture is blocked, it stays unmuted with controls available
        console.warn('[ScenarioPlayer] Autoplay with audio waiting on user interaction:', err)
      })
    }
  }, [materialUrl])

  if (videoAvailable && materialUrl) {
    const youTubeId = parseYouTubeId(materialUrl)
    return (
      <div className={styles.clipWrap}>
        <div className={styles.videoWrap}>
          {youTubeId ? (
            /* autoplay unconditionally on this path: the engine shows
               this player for a 300ms loading beat before the clip's own
               hold begins, and tying autoplay to that transition would
               rewrite the iframe src mid-mount, reloading the embed. */
            <YouTubePlayer
              videoId={youTubeId}
              title={scenarioTitle}
              autoplay
              onEnded={() => setClipEnded(true)}
              onTrackingUnavailable={() => setTrackingUnavailable(true)}
            />
          ) : (
            <video
              ref={videoRef}
              className={styles.video}
              src={materialUrl}
              autoPlay
              playsInline
              controls
              onEnded={() => setClipEnded(true)}
              onError={() => setTrackingUnavailable(true)}
            />
          )}
        </div>

        {onStart && (
          <div className={styles.startRow}>
            <p className={styles.startNote}>
              {isReview
                ? "Reviewing scene setup. Watch through or proceed when you're ready."
                : canStart
                  ? "That's the setup. Go in when you're ready."
                  : "Watch the clip through first. It sets up what you're walking into."}
            </p>
            <button
              type="button"
              className={styles.startBtn}
              onClick={onStart}
              disabled={!canStart}
            >
              {isReview && !clipEnded ? 'Skip to Scenario →' : 'Start Scenario →'}
            </button>
          </div>
        )}
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
