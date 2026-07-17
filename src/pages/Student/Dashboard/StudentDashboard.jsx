import React from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import { getCurrentUser } from '../../../services/authService'
import styles from './StudentDashboard.module.css'

// ── Quick stats ──
const STATS = [
  { label: 'Modules Completed', value: '3 / 8',  icon: '📚', accent: '#B8860B' },
  { label: 'Quiz Average',       value: '84%',    icon: '✎',  accent: '#2E86AB' },
  { label: 'Training Hours',     value: '6.5 hr', icon: '⏱',  accent: '#1E7E34' },
  { label: 'Current Streak',     value: '4 days', icon: '🔥',  accent: '#C0392B' },
]

// ── Upcoming items ──
const UPCOMING = [
  { title: 'Phishing Recognition — Module 4',    due: 'Due Jul 20',  status: 'In Progress' },
  { title: 'Social Engineering Scenarios',        due: 'Due Jul 25',  status: 'Not Started' },
  { title: 'Password Security Quiz',              due: 'Due Jul 28',  status: 'Not Started' },
]

export default function StudentDashboard() {
  const user = getCurrentUser()

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>

        {/* ── Page header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Student Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome back, <strong>{user?.displayName ?? 'Student'}</strong>! Here's your progress overview.
            </p>
          </div>
          <div className={styles.dateBadge}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* ── Stats row ── */}
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

        {/* ── Content columns ── */}
        <div className={styles.columns}>

          {/* Upcoming tasks */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Upcoming Tasks</h2>
            <ul className={styles.taskList}>
              {UPCOMING.map((item) => (
                <li key={item.title} className={styles.taskItem}>
                  <div className={styles.taskMeta}>
                    <span
                      className={styles.statusDot}
                      style={{
                        background: item.status === 'In Progress' ? '#B8860B' : '#AAAAAA',
                      }}
                    />
                    <div>
                      <p className={styles.taskTitle}>{item.title}</p>
                      <p className={styles.taskDue}>{item.due} · {item.status}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Progress overview */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Module Progress</h2>
            {[
              { name: 'Cybersecurity Basics',    pct: 100 },
              { name: 'Network Safety',           pct: 100 },
              { name: 'Email & Phishing',         pct: 100 },
              { name: 'Phishing Recognition',     pct: 45  },
              { name: 'Social Engineering',       pct: 0   },
            ].map((m) => (
              <div key={m.name} className={styles.progressRow}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressName}>{m.name}</span>
                  <span className={styles.progressPct}>{m.pct}%</span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${m.pct}%`,
                      background: m.pct === 100 ? '#1E7E34' : 'var(--color-gold)',
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
