import React from 'react'
import Icon from '../Icon/Icon'
import styles from './BadgeMedal.module.css'

/**
 * BadgeMedal
 * One badge, earned or not.
 *
 * A locked badge is shown, not hidden — greyed, with its criteria still
 * legible. Hiding what you haven't earned yet makes the shelf look
 * finished when it isn't, and removes the only thing a badge system is
 * actually for: telling you what to go and do next.
 *
 * The medal is drawn from the app's own icon set on a tinted disc rather
 * than an image, so there is nothing to load, nothing to keep in sync
 * with the server's badge catalog, and it recolours by tier for free.
 *
 * `earnedPct` is how much of the cohort holds this badge, the way a game
 * library shows "12% of players have this". It is shown for locked and
 * earned badges alike: on a locked one it says how hard the thing is, on
 * an earned one it says what you did that others have not. Null when the
 * cohort rollup has not been built yet, in which case the line is simply
 * absent rather than reading as zero.
 *
 * @param {{ badge: { id: string, name: string, description: string,
 *   icon: string, tier: 'bronze'|'silver'|'gold',
 *   earnedPct?: number|null }, earned?: boolean,
 *   size?: 'sm'|'md' }} props
 */
export default function BadgeMedal({ badge, earned = false, size = 'md' }) {
  const pct = typeof badge.earnedPct === 'number' ? badge.earnedPct : null
  const rarityLabel =
    pct === null ? null : pct > 0 && pct < 1 ? 'Under 1% have this' : `${pct}% have this`
  return (
    <div className={styles.badge} data-earned={earned || undefined} data-size={size}>
      {/* Stroke, never filled. These are outline icons drawn on a
          24-grid; filling a shield or a book turns it into a solid blob
          that reads as a shape, not a symbol. Earned state is carried by
          the disc's tier colour and the card's border instead. */}
      <span className={styles.disc} data-tier={badge.tier} aria-hidden="true">
        <Icon name={badge.icon} size={size === 'sm' ? 18 : 24} strokeWidth={1.7} />
      </span>
      <div className={styles.text}>
        <p className={styles.name}>{badge.name}</p>
        <p className={styles.description}>{badge.description}</p>
        {rarityLabel && (
          <p className={styles.rarity} data-rare={pct > 0 && pct <= 25 ? 'true' : undefined}>
            {rarityLabel}
          </p>
        )}
      </div>
      {!earned && <span className={styles.lockTag}>Locked</span>}
    </div>
  )
}
