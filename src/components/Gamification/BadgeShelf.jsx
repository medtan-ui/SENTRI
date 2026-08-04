import React from 'react'
import BadgeMedal from './BadgeMedal'
import styles from './BadgeShelf.module.css'

/**
 * BadgeShelf
 * The badge catalog with the student's earned ones marked.
 *
 * Earned badges sort to the front. Two reasons: what you've achieved
 * should be the first thing you see on your own achievements list, and
 * the boundary between earned and locked then falls in one place instead
 * of scattering through the grid, so "how far along am I" is answerable
 * at a glance rather than by counting.
 *
 * @param {{ catalog: object[], earnedIds?: string[], limit?: number,
 *   compact?: boolean }} props
 *   `limit` renders a preview (the dashboard uses it); omit for the full
 *   shelf on the Progress page.
 */
export default function BadgeShelf({ catalog = [], earnedIds = [], limit, compact = false }) {
  const earned = new Set(earnedIds)
  const sorted = [...catalog].sort((a, b) => Number(earned.has(b.id)) - Number(earned.has(a.id)))
  const shown = typeof limit === 'number' ? sorted.slice(0, limit) : sorted

  if (catalog.length === 0) {
    return <p className={styles.empty}>Badges are on their way. Finish a lesson to unlock the first one.</p>
  }

  return (
    <>
      <div className={styles.grid} data-compact={compact || undefined}>
        {shown.map((badge) => (
          <BadgeMedal key={badge.id} badge={badge} earned={earned.has(badge.id)} size={compact ? 'sm' : 'md'} />
        ))}
      </div>
      {typeof limit === 'number' && sorted.length > limit && (
        <p className={styles.more}>
          {earned.size} of {catalog.length} earned
        </p>
      )}
    </>
  )
}
