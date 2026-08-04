import React from 'react'
import Icon from '../Icon/Icon'
import styles from './RewardChip.module.css'

/**
 * RewardChip
 * The small "420 XP" / "5 day streak" pill, used in the navbar and
 * anywhere a reward figure needs to appear beside other content without
 * becoming the content.
 *
 * Deliberately tiny. A streak is a nudge, and a nudge that takes up a
 * card's worth of space stops being a nudge — the number does the work,
 * the icon just says which number it is.
 *
 * @param {{ tone?: 'xp'|'streak', icon: string, value: React.ReactNode,
 *   label: string, muted?: boolean }} props
 *   `label` is always rendered for assistive tech even when the visible
 *   chip is only a glyph and a number.
 */
export default function RewardChip({ tone = 'xp', icon, value, label, muted = false }) {
  return (
    <span className={styles.chip} data-tone={tone} data-muted={muted || undefined}>
      <Icon name={icon} size={14} filled={tone === 'streak' && !muted} />
      <span className={styles.value}>{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
