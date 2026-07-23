import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULE_STATUS } from '../../services/moduleProgressService'
import Tooltip from '../Tooltip/Tooltip'
import styles from './ModuleGrid.module.css'

export const MODULE_STATUS_META = {
  [MODULE_STATUS.LOCKED]: { label: 'Locked', cta: null },
  [MODULE_STATUS.AVAILABLE]: { label: 'Available', cta: 'Start Module →' },
  [MODULE_STATUS.IN_PROGRESS]: { label: 'In Progress', cta: 'Continue →' },
  [MODULE_STATUS.QUIZ_AVAILABLE]: { label: 'Quiz Available', cta: 'Take Quiz →' },
  [MODULE_STATUS.COMPLETED]: { label: 'Completed', cta: 'Review →' },
}

/** Shared by ModuleGrid and ModuleProgressList so both pages agree on what "50% done" means. */
export function moduleProgressPct(status, progress) {
  if (status === MODULE_STATUS.LOCKED || !progress) return 0
  if (progress.moduleCompleted) return 100
  if (progress.simulationCompleted) return 75
  if (progress.lessonCompleted) return 50
  if (progress.lessonStarted) return 25
  return 0
}

export function moduleDestination(m) {
  switch (m.status) {
    case MODULE_STATUS.LOCKED:
      return null
    case MODULE_STATUS.QUIZ_AVAILABLE:
      return `/student/modules/${m.moduleId}/quiz`
    case MODULE_STATUS.IN_PROGRESS:
      return m.progress?.lessonCompleted
        ? `/student/modules/${m.moduleId}/scenario`
        : `/student/modules/${m.moduleId}`
    case MODULE_STATUS.COMPLETED:
    case MODULE_STATUS.AVAILABLE:
    default:
      return `/student/modules/${m.moduleId}`
  }
}

/**
 * ModuleGrid
 * The curriculum card grid — one card per module, showing lock state,
 * progress, and a call to action. Shared by the Dashboard's "Your
 * Modules" section and the standalone Modules directory page so the
 * markup/behavior only exists once.
 *
 * @param {{ modules: object[] }} props  Shape from useStudentModules().
 */
export default function ModuleGrid({ modules }) {
  const navigate = useNavigate()

  return (
    <div className={styles.moduleGrid}>
      {modules.map((m) => {
        const locked = m.status === MODULE_STATUS.LOCKED
        const pct = moduleProgressPct(m.status, m.progress)
        const meta = MODULE_STATUS_META[m.status]
        const destination = moduleDestination(m)

        return (
          <div key={m.moduleId} className={styles.moduleCard} data-locked={locked}>
            <div className={styles.moduleCardHeader}>
              <span
                className={styles.moduleIconTile}
                style={{ background: `${m.color}18`, color: m.color }}
                aria-hidden="true"
              >
                {locked ? '🔒' : m.icon}
              </span>
              <span className={styles.moduleStatusBadge} data-status={m.status.toLowerCase()}>
                {meta.label}
              </span>
            </div>

            <h3 className={styles.moduleCardTitle}>{m.title}</h3>
            <p className={styles.moduleCardDescription}>{m.description}</p>

            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${pct}%`, background: pct === 100 ? 'var(--color-success)' : 'var(--color-gold)' }}
              />
            </div>
            <span className={styles.moduleCardPct}>{pct}% complete</span>

            <Tooltip label={locked ? 'Complete the previous module to unlock this one' : null} fullWidth>
              <button
                type="button"
                className={styles.moduleCta}
                disabled={locked}
                onClick={() => destination && navigate(destination)}
              >
                {locked ? 'Locked' : meta.cta}
              </button>
            </Tooltip>
          </div>
        )
      })}
    </div>
  )
}
