import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import { STUDENT_LESSONS } from './mockStudentLessons'
import styles from './StudentLessonViewerPage.module.css'

const WORDS_PER_MINUTE = 200

function countWords(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length || 0
}

/**
 * StudentLessonViewerPage
 * Where a student studies a module's lesson before attempting its
 * interactive simulation. Generic (takes moduleId as a prop) so the
 * same component can serve the other five modules later — routed today
 * only for Password Security, per the static /student/modules/
 * password-security path. Mock data only, no Firestore.
 */
export default function StudentLessonViewerPage({ moduleId }) {
  const navigate = useNavigate()
  const lesson = STUDENT_LESSONS[moduleId]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [furthestIndex, setFurthestIndex] = useState(0)

  if (!lesson) {
    return (
      <DashboardLayout role="student">
        <div className={styles.page}>
          <Card className={styles.notFoundCard}>
            <h1 className={styles.title}>Lesson not available</h1>
            <p className={styles.subtitle}>This module's lesson content hasn't been added yet.</p>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
                ← Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const totalSections = lesson.sections.length
  const activeSection = lesson.sections[currentIndex]
  const progressPct = Math.round(((furthestIndex + 1) / totalSections) * 100)

  const wordCount = lesson.sections.reduce((sum, s) => sum + countWords(s.content), 0)
  const readingMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))

  function goToSection(index) {
    const clamped = Math.max(0, Math.min(totalSections - 1, index))
    setCurrentIndex(clamped)
    setFurthestIndex((prev) => Math.max(prev, clamped))
  }

  function handlePreviousLesson() {
    if (lesson.previousModuleId) {
      navigate(`/student/modules/${lesson.previousModuleId}`)
    }
  }

  function handleStartSimulation() {
    navigate(`/student/modules/${moduleId}/simulation`)
  }

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{lesson.title}</h1>
            <div className={styles.badgeRow}>
              <span className={styles.difficultyBadge} data-difficulty={lesson.difficulty.toLowerCase()}>
                {lesson.difficulty}
              </span>
              <span className={styles.timeBadge}>⏱ {readingMinutes} min read</span>
            </div>
          </div>
          <div className={styles.headerProgress}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <span className={styles.progressLabel}>{progressPct}% complete</span>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <Card className={styles.block}>
              <h2 className={styles.blockHeading}>Learning Objectives</h2>
              <ul className={styles.objectivesList}>
                {lesson.objectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Card>

            <Card className={styles.sectionCard}>
              <span className={styles.sectionCount}>Section {currentIndex + 1} of {totalSections}</span>
              <h2 className={styles.sectionTitle}>{activeSection.title}</h2>
              <p className={styles.sectionContent}>{activeSection.content}</p>

              <div className={styles.sectionNav}>
                <Button variant="ghost" onClick={() => goToSection(currentIndex - 1)} disabled={currentIndex === 0}>
                  ← Previous
                </Button>
                <Button
                  variant="primary"
                  onClick={() => goToSection(currentIndex + 1)}
                  disabled={currentIndex === totalSections - 1}
                >
                  Next →
                </Button>
              </div>
            </Card>

            <Card className={styles.block}>
              <h2 className={styles.blockHeading}>Key Takeaways</h2>
              <ul className={styles.takeawaysList}>
                {lesson.keyTakeaways.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </Card>

            <Card className={styles.block}>
              <h2 className={styles.blockHeading}>References</h2>
              <ul className={styles.referencesList}>
                {lesson.references.map((r) => (
                  <li key={r.id} className={styles.referenceItem}>
                    <span className={styles.referenceTitle}>{r.title}</span>
                    <span className={styles.referenceLink}>{r.link}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className={styles.bottomActions}>
              <Button
                variant="ghost"
                onClick={handlePreviousLesson}
                disabled={!lesson.previousModuleId}
                title={!lesson.previousModuleId ? 'This is the first module in the curriculum' : undefined}
              >
                ← Previous Lesson
              </Button>
              <Button variant="primary" size="lg" onClick={handleStartSimulation}>
                Start Interactive Simulation →
              </Button>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <Card className={styles.sidebarCard}>
              <h3 className={styles.sidebarHeading}>Lesson Progress</h3>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
              </div>
              <p className={styles.progressLabel}>{progressPct}% complete</p>
            </Card>

            <Card className={styles.sidebarCard}>
              <h3 className={styles.sidebarHeading}>Table of Contents</h3>
              <ul className={styles.tocList}>
                {lesson.sections.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`${styles.tocItem} ${i === currentIndex ? styles.tocItemActive : ''}`}
                      onClick={() => goToSection(i)}
                    >
                      <span className={styles.tocIndex}>{i + 1}</span>
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className={styles.sidebarCard}>
              <h3 className={styles.sidebarHeading}>Current Section</h3>
              <p className={styles.currentSectionText}>
                <span className={styles.currentSectionIndex}>{currentIndex + 1}</span> {activeSection.title}
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
