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
 * @param {{ badge: { id: string, name: string, description: string,
 *   icon: string, tier: 'bronze'|'silver'|'gold' }, earned?: boolean,
 *   size?: 'sm'|'md' }} props
 */
export default function BadgeMedal({ badge, earned = false, size = 'md' }) {
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
      </div>
      {!earned && <span className={styles.lockTag}>Locked</span>}
    </div>
  )
}
