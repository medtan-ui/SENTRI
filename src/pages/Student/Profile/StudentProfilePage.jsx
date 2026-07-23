import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import { useAuth } from '../../../context/AuthContext'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import styles from './StudentProfilePage.module.css'

/**
 * StudentProfilePage — /student/profile
 * Identity + a compact stats row. Security management (password, 2FA)
 * stays on the Settings page rather than being duplicated here.
 */
export default function StudentProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { modules } = useStudentModules()

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const completedCount = modules.filter((m) => m.status === MODULE_STATUS.COMPLETED).length
  const scores = modules.map((m) => m.progress?.score).filter((s) => typeof s === 'number')
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.subtitle}>Your account at a glance.</p>
        </div>

        <Card className={styles.identityCard}>
          <span className={styles.avatar} aria-hidden="true">{initials}</span>
          <div className={styles.identityInfo}>
            <h2 className={styles.name}>{user?.displayName ?? 'Student'}</h2>
            <p className={styles.email}>{user?.email}</p>
            <div className={styles.badgeRow}>
              <span className={styles.roleBadge}>Student</span>
              <span className={user?.emailVerified ? styles.verifiedBadge : styles.unverifiedBadge}>
                {user?.emailVerified ? '✓ Verified' : '⚠ Not verified'}
              </span>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/student/settings')}>
            Account Settings
          </Button>
        </Card>

        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <p className={styles.statValue}>{completedCount} / {modules.length}</p>
            <p className={styles.statLabel}>Modules Completed</p>
          </Card>
          <Card className={styles.statCard}>
            <p className={styles.statValue}>{avgScore === null ? '—' : `${avgScore}%`}</p>
            <p className={styles.statLabel}>Average Quiz Score</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
