import React from 'react'
import Modal from '../../../../components/Modal/Modal'
import Button from '../../../../components/Button/Button'
import styles from './LessonContentTab.module.css'

/**
 * LessonPreviewModal
 * Read-only, formatted preview of the lesson being edited, laid out in
 * the same order the student Lesson Viewer renders it — objectives, then
 * every reading section in sequence, then best practices, key takeaways,
 * and references.
 */
export default function LessonPreviewModal({ open, onClose, lesson }) {
  const objectives = lesson.objectives.filter((o) => o.trim())
  const bestPractices = lesson.bestPractices.filter((b) => b.trim())
  const keyTakeaways = lesson.keyTakeaways.filter((k) => k.trim())

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lesson Preview"
      size="lg"
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      <div className={styles.preview}>
        <section className={styles.previewSection}>
          <h4 className={styles.previewHeading}>Learning Objectives</h4>
          {objectives.length > 0 ? (
            <ul className={styles.previewList}>
              {objectives.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          ) : (
            <p className={styles.previewText}>No objectives added yet.</p>
          )}
        </section>

        {lesson.sections.map((section, i) => (
          <section key={section.id} className={styles.previewSection}>
            <h4 className={styles.previewHeading}>
              Section {i + 1}: {section.title || '(untitled section)'}
            </h4>
            <p className={styles.previewText}>{section.content || 'No content written yet.'}</p>
          </section>
        ))}

        <section className={styles.previewSection}>
          <h4 className={styles.previewHeading}>Best Practices</h4>
          {bestPractices.length > 0 ? (
            <ul className={styles.previewList}>
              {bestPractices.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          ) : (
            <p className={styles.previewText}>No best practices added yet.</p>
          )}
        </section>

        <section className={styles.previewSection}>
          <h4 className={styles.previewHeading}>Key Takeaways</h4>
          {keyTakeaways.length > 0 ? (
            <ul className={styles.previewList}>
              {keyTakeaways.map((k, i) => <li key={i}>{k}</li>)}
            </ul>
          ) : (
            <p className={styles.previewText}>No key takeaways added yet.</p>
          )}
        </section>

        <section className={styles.previewSection}>
          <h4 className={styles.previewHeading}>References</h4>
          {lesson.references.length > 0 ? (
            <ul className={styles.previewReferenceList}>
              {lesson.references.map((r) => (
                <li key={r.id}>
                  <strong>{r.title || 'Untitled reference'}</strong>
                  {r.link && <span className={styles.previewReferenceLink}> — {r.link}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.previewText}>No references added yet.</p>
          )}
        </section>
      </div>
    </Modal>
  )
}
