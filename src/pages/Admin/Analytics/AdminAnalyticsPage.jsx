import React, { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useModuleList } from '../../../hooks/useModule'
import {
  aggregateCohortAnalytics,
  aggregateModuleAnalytics,
  getCohortAnalytics,
  getModuleAnalytics,
  listSections,
} from '../../../services/analyticsService'
import CohortSummaryCard from './CohortSummaryCard'
import ExportToolbar from './ExportToolbar'
import ModuleLearningDetail from './ModuleLearningDetail'
import styles from './AdminAnalyticsPage.module.css'

/**
 * AdminAnalyticsPage — /admin/analytics
 * Two levels of reporting, both computed server-side and only read here:
 *
 *   Cohort  — aggregateCohortAnalytics → cohortAnalytics/{scope}.
 *             Class-wide learning gain, behaviour, cross-module transfer,
 *             and the 30-day activity trend. This is the level the
 *             capstone's own objectives are reported at, and it can be
 *             scoped to a single section rather than the whole school.
 *   Module  — aggregateModuleAnalytics → moduleAnalytics/{moduleId}.
 *             Completion and pass rates as before, plus this module's
 *             pre/post gain, per-topic mastery, and item analysis.
 *
 * This page never computes a statistic itself — it triggers a recompute
 * and formats the result, so every reported figure has exactly one
 * derivation (functions/src/modules/analytics/metrics.ts). The same holds
 * for the CSV exports: they serialize these documents, they don't re-derive
 * them.
 *
 * A note on what the section picker does and doesn't scope: the cohort
 * rollup is per-section, but the per-module cards below are not. Module
 * analytics are keyed by module id alone, and inventing a per-section
 * variant of them would double the aggregate documents to answer a
 * question the cohort card's module breakdown already answers per section.
 * The heading below says so, rather than leaving an admin to assume the
 * filter reaches further than it does.
 */
export default function AdminAnalyticsPage() {
  const { status, errorMessage, retry, modules } = useModuleList()
  const [summaries, setSummaries] = useState({}) // moduleId -> summary | null
  const [refreshing, setRefreshing] = useState({}) // moduleId -> boolean
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [cohort, setCohort] = useState(undefined) // undefined = loading
  const [refreshingCohort, setRefreshingCohort] = useState(false)
  const [sections, setSections] = useState([])
  const [section, setSection] = useState(null) // null = whole cohort

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

  // Re-reads whenever the scope changes, so switching sections can never
  // leave the previous group's numbers on screen under a new label.
  useEffect(() => {
    let cancelled = false
    setCohort(undefined)
    getCohortAnalytics(section)
      .then((data) => {
        if (!cancelled) setCohort(data)
      })
      .catch(() => {
        if (!cancelled) setCohort(null)
      })
    return () => {
      cancelled = true
    }
  }, [section])

  // A section that no longer has students in it simply stops being
  // offered — the picker is derived from the roster, never from the
  // aggregate documents, which outlive the accounts that produced them.
  useEffect(() => {
    let cancelled = false
    listSections()
      .then((result) => {
        if (!cancelled) setSections(result)
      })
      .catch((err) => {
        console.error('[AdminAnalyticsPage] section list failed:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  async function refreshCohort() {
    setRefreshingCohort(true)
    try {
      setCohort(await aggregateCohortAnalytics(section))
    } catch (err) {
      console.error('[AdminAnalyticsPage] cohort refresh failed:', err)
    } finally {
      setRefreshingCohort(false)
    }
  }

  async function refreshAll() {
    setRefreshingAll(true)
    for (const m of modules) {
      // eslint-disable-next-line no-await-in-loop
      await refreshOne(m.id)
    }
    // The cohort rollup reads the same underlying collections, so it is
    // refreshed last rather than in parallel — no point recomputing it
    // from data the per-module pass is still updating. Only the selected
    // scope is recomputed, not every section: this is the "I want the
    // current number now" path, and the nightly job is what keeps the
    // sections nobody is looking at up to date.
    await refreshCohort()
    setRefreshingAll(false)
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Analytics</h1>
            <p className={styles.subtitle}>
              Learning gain, behaviour, and item quality. Recomputed nightly, and on demand here.
            </p>
          </div>
          <div className={styles.headerActions} data-print-hide>
            <select
              className={styles.sectionSelect}
              value={section ?? ''}
              onChange={(e) => setSection(e.target.value || null)}
              aria-label="Report on a section"
              disabled={refreshingCohort || refreshingAll}
            >
              <option value="">All sections</option>
              {sections.map((s) => (
                <option key={s.key} value={s.label}>
                  {s.label} ({s.studentCount})
                </option>
              ))}
            </select>
            <Button variant="primary" onClick={refreshAll} loading={refreshingAll} disabled={refreshingAll}>
              Refresh All
            </Button>
          </div>
        </div>

        <ExportToolbar cohort={cohort} modules={modules} summaries={summaries} section={section} />

        <CohortSummaryCard
          summary={cohort === undefined ? null : cohort}
          section={section}
          refreshing={refreshingCohort || refreshingAll}
          onRefresh={refreshCohort}
        />

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={3} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

        {status === 'success' && (
          <>
            <h2 className={styles.gridHeading}>
              Per Module
              <span className={styles.gridHeadingNote}>
                Across every student. These cards are not filtered by the section picker.
              </span>
            </h2>
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
                    <>
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

                      {/* Documents aggregated before the framework existed
                          have no learning fields; showing the old stats
                          alone beats crashing on a missing key. */}
                      {summary.topicMastery !== undefined && <ModuleLearningDetail summary={summary} />}
                    </>
                  )}

                  <Button
                    variant="ghost"
                    fullWidth
                    data-print-hide
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
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
