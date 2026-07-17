import React from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import { getCurrentUser } from '../../../services/authService'
import styles from './AdminDashboard.module.css'

const STATS = [
  { label: 'Total Students',      value: '148',  icon: '👥', accent: '#2E86AB' },
  { label: 'Active This Week',    value: '92',   icon: '✅', accent: '#1E7E34' },
  { label: 'Modules Published',   value: '8',    icon: '📚', accent: '#B8860B' },
  { label: 'Avg. Quiz Score',     value: '78%',  icon: '📊', accent: '#7B2D8B' },
]

const RECENT_ACTIVITY = [
  { student: 'Maria Santos',    action: 'Completed Module 3',        time: '5 min ago' },
  { student: 'Juan dela Cruz',  action: 'Scored 92% on Phishing Quiz', time: '23 min ago' },
  { student: 'Ana Reyes',       action: 'Started Scenario Training',  time: '1 hr ago' },
  { student: 'Carlo Mendoza',   action: 'Completed Module 2',        time: '2 hr ago' },
  { student: 'Sofia Torres',    action: 'Registered account',        time: '3 hr ago' },
]

const PENDING = [
  { label: 'Pending Quiz Reviews',    count: 14, color: '#B8860B' },
  { label: 'Inactive Students (7d)',  count: 56, color: '#C0392B' },
  { label: 'Modules Awaiting Review', count: 2,  color: '#2E86AB' },
]

export default function AdminDashboard() {
  const user = getCurrentUser()

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

        {/* ── Stats ── */}
        <div className={styles.statsGrid}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statIcon} style={{ background: s.accent + '18' }}>
                {s.icon}
              </span>
              <div>
                <p className={styles.statValue}>{s.value}</p>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Content ── */}
        <div className={styles.columns}>

          {/* Activity feed */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Recent Activity</h2>
            <ul className={styles.activityList}>
              {RECENT_ACTIVITY.map((item, i) => (
                <li key={i} className={styles.activityItem}>
                  <span className={styles.activityAvatar}>
                    {item.student.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                  <div className={styles.activityBody}>
                    <p className={styles.activityText}>
                      <strong>{item.student}</strong> {item.action}
                    </p>
                    <p className={styles.activityTime}>{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Action items + completion overview */}
          <div className={styles.rightCol}>

            {/* Action items */}
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Action Items</h2>
              <div className={styles.pendingList}>
                {PENDING.map((p) => (
                  <div key={p.label} className={styles.pendingItem}>
                    <span className={styles.pendingLabel}>{p.label}</span>
                    <span
                      className={styles.pendingCount}
                      style={{ background: p.color + '18', color: p.color }}
                    >
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Completion breakdown */}
            <section className={styles.panel} style={{ marginTop: 'var(--space-6)' }}>
              <h2 className={styles.panelTitle}>Completion Rate by Module</h2>
              {[
                { name: 'Cybersecurity Basics',   pct: 91 },
                { name: 'Network Safety',          pct: 76 },
                { name: 'Email & Phishing',        pct: 68 },
                { name: 'Phishing Recognition',    pct: 42 },
                { name: 'Social Engineering',      pct: 18 },
              ].map((m) => (
                <div key={m.name} className={styles.progressRow}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressName}>{m.name}</span>
                    <span className={styles.progressPct}>{m.pct}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
