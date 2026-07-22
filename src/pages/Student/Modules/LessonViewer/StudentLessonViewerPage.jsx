import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import { loadModuleConfig } from '../../../../services/moduleLoader'
import { useModuleProgress } from '../../../../context/ModuleProgressContext'
import styles from './StudentLessonViewerPage.module.css'

const WORDS_PER_MINUTE = 200

function countWords(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length || 0
}

/**
 * StudentLessonViewerPage — /student/modules/:moduleId
 * Where a student studies a module's lesson before its interactive
 * simulation. Every piece of content comes from loadModuleConfig(moduleId)
 * — nothing here is hardcoded to Password Security, so the same page
 * serves any future module the loader knows about.
 */
export default function StudentLessonViewerPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { markLessonComplete } = useModuleProgress()

  // undefined = loading, null = not found, object = loaded
  const [config, setConfig] = useState(undefined)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [furthestIndex, setFurthestIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    setConfig(undefined)
    setCurrentIndex(0)
    setFurthestIndex(0)
    loadModuleConfig(moduleId).then((result) => {
      if (!cancelled) setConfig(result)
    })
    return () => {
      cancelled = true
    }
  }, [moduleId])

  if (config === undefined) {
    return (
      <DashboardLayout role="student">
        <div className={styles.page}>
          <Card className={styles.notFoundCard}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.loadingLabel}>Loading lesson…</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (config === null) {
    return (
      <DashboardLayout role="student">
        <div className={styles.page}>
          <Card className={styles.notFoundCard}>
            <h1 className={styles.title}>Module unavailable</h1>
            <p className={styles.subtitle}>Configuration not found.</p>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
                ← Return to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const { lesson } = config
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
    if (config.previousModuleId) {
      navigate(`/student/modules/${config.previousModuleId}`)
    }
  }

  function handleStartSimulation() {
    markLessonComplete(moduleId)
    navigate(`/student/modules/${moduleId}/scenario`)
  }

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{config.title}</h1>
            <p className={styles.description}>{config.description}</p>
            <div className={styles.badgeRow}>
              <span className={styles.difficultyBadge} data-difficulty={config.difficulty.toLowerCase()}>
                {config.difficulty}
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
              <h2 className={styles.blockHeading}>Best Practices</h2>
              <ul className={styles.bestPracticesList}>
                {lesson.bestPractices.map((bp, i) => (
                  <li key={i}>{bp}</li>
                ))}
              </ul>
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
                disabled={!config.previousModuleId}
                title={!config.previousModuleId ? 'This is the first module in the curriculum' : undefined}
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
