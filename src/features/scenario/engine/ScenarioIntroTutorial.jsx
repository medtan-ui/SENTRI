import React from 'react'
import InteractionDemo from './InteractionDemo'
import styles from './ScenarioIntroTutorial.module.css'

const TIPS = [
  { icon: '✅', text: 'Read each screen before you act. Nothing advances until you choose.' },
  { icon: '🖱️', text: 'Buttons and fields with a gold glow are the ones you can click or type into.' },
  { icon: '⚠️', text: 'Watch for urgency and pressure. That is usually the risky choice.' },
]

/**
 * ScenarioIntroTutorial
 * A short, game-like "how to play" screen shown once before a module's
 * interactive scenario starts. `onContinue` moves past this screen;
 * nothing here talks to Firestore or the real scenario engine.
 */
export default function ScenarioIntroTutorial({ moduleTitle, onContinue }) {
  return (
    <div className={styles.overlay} role="dialog" aria-label="How interactive scenarios work">
      <div className={styles.card}>
        <span className={styles.eyebrow}>🎮 Interactive Scenario{moduleTitle ? ` · ${moduleTitle}` : ''}</span>
        <h2 className={styles.headline}>You're about to enter an interactive scenario!</h2>
        <p className={styles.subtext}>
          This works just like a real app. Click the buttons and fill in the fields to make your choice, watch the
          quick demo below to see how.
        </p>

        <div className={styles.demoWrap}>
          <InteractionDemo />
        </div>

        <ul className={styles.tipList}>
          {TIPS.map((t) => (
            <li key={t.text} className={styles.tipItem}>
              <span aria-hidden="true">{t.icon}</span> {t.text}
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button type="button" className={styles.startBtn} onClick={onContinue}>
            Got it, let's start →
          </button>
        </div>
      </div>
    </div>
  )
}
