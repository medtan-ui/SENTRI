import React, { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useModuleList } from '../../../hooks/useModule'
import { aggregateModuleAnalytics, getModuleAnalytics } from '../../../services/analyticsService'
import styles from './AdminAnalyticsPage.module.css'

/**
 * AdminAnalyticsPage — /admin/analytics
 * Per-module completion/pass/score analytics, computed server-side by the
 * aggregateModuleAnalytics Cloud Function and persisted to
 * moduleAnalytics/{moduleId}. This page only reads that summary and
 * triggers a recompute — it never computes stats itself.
 */
export default function AdminAnalyticsPage() {
  const { status, errorMessage, retry, modules } = useModuleList()
  const [summaries, setSummaries] = useState({}) // moduleId -> summary | null
  const [refreshing, setRefreshing] = useState({}) // moduleId -> boolean
  const [refreshingAll, setRefreshingAll] = useState(false)

  const loadSummaries = useCallback(async (moduleList) => {
    const entries = await Promise.all(
      moduleList.map(async (m) => [m.id, await getModuleAnalytics(m.id).catch(() => null)]),
    )
    setSummaries(Object.fromEntries(entries))
  }, [])

  useEffect(() => {
    if (status === 'success' && modules.length > 0) {
      loadSummaries(modules)
    }
  }, [status, modules, loadSummaries])

  async function refreshOne(moduleId) {
    setRefreshing((prev) => ({ ...prev, [moduleId]: true }))
    try {
      const summary = await aggregateModuleAnalytics(moduleId)
      setSummaries((prev) => ({ ...prev, [moduleId]: summary }))
    } catch (err) {
      console.error('[AdminAnalyticsPage] refresh failed:', moduleId, err)
    } finally {
      setRefreshing((prev) => ({ ...prev, [moduleId]: false }))
    }
  }

  async function refreshAll() {
    setRefreshingAll(true)
    for (const m of modules) {
      // eslint-disable-next-line no-await-in-loop
      await refreshOne(m.id)
    }
    setRefreshingAll(false)
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Analytics</h1>
            <p className={styles.subtitle}>
              Completion, pass rate, and average score per module — recomputed on demand.
            </p>
          </div>
          <Button variant="primary" onClick={refreshAll} loading={refreshingAll} disabled={refreshingAll}>
            Refresh All
          </Button>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={3} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

        {status === 'success' && (
          <div className={styles.grid}>
            {modules.map((m) => {
              const summary = summaries[m.id]
              const isRefreshing = Boolean(refreshing[m.id])
              return (
                <Card key={m.id} className={styles.moduleCard}>
                  <div className={styles.cardHeader}>
                    <span
                      className={styles.iconTile}
                      style={{ background: `${m.color}18`, color: m.color }}
                      aria-hidden="true"
                    >
                      {m.icon}
                    </span>
                    <h2 className={styles.moduleName}>{m.name}</h2>
                  </div>

                  {summary === undefined && <p className={styles.emptyText}>Loading…</p>}

                  {summary === null && (
                    <p className={styles.emptyText}>Not yet aggregated — click Refresh to compute.</p>
                  )}

                  {summary && (
                    <div className={styles.statGrid}>
                      <div className={styles.stat}>
                        <span className={styles.statValue}>{summary.totalStudents}</span>
                        <span className={styles.statLabel}>Students</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statValue}>{summary.completionRate}%</span>
                        <span className={styles.statLabel}>Completion</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statValue}>{summary.passRate}%</span>
                        <span className={styles.statLabel}>Pass Rate</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statValue}>{summary.avgScore}%</span>
                        <span className={styles.statLabel}>Avg. Score</span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => refreshOne(m.id)}
                    loading={isRefreshing}
                    disabled={isRefreshing || refreshingAll}
                  >
                    Refresh
                  </Button>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
