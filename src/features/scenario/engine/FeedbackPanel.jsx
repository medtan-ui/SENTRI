import React from 'react'
import Icon from '../../../components/Icon/Icon'
import styles from './FeedbackPanel.module.css'

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
  const isSafe = choice.is_safe_choice
  const guided = !isSafe && attemptCount >= 3
  const reflection = isSafe ? scenario?.postCompletionReflection : null
  const firstTry = isSafe && attemptCount === 0
  const btnRef = React.useRef(null)

  React.useEffect(() => {
    btnRef.current?.focus()
  }, [])

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-live="polite">
      <div className={[styles.panel, isSafe ? styles.safe : styles.risky].join(' ')}>
        {firstTry && (
          <span className={styles.firstTry}>
            <Icon name="target" size={13} />
            First try
          </span>
        )}

        <span className={styles.icon} data-tone={isSafe ? 'safe' : 'risky'} aria-hidden="true">
          <Icon name={isSafe ? 'check' : 'alert'} size={26} strokeWidth={1.7} />
        </span>
        <h3 className={styles.title}>{choice.outcome_title}</h3>
        <p className={styles.text}>{choice.feedback_text}</p>

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
          <button ref={btnRef} type="button" className={styles.primaryBtn} onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
