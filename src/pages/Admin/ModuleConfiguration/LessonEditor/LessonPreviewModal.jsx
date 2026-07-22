import React from 'react'
import Modal from '../../../../components/Modal/Modal'
import Button from '../../../../components/Button/Button'
import styles from './LessonContentTab.module.css'

/**
 * LessonPreviewModal
 * Read-only, formatted preview of the lesson being edited — lets an
 * admin see roughly how the assembled lesson will read before saving.
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
          <h4 className={styles.previewHeading}>Introduction</h4>
          <p className={styles.previewText}>{lesson.introduction || 'No introduction written yet.'}</p>
        </section>

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

        <section className={styles.previewSection}>
          <h4 className={styles.previewHeading}>Lesson Content</h4>
          <p className={styles.previewText}>{lesson.lessonContent || 'No lesson content written yet.'}</p>
        </section>

        <section className={styles.previewSection}>
          <h4 className={styles.previewHeading}>Real-World Example</h4>
          <p className={styles.previewText}>{lesson.realWorldExample || 'No example written yet.'}</p>
        </section>

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
