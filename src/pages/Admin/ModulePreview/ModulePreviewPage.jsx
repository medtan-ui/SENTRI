import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import { PREVIEW_MODULE, PREVIEW_CATEGORY_META } from './mockPreviewModule'
import styles from './ModulePreviewPage.module.css'

const WORDS_PER_MINUTE = 200

function estimateReadingMinutes(sections) {
  const words = sections.reduce(
    (sum, s) => sum + (s.content?.trim().split(/\s+/).filter(Boolean).length || 0),
    0
  )
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/**
 * ModulePreviewPage
 * Read-only, student-facing rendering of a full module — exactly what a
 * student would see, so admins can review before publishing. No editing,
 * no Firestore; renders the mock lesson from the Module Content Editor.
 */
export default function ModulePreviewPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Draft')
  const [notice, setNotice] = useState('')

  const { title, category, difficulty, objectives, sections } = PREVIEW_MODULE
  const readingMinutes = useMemo(() => estimateReadingMinutes(sections), [sections])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  function handleBackToEditor() {
    navigate('/admin/modules/editor')
  }

  function handleSaveDraft() {
    setStatus('Draft')
    setNotice('Draft saved locally.')
  }

  function handlePublish() {
    setStatus('Published')
    setNotice(`"${title}" was published.`)
  }

  function handleTocClick(e, sectionId) {
    e.preventDefault()
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        {/* ── Top Navigation ── */}
        <div className={styles.topNav}>
          <Button variant="ghost" onClick={handleBackToEditor}>← Back to Editor</Button>
          <div className={styles.topNavRight}>
            <span className={styles.statusPill} data-status={status.toLowerCase()}>{status}</span>
            <Button variant="primary" onClick={handlePublish}>Publish</Button>
          </div>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Module Preview</h1>
          <p className={styles.subtitle}>Preview the learning experience before publishing.</p>
        </div>

        {notice && (
          <div className={styles.successBanner} role="status">
            <span aria-hidden="true">✓</span> {notice}
          </div>
        )}

        <div className={styles.layout}>
          {/* ── Scrollable Lesson Viewer ── */}
          <div className={styles.mainColumn}>
            <Card className={styles.lessonCard}>
              <div className={styles.hero}>
                <span
                  className={styles.thumbTile}
                  style={{
                    background: `${PREVIEW_CATEGORY_META?.color || '#999999'}18`,
                    color: PREVIEW_CATEGORY_META?.color || '#999999',
                  }}
                  aria-hidden="true"
                >
                  {PREVIEW_CATEGORY_META?.icon || '📘'}
                </span>
                <div className={styles.heroBody}>
                  <h2 className={styles.lessonTitle}>{title}</h2>
                  <div className={styles.badgeRow}>
                    <span className={styles.categoryBadge}>{category}</span>
                    <span className={styles.difficultyBadge} data-difficulty={difficulty.toLowerCase()}>
                      {difficulty}
                    </span>
                    <span className={styles.timeBadge}>⏱ {readingMinutes} min</span>
                  </div>
                </div>
              </div>

              <div className={styles.objectivesBox}>
                <h3 className={styles.objectivesTitle}>Learning Objectives</h3>
                <ul className={styles.objectivesList}>
                  {objectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.divider} />

              {sections.map((s, i) => (
                <section id={s.id} key={s.id} className={styles.lessonSection}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionNumber}>{i + 1}</span>
                    {s.title || 'Untitled section'}
                  </h3>

                  {s.content ? (
                    <p className={styles.sectionContent}>{s.content}</p>
                  ) : (
                    <p className={styles.placeholder}>No content written yet.</p>
                  )}

                  <div className={styles.mediaRow}>
                    <div className={styles.mediaBox}>
                      {s.imagePreviewUrl ? (
                        <img src={s.imagePreviewUrl} alt="" className={styles.mediaImage} />
                      ) : (
                        <span className={styles.mediaPlaceholder}>🖼 Image placeholder</span>
                      )}
                    </div>
                    <div className={styles.mediaBox}>
                      {s.videoUrl ? (
                        <span className={styles.videoChip}>▶ {s.videoUrl}</span>
                      ) : (
                        <span className={styles.mediaPlaceholder}>🎬 Video placeholder</span>
                      )}
                    </div>
                  </div>

                  {s.learningTip && (
                    <div className={styles.tipBox}>
                      <span className={styles.tipIcon} aria-hidden="true">💡</span>
                      <p><strong>Learning Tip:</strong> {s.learningTip}</p>
                    </div>
                  )}

                  {s.importantNote && (
                    <div className={styles.noteBox}>
                      <span className={styles.noteIcon} aria-hidden="true">📌</span>
                      <p><strong>Important:</strong> {s.importantNote}</p>
                    </div>
                  )}
                </section>
              ))}
            </Card>

            {/* ── Bottom Actions ── */}
            <div className={styles.bottomActions}>
              <Button variant="ghost" onClick={handleBackToEditor}>← Back to Editor</Button>
              <Button variant="ghost" onClick={handleSaveDraft}>Save Draft</Button>
              <Button variant="primary" onClick={handlePublish}>Publish Module</Button>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className={styles.sidebar}>
            <Card className={styles.sidebarCard}>
              <h2 className={styles.sidebarHeading}>Lesson Progress</h2>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: '100%' }} />
              </div>
              <p className={styles.progressLabel}>100% Complete</p>
            </Card>

            <Card className={styles.sidebarCard}>
              <h2 className={styles.sidebarHeading}>Table of Contents</h2>
              <ul className={styles.tocList}>
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className={styles.tocLink} onClick={(e) => handleTocClick(e, s.id)}>
                      <span className={styles.tocIndex}>{i + 1}</span>
                      {s.title || 'Untitled section'}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className={styles.sidebarCard}>
              <dl className={styles.statsList}>
                <div className={styles.statItem}>
                  <dt className={styles.statLabel}>Estimated Reading Time</dt>
                  <dd className={styles.statValue}>{readingMinutes} min</dd>
                </div>
                <div className={styles.statItem}>
                  <dt className={styles.statLabel}>Sections</dt>
                  <dd className={styles.statValue}>{sections.length}</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
