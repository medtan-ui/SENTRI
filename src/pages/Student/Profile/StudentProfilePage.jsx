import React from 'react'
import Icon from '../../../components/Icon/Icon'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import EditNicknameSection from '../../../components/EditNicknameSection/EditNicknameSection'
import ChangePasswordSection from '../../../components/ChangePasswordSection/ChangePasswordSection'
import { useAuth } from '../../../context/AuthContext'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import styles from './StudentProfilePage.module.css'

const QUICK_LINKS = [
  { label: 'View My Progress', path: '/student/progress', icon: 'chart' },
  { label: 'My Modules', path: '/student/modules', icon: 'book' },
]

/**
 * StudentProfilePage — /student/profile
 * Identity, a compact stats row, self-service profile/security controls
 * (nickname, password), and quick navigation — Settings no longer exists
 * as a separate page, so its useful bits live here instead.
 */
export default function StudentProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { modules } = useStudentModules()

  const name = user?.nickname || user?.displayName || user?.email
  const initials = (name || '?')
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
            <h2 className={styles.name}>{name ?? 'Student'}</h2>
            {user?.displayName && user.displayName !== name && (
              <p className={styles.fullName}>{user.displayName}</p>
            )}
            <p className={styles.email}>{user?.email}</p>
            <div className={styles.badgeRow}>
              <span className={styles.roleBadge}>Student</span>
              <span className={user?.emailVerified ? styles.verifiedBadge : styles.unverifiedBadge}>
                {user?.emailVerified ? '✓ Verified' : '⚠ Not verified'}
              </span>
            </div>
          </div>
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

        <EditNicknameSection />
        <ChangePasswordSection />

        <Card className={styles.linksCard}>
          <h2 className={styles.cardTitle}>Quick Links</h2>
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
        </Card>
      </div>
    </DashboardLayout>
  )
}
