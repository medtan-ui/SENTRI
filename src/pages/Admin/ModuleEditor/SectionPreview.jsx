import React from 'react'
import styles from './SectionPreview.module.css'

/**
 * SectionPreview
 * Read-only, student-facing rendering of a single section. Shared by the
 * always-visible right-panel preview (active section only) and the
 * full-module Preview modal (all sections stacked).
 */
export default function SectionPreview({ section, moduleTitle }) {
  if (!section) return null

  return (
    <div className={styles.preview}>
      {moduleTitle && <p className={styles.moduleTitle}>{moduleTitle}</p>}
      <h3 className={styles.sectionTitle}>{section.title || 'Untitled section'}</h3>

      {section.content ? (
        <p className={styles.content}>{section.content}</p>
      ) : (
        <p className={styles.placeholder}>No content written yet.</p>
      )}

      <div className={styles.mediaRow}>
        <div className={styles.mediaBox}>
          {section.imagePreviewUrl ? (
            <img src={section.imagePreviewUrl} alt="" className={styles.mediaImage} />
          ) : (
            <span className={styles.mediaPlaceholder}>🖼 No image</span>
          )}
        </div>
        <div className={styles.mediaBox}>
          {section.videoUrl ? (
            <span className={styles.videoChip}>▶ {section.videoUrl}</span>
          ) : (
            <span className={styles.mediaPlaceholder}>🎬 No video</span>
          )}
        </div>
      </div>

      {section.attachments?.length > 0 && (
        <ul className={styles.attachmentList}>
          {section.attachments.map((a) => (
            <li key={a.id}>📎 {a.name}</li>
          ))}
        </ul>
      )}

      {section.learningTip && (
        <div className={styles.tipBox}>
          <span className={styles.tipIcon} aria-hidden="true">💡</span>
          <p><strong>Learning Tip:</strong> {section.learningTip}</p>
        </div>
      )}

      {section.importantNote && (
        <div className={styles.noteBox}>
          <span className={styles.noteIcon} aria-hidden="true">📌</span>
          <p><strong>Important:</strong> {section.importantNote}</p>
        </div>
      )}
    </div>
  )
}
