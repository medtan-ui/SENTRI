import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useAuth } from '../../../context/AuthContext'
import { useAdminOverview } from '../../../hooks/useAdminOverview'
import { timeAgo } from '../../../utils/timeAgo'
import Icon from '../../../components/Icon/Icon'
import TourGuide from '../../../components/TourGuide/TourGuide'
import { useFirstRunTour } from '../../../components/TourGuide/useFirstRunTour'
import styles from './AdminDashboard.module.css'

const QUICK_LINKS = [
  { label: 'Modules', path: '/admin/modules', icon: 'book' },
  { label: 'Scenarios', path: '/admin/scenarios', icon: 'shield' },
  { label: 'Quizzes', path: '/admin/quizzes', icon: 'quiz' },
  { label: 'Analytics', path: '/admin/analytics', icon: 'analytics' },
  { label: 'Accounts', path: '/admin/accounts', icon: 'users' },
]

/**
 * The admin walkthrough. Same machinery as the student one, aimed at a
 * different job: an administrator's first question is not "where do I
 * start training" but "where is the cohort, and where do I change what
 * they see". So the steps follow the sidebar's own grouping — the
 * numbers first, then Content, then People, then the full report.
 */
const TOUR_STEPS = [
  {
    title: "You're signed in as an administrator",
    body: "A quick tour of what you can do from here. Skip it if you'd rather explore, it's always available again from your profile.",
  },
  {
    target: 'admin-stats',
    title: 'The cohort at a glance',
    body: 'Accounts, enrolled students and the most recent quiz average. These update as students work through the curriculum.',
  },
  {
    target: 'nav-modules',
    title: 'Content lives under here',
    body: 'Modules, Scenarios and Quiz Manager are where you author what students see: lesson text, branching scenarios and quiz questions.',
  },
  {
    target: 'nav-accounts',
    title: 'Accounts and class sections',
    body: 'Create administrator accounts, assign students to sections, reset a password, or grant a quiz retry when someone appeals.',
  },
  {
    target: 'nav-analytics',
    title: 'The full analytics report',
    body: 'Pre-test to post-test learning gains, item difficulty and per-section rollups, with CSV and PDF export for your documentation.',
  },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { status, errorMessage, retry, modules, users, recentAttempts, moduleSummaries } = useAdminOverview()
  const { showTour, finishTour } = useFirstRunTour({ uid: user?.uid, ready: status === 'success' })

  const name = user?.nickname || user?.displayName || 'Administrator'
  const studentCount = users.filter((u) => u.role === 'student').length
  const avgScore =
    recentAttempts.length > 0
      ? Math.round(recentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / recentAttempts.length)
      : null

  function moduleTitle(moduleId) {
    return modules.find((m) => m.id === moduleId)?.name || moduleId
  }

  function studentName(userId) {
    const match = users.find((u) => u.uid === userId)
    return match?.nickname || match?.displayName || 'A student'
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>

        {/* ── Hero ── */}
        <div className={styles.hero} data-surface="dark">
          <div>
            <span className={styles.heroEyebrow}>Welcome back</span>
            <h1 className={styles.heroTitle}>Hey, {name}</h1>
            <p className={styles.heroSubtitle}>Here's how SENTRI is looking today.</p>
          </div>
          <div className={styles.heroDateBadge}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={3} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

        {status === 'success' && (
          <>
            {/* ── Stats ──
                Number-first tiles, matching the student dashboard. The
                icon-in-a-tinted-square treatment these used to have put
                four unrelated accent colours across the top of the page
                and pushed the figures themselves to second billing. */}
            <div className={styles.statsGrid} data-tour="admin-stats">
              <div className={styles.statCard}>
                <p className={styles.statValue}>{users.length}</p>
                <p className={styles.statLabel}>Total accounts</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statValue}>{studentCount}</p>
                <p className={styles.statLabel}>Students</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statValue}>{modules.length}</p>
                <p className={styles.statLabel}>Curriculum modules</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statValue}>{avgScore === null ? '—' : `${avgScore}%`}</p>
                <p className={styles.statLabel}>Avg. recent quiz score</p>
              </div>
            </div>

            {/* ── Content ── */}
            <div className={styles.columns}>

              {/* Recent quiz activity */}
              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Recent Quiz Activity</h2>
                {recentAttempts.length === 0 ? (
                  <p className={styles.emptyText}>No quiz attempts recorded yet.</p>
                ) : (
                  <ul className={styles.activityList}>
                    {recentAttempts.map((a, i) => (
                      <li key={i} className={styles.activityItem}>
                        <span className={styles.activityAvatar}>
                          {studentName(a.userId).split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                        <div className={styles.activityBody}>
                          <p className={styles.activityText}>
                            <strong>{studentName(a.userId)}</strong> scored {a.score}% on the{' '}
                            {moduleTitle(a.moduleId)} quiz{a.passed ? '' : ' (not passed)'}
                          </p>
                          <p className={styles.activityTime}>{timeAgo(a.submittedAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Quick links + completion overview */}
              <div className={styles.rightCol}>

                <section className={styles.panel}>
                  <h2 className={styles.panelTitle}>Quick Links</h2>
                  <div className={styles.quickLinks}>
                    {QUICK_LINKS.map((link) => (
                      <button
                        key={link.path}
                        type="button"
                        className={styles.quickLink}
                        onClick={() => navigate(link.path)}
                      >
                        <Icon name={link.icon} size={17} />
                        {link.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className={styles.panel} style={{ marginTop: 'var(--space-6)' }}>
                  <h2 className={styles.panelTitle}>Completion Rate by Module</h2>
                  {modules.map((m) => {
                    const summary = moduleSummaries[m.id]
                    return (
                      <div key={m.id} className={styles.progressRow}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressName}>{m.name}</span>
                          <span className={styles.progressPct}>
                            {summary ? `${summary.completionRate}%` : 'Not yet aggregated'}
                          </span>
                        </div>
                        <div className={styles.progressTrack}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${summary ? summary.completionRate : 0}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </section>

              </div>
            </div>
          </>
        )}
      </div>

      {showTour && <TourGuide steps={TOUR_STEPS} onFinish={finishTour} />}
    </DashboardLayout>
  )
}
