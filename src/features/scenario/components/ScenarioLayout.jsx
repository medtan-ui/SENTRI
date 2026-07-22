import React from 'react'
import ScenarioProgress from './ScenarioProgress'
import styles from './ScenarioLayout.module.css'

/**
 * ScenarioLayout
 * The outer shell every engine state renders inside: a header (module
 * title + progress) and a content area for whatever ScenarioEngine
 * decides to show there (intro card, device frame, or ScenarioComplete).
 * Purely structural — carries no state-machine logic itself.
 */
export default function ScenarioLayout({ title, progress, children }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {progress ? (
          <ScenarioProgress
            total={progress.total}
            currentIndex={progress.currentIndex}
            completedCount={progress.completedCount}
          />
        ) : null}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
