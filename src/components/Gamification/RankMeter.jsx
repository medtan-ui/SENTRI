import React from 'react'
import styles from './RankMeter.module.css'

/**
 * RankMeter
 * Current rank, XP, and the distance to the next rank as one bar.
 *
 * The bar is filled against the *current rank's span*, not against total
 * XP, so it always moves at a visible rate. A bar measured against the
 * final threshold would sit at 4% for the first two weeks of the course,
 * which reads as "this isn't working" rather than "you're early".
 *
 * `variant="dark"` is the version that sits inside the navy hero; the
 * default is for a white card.
 *
 * @param {{ points: number, level: number, rankName: string,
 *   nextRankAt: number|null, nextRankName: string|null, rankFloor: number,
 *   variant?: 'light'|'dark' }} props
 */
export default function RankMeter({
  points = 0,
  level = 1,
  rankName = 'Trainee',
  nextRankAt = null,
  nextRankName = null,
  rankFloor = 0,
  variant = 'light',
}) {
  const span = nextRankAt === null ? 0 : nextRankAt - rankFloor
  const gained = Math.max(0, points - rankFloor)
  const pct = nextRankAt === null ? 100 : Math.min(100, Math.round((gained / Math.max(span, 1)) * 100))
  const remaining = nextRankAt === null ? 0 : Math.max(0, nextRankAt - points)

  return (
    <div className={styles.meter} data-variant={variant}>
      <div className={styles.topRow}>
        <span className={styles.rank}>
          <span className={styles.level}>Lv {level}</span>
          {rankName}
        </span>
        <span className={styles.points}>{points.toLocaleString()} XP</span>
      </div>

      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress toward ${nextRankName ?? 'the highest rank'}`}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>

      <p className={styles.caption}>
        {nextRankAt === null
          ? 'Top rank reached. There is nothing above this one.'
          : `${remaining} XP to ${nextRankName}`}
      </p>
    </div>
  )
}
