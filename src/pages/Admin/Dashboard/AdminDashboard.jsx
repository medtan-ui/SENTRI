import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useAuth } from '../../../context/AuthContext'
import { useAdminOverview } from '../../../hooks/useAdminOverview'
import { timeAgo } from '../../../utils/timeAgo'
import styles from './AdminDashboard.module.css'

const QUICK_LINKS = [
  { label: 'Modules', path: '/admin/modules', icon: '📚' },
  { label: 'Scenarios', path: '/admin/scenarios', icon: '🎬' },
  { label: 'Quizzes', path: '/admin/quizzes', icon: '📝' },
  { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
  { label: 'Accounts', path: '/admin/accounts', icon: '👥' },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { status, errorMessage, retry, modules, users, recentAttempts, moduleSummaries } = useAdminOverview()

  const studentCount = users.filter((u) => u.role === 'student').length
  const avgScore =
    recentAttempts.length > 0
      ? Math.round(recentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / recentAttempts.length)
      : null

  function moduleTitle(moduleId) {
    return modules.find((m) => m.id === moduleId)?.name || moduleId
  }

  function studentName(userId) {
    return users.find((u) => u.uid === userId)?.displayName || 'A student'
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome, <strong>{user?.displayName ?? 'Administrator'}</strong>. Here's your system overview.
            </p>
          </div>
          <div className={styles.dateBadge}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={3} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

        {status === 'success' && (
          <>
            {/* ── Stats ── */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statIcon} style={{ background: '#2E86AB18' }}>👥</span>
                <div>
                  <p className={styles.statValue}>{users.length}</p>
                  <p className={styles.statLabel}>Total Accounts</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon} style={{ background: '#1E7E3418' }}>🎓</span>
                <div>
                  <p className={styles.statValue}>{studentCount}</p>
                  <p className={styles.statLabel}>Students</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon} style={{ background: '#B8860B18' }}>📚</span>
                <div>
                  <p className={styles.statValue}>{modules.length}</p>
                  <p className={styles.statLabel}>Curriculum Modules</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon} style={{ background: '#7B2D8B18' }}>📊</span>
                <div>
                  <p className={styles.statValue}>{avgScore === null ? '—' : `${avgScore}%`}</p>
                  <p className={styles.statLabel}>Avg. Recent Quiz Score</p>
                </div>
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
                        <span aria-hidden="true">{link.icon}</span> {link.label}
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
    </DashboardLayout>
  )
}
