import React from 'react'
import styles from './DecisionOverlay.module.css'

/**
 * DecisionOverlay
 * Shown the moment a scenario's video pauses. Renders 2-3 choice buttons
 * from `choices` — no choice text, count, or ordering is assumed beyond
 * what the config provides.
 */
export default function DecisionOverlay({ choices, onSelect }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.prompt}>What should you do?</p>
        <div className={styles.choices}>
          {choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={styles.choiceBtn}
              onClick={() => onSelect(choice.id)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
