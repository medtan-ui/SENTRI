import React, { useMemo, useState } from 'react'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import LoadingSkeleton from '../../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../../components/ErrorState/ErrorState'
import YouTubePlayer, { parseYouTubeId } from '../../../../components/VideoPlayer/YouTubePlayer'
import { useLesson } from '../../../../hooks/useLesson'
import LessonSectionCard from './LessonSectionCard'
import LessonSectionsEditor from './LessonSectionsEditor'
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
 * What's edited here is exactly what the student Lesson Viewer renders:
 * the same video slot, learning objectives, ordered reading sections,
 * best practices, key takeaways, and references. Saving publishes — see
 * services/moduleLoader.js, which reads this document on the student
 * path.
 *
 * Data comes from useLesson() (Hooks layer, backed by lessonService →
 * Firestore). This component only renders — it never talks to Firestore
 * directly.
 */
export default function LessonContentTab({ moduleId }) {
  const { status, errorMessage, retry, lesson, issues, dirty, saveState, notice, actions } = useLesson(moduleId)
  const [previewOpen, setPreviewOpen] = useState(false)

  const wordCount = useMemo(() => {
    if (!lesson) return 0
    return (
      lesson.sections.reduce((sum, s) => sum + countWords(s.title) + countWords(s.content), 0) +
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
  const videoResolved = Boolean(parseYouTubeId(lesson.videoId))

  return (
    <div className={styles.editor}>
      <div className={styles.topActions}>
        <Button variant="ghost" onClick={actions.resetToDefaults} disabled={saveState === 'saving'}>
          Reset to Defaults
        </Button>
        <Button variant="ghost" onClick={actions.cancel} disabled={!dirty || saveState === 'saving'}>
          Discard Changes
        </Button>
        <Button variant="ghost" onClick={() => setPreviewOpen(true)}>Preview Lesson</Button>
        <Button
          variant="primary"
          onClick={actions.save}
          disabled={!dirty || issues.length > 0 || saveState === 'saving'}
        >
          {saveState === 'saving' ? 'Saving…' : 'Save Draft'}
        </Button>
      </div>

      {notice && (
        <div className={styles.successBanner} role="status">
          <span aria-hidden="true">✓</span> {notice}
        </div>
      )}

      {issues.length > 0 && (
        <div className={styles.issueBanner} role="alert">
          {issues.map((issue) => (
            <p key={issue.field}>{issue.message}</p>
          ))}
        </div>
      )}

      <p className={styles.liveNote}>
        Saved changes go live for students the next time they open this lesson.
      </p>

      <div className={styles.layout}>
        <div className={styles.sections}>
          <LessonSectionCard
            title="Lesson Video"
            description="Paste the YouTube link (or bare video id) once the lesson video is recorded. Students see a “coming soon” card until then."
          >
            <input
              type="text"
              className={styles.listInput}
              value={lesson.videoId}
              onChange={(e) => actions.updateField('videoId', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <div className={styles.videoPreview}>
              <YouTubePlayer url={lesson.videoId} title="Lesson video" />
            </div>
            {lesson.videoId && !videoResolved && (
              <p className={styles.videoWarning}>
                That doesn't look like a YouTube link or video id, so students would see the placeholder.
              </p>
            )}
          </LessonSectionCard>

          <LessonSectionCard title="Learning Objectives" description="What students should be able to do after this lesson.">
            <EditableListField
              items={lesson.objectives}
              onChange={(next) => actions.updateField('objectives', next)}
              placeholder="e.g., Understand strong passwords"
              addLabel="Add Objective"
            />
          </LessonSectionCard>

          <LessonSectionCard
            title="Lesson Sections"
            description="The lesson itself, one section per page. Students must reach the last section to unlock the simulation, so order matters."
          >
            <LessonSectionsEditor
              sections={lesson.sections}
              onChange={(next) => actions.updateField('sections', next)}
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
                <dt className={styles.statLabel}>Sections</dt>
                <dd className={styles.statValue}>{lesson.sections.length}</dd>
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
              <div className={styles.statItem}>
                <dt className={styles.statLabel}>Lesson Video</dt>
                <dd className={styles.statValue}>{videoResolved ? 'Set' : 'Not set'}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>

      <LessonPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} lesson={lesson} />
    </div>
  )
}
