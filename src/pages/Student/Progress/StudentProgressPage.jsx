import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import ModuleProgressList from '../../../components/ModuleProgressList/ModuleProgressList'
import { useAuth } from '../../../context/AuthContext'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import { aggregateStudentAnalytics, getStudentAnalytics } from '../../../services/analyticsService'
import { timeAgo } from '../../../utils/timeAgo'
import styles from './StudentProgressPage.module.css'

/**
 * StudentProgressPage — /student/progress
 * Overall completion + average score, computed client-side from the same
 * data useStudentModules already fetches (no extra network round trip),
 * plus the per-module progress bars shared with the Dashboard (see
 * components/ModuleProgressList). The "Decision Analytics" and "What
 * You've Learned" panels are the things client-computed stats can't
 * provide — both come from the aggregateStudentAnalytics Cloud Function,
 * refreshed on demand.
 *
 * The learning panel is where a student sees their own pre-test →
 * post-test movement per module. It also surfaces the modules where a
 * post-test is still outstanding, since a missing post-test is exactly
 * what makes a gain unreportable.
 */
export default function StudentProgressPage() {
  const { user } = useAuth()
  const { status, errorMessage, retry, modules } = useStudentModules()
  const [analytics, setAnalytics] = useState(undefined) // undefined = loading, null = not yet aggregated
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')

  useEffect(() => {
    if (!user?.uid) return
    getStudentAnalytics(user.uid)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
  }, [user?.uid])

  async function refreshAnalytics() {
    setRefreshing(true)
    setAnalyticsError('')
    try {
      const summary = await aggregateStudentAnalytics()
      setAnalytics(summary)
    } catch (err) {
      setAnalyticsError(err?.message || 'Something went wrong refreshing your analytics. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  // Modules where the quiz is done but the post-test isn't — the students
  // most worth nudging, since their learning gain can't be computed until
  // they finish that last step.
  const pendingPostTests = modules.filter(
    (m) => m.progress?.quizCompleted && !m.progress?.postTestCompleted,
  )

  const completedCount = modules.filter((m) => m.status === MODULE_STATUS.COMPLETED).length
  const scores = modules.map((m) => m.progress?.score).filter((s) => typeof s === 'number')
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null
  const overallPct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Progress</h1>
          <p className={styles.subtitle}>How far you've come across the whole curriculum.</p>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={2} rows={3} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

        {status === 'success' && (
          <>
            <div className={styles.statsGrid}>
              <Card className={styles.statCard}>
                <p className={styles.statValue}>{completedCount} / {modules.length}</p>
                <p className={styles.statLabel}>Modules Completed</p>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.statValue}>{overallPct}%</p>
                <p className={styles.statLabel}>Curriculum Complete</p>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.statValue}>{avgScore === null ? '—' : `${avgScore}%`}</p>
                <p className={styles.statLabel}>Average Quiz Score</p>
              </Card>
            </div>

            <Card className={styles.panel}>
              <h2 className={styles.panelTitle}>Module Progress</h2>
              <ModuleProgressList modules={modules} />
            </Card>

            {pendingPostTests.length > 0 && (
              <Card className={styles.panel}>
                <h2 className={styles.panelTitle}>Post-Tests Waiting</h2>
                <p className={styles.emptyText}>
                  You've finished the quiz for {pendingPostTests.length} module
                  {pendingPostTests.length === 1 ? '' : 's'} but haven't taken the post-test yet. It's the same
                  short set of questions you answered at the start, and it's what shows you how much you picked
                  up.
                </p>
                <ul className={styles.pendingList}>
                  {pendingPostTests.map((m) => (
                    <li key={m.moduleId}>
                      <Link className={styles.pendingLink} to={`/student/modules/${m.moduleId}/post-test`}>
                        {m.title}: take the post-test →
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className={styles.panel}>
              <h2 className={styles.panelTitle}>What You've Learned</h2>
              {analytics === undefined && <p className={styles.emptyText}>Loading…</p>}
              {analytics === null && (
                <p className={styles.emptyText}>
                  Not yet aggregated — use "Refresh My Analytics" below to compute.
                </p>
              )}
              {analytics && !analytics.pairedCount && (
                <p className={styles.emptyText}>
                  Nothing to compare yet. Once you've taken both the pre-test and the post-test for a module,
                  your before-and-after shows up here.
                </p>
              )}
              {analytics && analytics.pairedCount > 0 && (
                <>
                  <div className={styles.analyticsGrid}>
                    <div className={styles.analyticsStat}>
                      <span className={styles.analyticsValue}>{analytics.avgPreTestScore}%</span>
                      <span className={styles.analyticsLabel}>Average Before</span>
                    </div>
                    <div className={styles.analyticsStat}>
                      <span className={styles.analyticsValue}>{analytics.avgPostTestScore}%</span>
                      <span className={styles.analyticsLabel}>Average After</span>
                    </div>
                    <div className={styles.analyticsStat}>
                      <span className={styles.analyticsValue}>
                        {analytics.behaviour?.firstAttemptSafeRate ?? 0}%
                      </span>
                      <span className={styles.analyticsLabel}>Safe on First Try</span>
                    </div>
                  </div>

                  {Array.isArray(analytics.timeline) && analytics.timeline.length > 0 && (
                    <ul className={styles.timelineList}>
                      {analytics.timeline
                        .filter((point) => point.preTestScore !== null || point.postTestScore !== null)
                        .map((point) => {
                          const module = modules.find((m) => m.moduleId === point.moduleId)
                          return (
                            <li key={point.moduleId} className={styles.timelineRow}>
                              <span className={styles.timelineName}>{module?.title || point.moduleId}</span>
                              <span className={styles.timelineScores}>
                                {point.preTestScore ?? '—'}% → {point.postTestScore ?? '—'}%
                              </span>
                            </li>
                          )
                        })}
                    </ul>
                  )}
                </>
              )}
            </Card>

            <Card className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h2 className={styles.panelTitle} style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                  Decision Analytics
                </h2>
                <Button variant="ghost" onClick={refreshAnalytics} loading={refreshing} disabled={refreshing}>
                  Refresh My Analytics
                </Button>
              </div>

              {analyticsError && (
                <div className={styles.errorBanner} role="alert">
                  <span aria-hidden="true">⚠</span> {analyticsError}
                </div>
              )}

              {analytics === undefined && <p className={styles.emptyText}>Loading…</p>}
              {analytics === null && (
                <p className={styles.emptyText}>Not yet aggregated — click Refresh to compute.</p>
              )}
              {analytics && (
                <div className={styles.analyticsGrid}>
                  <div className={styles.analyticsStat}>
                    <span className={styles.analyticsValue}>{analytics.totalSafeChoices}</span>
                    <span className={styles.analyticsLabel}>Safe Decisions</span>
                  </div>
                  <div className={styles.analyticsStat}>
                    <span className={styles.analyticsValue}>{analytics.totalRiskyChoices}</span>
                    <span className={styles.analyticsLabel}>Risky Decisions</span>
                  </div>
                  <div className={styles.analyticsStat}>
                    <span className={styles.analyticsValue}>
                      {analytics.lastActivityAt ? timeAgo(analytics.lastActivityAt) : '—'}
                    </span>
                    <span className={styles.analyticsLabel}>Last Activity</span>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
