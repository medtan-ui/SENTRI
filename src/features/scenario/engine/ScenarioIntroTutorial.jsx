import React from 'react'
import Icon from '../../../components/Icon/Icon'
import InteractionDemo from './InteractionDemo'
import styles from './ScenarioIntroTutorial.module.css'

const TIPS = [
  { icon: 'check', text: 'Read each screen before you act. Nothing advances until you choose.' },
  { icon: 'cursor', text: 'Buttons and fields with a gold glow are the ones you can click or type into.' },
  { icon: 'alert', text: 'Watch for urgency and pressure. That is usually the risky choice.' },
]

/**
 * ScenarioIntroTutorial
 * A short, game-like "how to play" screen shown once before a module's
 * interactive scenario starts. `onContinue` moves past this screen;
 * nothing here talks to Firestore or the real scenario engine.
 *
 * This is also where the "nothing bad actually happens if you pick wrong"
 * reassurance lives now. It used to be a banner on the dashboard, which
 * meant students read it several clicks and possibly several days before
 * it was relevant. Here it is the last thing read before the first
 * decision.
 */
export default function ScenarioIntroTutorial({ moduleTitle, onContinue }) {
  return (
    <div className={styles.overlay} role="dialog" aria-label="How interactive scenarios work">
      <div className={styles.card}>
        <span className={styles.eyebrow}>Interactive scenario{moduleTitle ? ` · ${moduleTitle}` : ''}</span>
        <h2 className={styles.headline}>You're about to enter an interactive scenario</h2>
        <p className={styles.subtext}>
          This works just like a real app. Click the buttons and fill in the fields to make your choice, watch the
          quick demo below to see how. Nothing bad actually happens if you pick wrong, that is how you learn.
        </p>

        <div className={styles.demoWrap}>
          <InteractionDemo />
        </div>

        <ul className={styles.tipList}>
          {TIPS.map((t) => (
            <li key={t.text} className={styles.tipItem}>
              <Icon name={t.icon} size={15} />
              <span>{t.text}</span>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button type="button" className={styles.startBtn} onClick={onContinue}>
            Got it, let's start
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
