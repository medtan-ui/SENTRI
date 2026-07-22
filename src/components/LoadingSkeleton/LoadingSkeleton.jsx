import React from 'react'
import Card from '../Card/Card'
import styles from './LoadingSkeleton.module.css'

/**
 * LoadingSkeleton
 * Generic shimmering placeholder shown while a Training Curriculum tab
 * is fetching its Firestore data — used instead of a blank page. `rows`
 * controls how many placeholder lines appear per block, `blocks` how
 * many card-shaped sections to show (roughly mirroring the eventual
 * content's shape without knowing its real content yet).
 */
export default function LoadingSkeleton({ blocks = 2, rows = 3 }) {
  return (
    <div className={styles.wrap} aria-busy="true" aria-live="polite">
      {Array.from({ length: blocks }).map((_, blockIndex) => (
        <Card key={blockIndex} className={styles.block}>
          <div className={`${styles.bar} ${styles.title}`} />
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className={styles.bar}
              style={{ width: `${85 - ((rowIndex * 13) % 40)}%` }}
            />
          ))}
        </Card>
      ))}
      <span className={styles.srOnly}>Loading…</span>
    </div>
  )
}
