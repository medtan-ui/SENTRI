import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULE_STATUS } from '../../services/moduleProgressService'
import Icon from '../Icon/Icon'
import Tooltip from '../Tooltip/Tooltip'
import styles from './ModuleGrid.module.css'

/**
 * The arrow is no longer baked into these strings. It used to be, which
 * meant any caller that added its own arrow icon (the dashboard hero
 * does) rendered "Continue → →". The label is text; the direction cue is
 * an icon, added by whoever renders the button.
 */
export const MODULE_STATUS_META = {
  [MODULE_STATUS.LOCKED]: { label: 'Locked', cta: null },
  [MODULE_STATUS.AVAILABLE]: { label: 'Available', cta: 'Start module' },
  [MODULE_STATUS.IN_PROGRESS]: { label: 'In Progress', cta: 'Continue' },
  [MODULE_STATUS.QUIZ_AVAILABLE]: { label: 'Quiz Available', cta: 'Take quiz' },
  [MODULE_STATUS.COMPLETED]: { label: 'Completed', cta: 'Review' },
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

        // The card's main button always points at the next step, which
        // for a student mid-module is the simulation or the quiz. That
        // left no way back to the reading they are being quizzed on, so
        // a module whose lesson is done and whose button points
        // elsewhere gets a second, quieter way in.
        const lessonPath = `/student/modules/${m.moduleId}`
        const canRereadLesson = !locked && Boolean(m.progress?.lessonCompleted) && destination !== lessonPath

        return (
          <div key={m.moduleId} className={styles.moduleCard} data-locked={locked}>
            <div className={styles.moduleCardHeader}>
              {/* The module's own icon is authored content (an admin
                  picks it per module in Module Configuration) and stays
                  as-is. A locked module shows the app's lock glyph
                  instead, in muted grey, so "locked" reads as a state of
                  the card rather than as the module's identity. */}
              <span
                className={styles.moduleIconTile}
                style={locked ? undefined : { background: `${m.color}18`, color: m.color }}
                data-locked={locked || undefined}
                aria-hidden="true"
              >
                {locked ? <Icon name="lock" size={19} /> : m.icon}
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
                {locked ? (
                  'Locked'
                ) : (
                  <>
                    {meta.cta}
                    <Icon name="arrowRight" size={15} />
                  </>
                )}
              </button>
            </Tooltip>

            {canRereadLesson && (
              <button
                type="button"
                className={styles.moduleSecondary}
                onClick={() => navigate(lessonPath)}
              >
                Read the lesson again
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
