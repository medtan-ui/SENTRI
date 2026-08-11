import React from 'react'
import Icon from '../../../components/Icon/Icon'
import YouTubePlayer, { parseYouTubeId } from '../../../components/VideoPlayer/YouTubePlayer'
import styles from './ConsequenceVideo.module.css'

/**
 * ConsequenceVideo
 * The clip that plays the first time a risky choice lands, before the
 * consequence text box explains it. Same idea as the scenario's own intro
 * clip in ScenarioPlayer: the video sets up what just happened, the words
 * follow.
 *
 * Shown once per risky choice per run — the engine tracks that in
 * useScenarioEngine and routes straight to ConsequenceOverlay on every
 * later attempt, so a student retrying the same wrong move sees only the
 * text box, exactly as before this beat existed. Leaving the runner and
 * coming back starts a fresh run, so the clip is watchable again.
 *
 * `consequenceVideoUrl` takes the same formats as a scenario's
 * `materialUrl` — a YouTube link/id, or a direct video file URL. With
 * nothing set, YouTubePlayer's own placeholder card stands in, which is
 * the state every module is in until clips are recorded.
 */
export default function ConsequenceVideo({ choice, onContinue }) {
  const btnRef = React.useRef(null)
  const url = choice.consequenceVideoUrl || ''
  const youTubeId = parseYouTubeId(url)

  React.useEffect(() => {
    btnRef.current?.focus()
  }, [])

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-live="polite">
      <div className={styles.panel}>
        <span className={styles.label}>
          <Icon name="play" size={13} />
          What just happened
        </span>

        <div className={styles.videoWrap}>
          {url && !youTubeId ? (
            <video className={styles.video} src={url} autoPlay muted playsInline controls />
          ) : (
            <YouTubePlayer videoId={youTubeId} title={choice.outcomeTitle} />
          )}
        </div>

        <button ref={btnRef} type="button" className={styles.continueBtn} onClick={onContinue}>
          Continue →
        </button>
      </div>
    </div>
  )
}
