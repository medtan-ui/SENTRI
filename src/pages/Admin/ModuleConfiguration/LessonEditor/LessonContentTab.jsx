import React, { useMemo, useState } from 'react'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import LoadingSkeleton from '../../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../../components/ErrorState/ErrorState'
import { useLesson } from '../../../../hooks/useLesson'
import LessonSectionCard from './LessonSectionCard'
import EditableListField from './EditableListField'
import ReferencesEditor from './ReferencesEditor'
import LessonPreviewModal from './LessonPreviewModal'
import styles from './LessonContentTab.module.css'

const WORDS_PER_MINUTE = 200

function countWords(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length || 0
}

/**
 * LessonContentTab
 * The Lesson Content Editor, reusable for any of the six fixed modules
 * (looked up by moduleId). Fully self-contained — its own Save Draft /
 * Preview Lesson / Discard Changes actions. Independent of
 * ModuleConfigurationPage's own Save/Discard, which only covers the
 * Overview/Assignments/Prerequisites tabs.
 *
 * Data comes from useLesson() (Hooks layer, backed by lessonService →
 * Firestore). This component only renders — it never talks to
 * Firestore directly.
 */
export default function LessonContentTab({ moduleId }) {
  const { status, errorMessage, retry, lesson, dirty, saveState, notice, actions } = useLesson(moduleId)
  const [previewOpen, setPreviewOpen] = useState(false)

  const wordCount = useMemo(() => {
    if (!lesson) return 0
    return (
      countWords(lesson.introduction) +
      countWords(lesson.lessonContent) +
      countWords(lesson.realWorldExample) +
      lesson.objectives.reduce((sum, o) => sum + countWords(o), 0) +
      lesson.bestPractices.reduce((sum, b) => sum + countWords(b), 0) +
      lesson.keyTakeaways.reduce((sum, k) => sum + countWords(k), 0)
    )
  }, [lesson])

  if (status === 'loading') {
    return <LoadingSkeleton blocks={4} rows={3} />
  }

  if (status === 'error') {
    return <ErrorState message={errorMessage} onRetry={retry} />
  }

  if (status === 'not-found' || !lesson) {
    return <p className={styles.loading}>No lesson content exists for this module yet.</p>
  }

  const readingMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
  const objectiveCount = lesson.objectives.filter((o) => o.trim()).length
  const bestPracticeCount = lesson.bestPractices.filter((b) => b.trim()).length
  const referenceCount = lesson.references.length

  return (
    <div className={styles.editor}>
      <div className={styles.topActions}>
        <Button variant="ghost" onClick={actions.cancel} disabled={!dirty || saveState === 'saving'}>
          Discard Changes
        </Button>
        <Button variant="ghost" onClick={() => setPreviewOpen(true)}>Preview Lesson</Button>
        <Button variant="primary" onClick={actions.save} disabled={!dirty || saveState === 'saving'}>
          {saveState === 'saving' ? 'Saving…' : 'Save Draft'}
        </Button>
      </div>

      {notice && (
        <div className={styles.successBanner} role="status">
          <span aria-hidden="true">✓</span> {notice}
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.sections}>
          <LessonSectionCard title="Introduction" description="Short overview of the lesson.">
            <textarea
              className={styles.textarea}
              rows={3}
              value={lesson.introduction}
              onChange={(e) => actions.updateField('introduction', e.target.value)}
              placeholder="Give students a quick overview of what this lesson covers…"
            />
          </LessonSectionCard>

          <LessonSectionCard title="Learning Objectives" description="What students should be able to do after this lesson.">
            <EditableListField
              items={lesson.objectives}
              onChange={(next) => actions.updateField('objectives', next)}
              placeholder="e.g., Understand strong passwords"
              addLabel="Add Objective"
            />
          </LessonSectionCard>

          <LessonSectionCard title="Lesson Content" description="The main body of the lesson — this is where you write the lesson.">
            <textarea
              className={styles.textarea}
              rows={12}
              value={lesson.lessonContent}
              onChange={(e) => actions.updateField('lessonContent', e.target.value)}
              placeholder="Write the full lesson content here…"
            />
          </LessonSectionCard>

          <LessonSectionCard title="Real-World Example" description="A concrete scenario that illustrates the lesson.">
            <textarea
              className={styles.textarea}
              rows={5}
              value={lesson.realWorldExample}
              onChange={(e) => actions.updateField('realWorldExample', e.target.value)}
              placeholder="Describe a real or realistic example…"
            />
          </LessonSectionCard>

          <LessonSectionCard title="Best Practices" description="Actionable recommendations for students to follow.">
            <EditableListField
              items={lesson.bestPractices}
              onChange={(next) => actions.updateField('bestPractices', next)}
              placeholder="e.g., Enable MFA"
              addLabel="Add Best Practice"
            />
          </LessonSectionCard>

          <LessonSectionCard title="Key Takeaways" description="The most important points for students to remember.">
            <EditableListField
              items={lesson.keyTakeaways}
              onChange={(next) => actions.updateField('keyTakeaways', next)}
              placeholder="e.g., Strong passwords protect accounts."
              addLabel="Add Takeaway"
            />
          </LessonSectionCard>

          <LessonSectionCard title="References" description="Supporting sources students can read further.">
            <ReferencesEditor
              references={lesson.references}
              onChange={(next) => actions.updateField('references', next)}
            />
          </LessonSectionCard>
        </div>

        <aside className={styles.sidebar}>
          <Card className={styles.statsCard}>
            <h3 className={styles.statsHeading}>Lesson Stats</h3>
            <dl className={styles.statsList}>
              <div className={styles.statItem}>
                <dt className={styles.statLabel}>Estimated Reading Time</dt>
                <dd className={styles.statValue}>{readingMinutes} min</dd>
              </div>
              <div className={styles.statItem}>
                <dt className={styles.statLabel}>Word Count</dt>
                <dd className={styles.statValue}>{wordCount}</dd>
              </div>
              <div className={styles.statItem}>
                <dt className={styles.statLabel}>Objectives</dt>
                <dd className={styles.statValue}>{objectiveCount}</dd>
              </div>
              <div className={styles.statItem}>
                <dt className={styles.statLabel}>Best Practices</dt>
                <dd className={styles.statValue}>{bestPracticeCount}</dd>
              </div>
              <div className={styles.statItem}>
                <dt className={styles.statLabel}>References</dt>
                <dd className={styles.statValue}>{referenceCount}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>

      <LessonPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} lesson={lesson} />
    </div>
  )
}
