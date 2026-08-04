import React from 'react'
import Icon from '../../../components/Icon/Icon'
import styles from './ScenarioProgress.module.css'

/**
 * ScenarioProgress
 * The run's HUD: which scene you're on, which ones are behind you, and
 * how many you called correctly first time.
 *
 * The step row used to be flat dots that only distinguished "done" from
 * "not done". Segments make the current position readable at a glance
 * from across a classroom, which matters here specifically because the
 * scenario stage below is deliberately dressed up as somebody else's
 * inbox or browser — without a clear frame around it, a student can lose
 * track of whether they are two scenes in or nearly finished.
 *
 * `cleanCalls` is the engagement piece. Every student reaches the end
 * regardless of how many attempts it takes (by design, the engine never
 * dead-ends anyone), so completion alone can't be a score. "Called right
 * first time" can be, and it is the thing worth replaying for. It only
 * appears once there is one to show, so a student who is struggling
 * isn't handed a zero to stare at.
 *
 * @param {{ total: number, currentIndex: number, completedCount?: number,
 *   cleanCalls?: number }} props
 */
export default function ScenarioProgress({ total, currentIndex, completedCount = 0, cleanCalls = 0 }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>
        Scene <strong>{Math.min(currentIndex + 1, total)}</strong> of {total}
      </span>

      <div className={styles.steps} aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => {
          const isCompleted = i < completedCount
          const isCurrent = i === currentIndex && !isCompleted
          return (
            <span
              key={i}
              className={styles.step}
              data-state={isCompleted ? 'done' : isCurrent ? 'current' : 'upcoming'}
            />
          )
        })}
      </div>
      <span className="sr-only">
        {completedCount} of {total} scenes completed.
      </span>

      {cleanCalls > 0 && (
        <span className={styles.cleanCalls}>
          <Icon name="target" size={14} />
          {cleanCalls} called right first time
        </span>
      )}
    </div>
  )
}
