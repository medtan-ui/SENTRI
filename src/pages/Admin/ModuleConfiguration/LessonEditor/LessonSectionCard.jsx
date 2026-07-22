import React, { useState } from 'react'
import Card from '../../../../components/Card/Card'
import styles from './LessonContentTab.module.css'

/**
 * LessonSectionCard
 * Generic collapsible card used for every lesson section — title,
 * optional helper description, a chevron toggle, and arbitrary content.
 */
export default function LessonSectionCard({ title, description, defaultExpanded = true, children }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <Card className={styles.sectionCard}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div>
          <h3 className={styles.sectionTitle}>{title}</h3>
          {description && <p className={styles.sectionDescription}>{description}</p>}
        </div>
        <span className={styles.chevron} data-expanded={expanded} aria-hidden="true">▾</span>
      </button>
      {expanded && <div className={styles.sectionBody}>{children}</div>}
    </Card>
  )
}
