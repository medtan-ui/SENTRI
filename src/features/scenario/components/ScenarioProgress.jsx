import React from 'react'
import styles from './ScenarioProgress.module.css'

/**
 * ScenarioProgress
 * "Scenario X of N" plus a step-dot row showing completed / current /
 * upcoming scenarios. Purely presentational — every number comes from
 * the engine, nothing here is module-specific.
 */
export default function ScenarioProgress({ total, currentIndex, completedCount = 0 }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>
        Scenario {Math.min(currentIndex + 1, total)} of {total}
      </span>
      <div className={styles.dots}>
        {Array.from({ length: total }).map((_, i) => {
          const isCompleted = i < completedCount
          const isCurrent = i === currentIndex && !isCompleted
          return (
            <span
              key={i}
              className={[
                styles.dot,
                isCompleted ? styles.dotCompleted : '',
                isCurrent ? styles.dotCurrent : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={isCompleted ? `Scenario ${i + 1} completed` : `Scenario ${i + 1}`}
            />
          )
        })}
      </div>
    </div>
  )
}
