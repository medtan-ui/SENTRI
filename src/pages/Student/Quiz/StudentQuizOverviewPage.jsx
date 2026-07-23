import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import styles from './StudentQuizOverviewPage.module.css'

/**
 * StudentQuizOverviewPage — /student/quiz
 * A directory of every module's quiz status — completed (with score),
 * available now, or locked (naming what to finish first). The actual
 * quiz-taking flow is unchanged, at /student/modules/:moduleId/quiz
 * (StudentQuizPage) — this page is purely a status overview, distinct
 * from that one.
 */
export default function StudentQuizOverviewPage() {
  const navigate = useNavigate()
  const { status, errorMessage, retry, modules } = useStudentModules()

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Quizzes</h1>
          <p className={styles.subtitle}>Your knowledge-check status across every module.</p>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={2} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

        {status === 'success' && (
          <div className={styles.list}>
            {modules.map((m, index) => {
              const previous = modules[index - 1]

              if (m.status === MODULE_STATUS.COMPLETED) {
                return (
                  <Card key={m.moduleId} className={styles.row}>
                    <div className={styles.rowInfo}>
                      <span className={styles.rowIcon} style={{ background: `${m.color}18`, color: m.color }}>
                        {m.icon}
                      </span>
                      <div>
                        <h2 className={styles.rowTitle}>{m.title}</h2>
                        <p className={styles.rowMeta}>Completed — scored {m.progress?.score ?? 0}%</p>
                      </div>
                    </div>
                    <span className={styles.badgeDone}>✓ Passed</span>
                  </Card>
                )
              }

              if (m.status === MODULE_STATUS.QUIZ_AVAILABLE) {
                return (
                  <Card key={m.moduleId} className={styles.row}>
                    <div className={styles.rowInfo}>
                      <span className={styles.rowIcon} style={{ background: `${m.color}18`, color: m.color }}>
                        {m.icon}
                      </span>
                      <div>
                        <h2 className={styles.rowTitle}>{m.title}</h2>
                        <p className={styles.rowMeta}>Lesson and simulation complete — quiz ready.</p>
                      </div>
                    </div>
                    <Button variant="primary" onClick={() => navigate(`/student/modules/${m.moduleId}/quiz`)}>
                      Take Quiz →
                    </Button>
                  </Card>
                )
              }

              const lockedReason =
                m.status === MODULE_STATUS.LOCKED && previous
                  ? `Complete "${previous.title}" to unlock this module.`
                  : 'Finish this module’s lesson and simulation first.'

              return (
                <Card key={m.moduleId} className={styles.row} data-locked="true">
                  <div className={styles.rowInfo}>
                    <span className={styles.rowIcon} style={{ background: `${m.color}18`, color: m.color }}>
                      🔒
                    </span>
                    <div>
                      <h2 className={styles.rowTitle}>{m.title}</h2>
                      <p className={styles.rowMeta}>{lockedReason}</p>
                    </div>
                  </div>
                  <span className={styles.badgeLocked}>Locked</span>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
