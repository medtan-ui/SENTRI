import React, { useEffect, useState } from 'react'
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
 * components/ModuleProgressList). The "Decision Analytics" panel is the
 * one thing client-computed stats can't provide — it comes from the
 * aggregateStudentAnalytics Cloud Function (safe/risky scenario decision
 * counts, last activity), refreshed on demand.
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
