import React from 'react'
import Icon from '../../../components/Icon/Icon'
import YouTubePlayer, { parseYouTubeId } from '../../../components/VideoPlayer/YouTubePlayer'
import styles from './FeedbackPanel.module.css'

const RETRY_LOCK_SECONDS = 5

/**
 * FeedbackPanel
 * The explanatory word after a decision resolves — safe choices get a
 * "Continue" into the next scenario, risky choices get "Try Again"
 * (which the engine routes back to paused_interactive at the same
 * pause point, never back to the start of the clip). After 3 risky
 * attempts on the same scenario, this expands into a longer guided
 * explanation instead of repeating the same short line — there are no
 * dead ends, the student always reaches the safe choice eventually,
 * on their own click.
 *
 * A risky choice also leads with a consequence clip (via
 * `consequenceVideoUrl`, same formats as a scenario's own `materialUrl`);
 * with nothing recorded yet, YouTubePlayer's own placeholder card stands
 * in. "Try Again" stays disabled for RETRY_LOCK_SECONDS after the panel
 * mounts — long enough to actually look at the clip/explanation before
 * retrying — then unlocks on its own; nothing auto-closes the panel.
 *
 * A safely-resolved scenario may also carry a `postCompletionReflection`
 * in its config — a closing note shown only here, only once the scenario
 * is actually done, never mid-scenario. Config-driven and optional so
 * this stays generic across every module instead of hardcoding any one
 * scenario's copy into this shared component.
 *
 * The "First try" ribbon marks a safe call made with no risky attempts
 * behind it. It is the only place in a run where doing well is
 * acknowledged in the moment rather than tallied at the end, and it costs
 * nothing to a student who needed a second go — they simply don't see it,
 * rather than seeing a marker saying they missed it.
 */
export default function FeedbackPanel({ choice, scenario, attemptCount, onRetry, onContinue }) {
  const isSafe = choice.isSafeChoice
  const guided = !isSafe && attemptCount >= 3
  const reflection = isSafe ? scenario?.postCompletionReflection : null
  const firstTry = isSafe && attemptCount === 0
  const btnRef = React.useRef(null)

  const videoUrl = choice.consequenceVideoUrl || ''
  const youTubeId = parseYouTubeId(videoUrl)

  const [lockSecondsLeft, setLockSecondsLeft] = React.useState(isSafe ? 0 : RETRY_LOCK_SECONDS)

  React.useEffect(() => {
    if (lockSecondsLeft <= 0) return undefined
    const t = setTimeout(() => setLockSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [lockSecondsLeft])

  React.useEffect(() => {
    // Only steal focus once the button is actually clickable, so a
    // keyboard/screen-reader user isn't dropped onto a disabled control.
    if (lockSecondsLeft === 0) btnRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockSecondsLeft === 0])

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-live="polite">
      <div className={[styles.panel, isSafe ? styles.safe : styles.risky].join(' ')}>
        {firstTry && (
          <span className={styles.firstTry}>
            <Icon name="target" size={13} />
            First try
          </span>
        )}

        {!isSafe && (
          <div className={styles.videoWrap}>
            {videoUrl && !youTubeId ? (
              <video className={styles.video} src={videoUrl} autoPlay muted playsInline controls />
            ) : (
              <YouTubePlayer videoId={youTubeId} title={choice.outcomeTitle} />
            )}
          </div>
        )}

        <span className={styles.icon} data-tone={isSafe ? 'safe' : 'risky'} aria-hidden="true">
          <Icon name={isSafe ? 'check' : 'alert'} size={26} strokeWidth={1.7} />
        </span>
        <h3 className={styles.title}>{choice.outcomeTitle}</h3>
        <p className={styles.text}>{choice.feedbackText}</p>

        {reflection && <p className={styles.reflection}>{reflection}</p>}

        {guided && (
          <div className={styles.guidedHint}>
            <Icon name="sparkle" size={15} />
            Look for the highlighted element. That's the safer move here.
          </div>
        )}

        {isSafe ? (
          <button ref={btnRef} type="button" className={styles.primaryBtn} onClick={onContinue}>
            Continue
          </button>
        ) : (
          <button
            ref={btnRef}
            type="button"
            className={styles.primaryBtn}
            onClick={onRetry}
            disabled={lockSecondsLeft > 0}
          >
            {lockSecondsLeft > 0 ? `Try Again (${lockSecondsLeft}s)` : 'Try Again'}
          </button>
        )}
      </div>
    </div>
  )
}
