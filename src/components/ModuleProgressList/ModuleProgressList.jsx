import React from 'react'
import { moduleProgressPct } from '../ModuleGrid/ModuleGrid'
import styles from './ModuleProgressList.module.css'

/**
 * ModuleProgressList
 * One progress bar per module — shared by the Dashboard's "Module
 * Progress" panel and the standalone Progress page.
 *
 * @param {{ modules: object[] }} props  Shape from useStudentModules().
 */
export default function ModuleProgressList({ modules }) {
  return (
    <>
      {modules.map((m) => {
        const pct = moduleProgressPct(m.status, m.progress)
        return (
          <div key={m.moduleId} className={styles.progressRow}>
            <div className={styles.progressHeader}>
              <span className={styles.progressName}>{m.title}</span>
              <span className={styles.progressPct}>{pct}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${pct}%`, background: pct === 100 ? 'var(--color-success)' : 'var(--color-gold)' }}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
