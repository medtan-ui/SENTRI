import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import EditNicknameSection from '../../../components/EditNicknameSection/EditNicknameSection'
import ChangePasswordSection from '../../../components/ChangePasswordSection/ChangePasswordSection'
import BadgeCard, { ALL_BADGE_CATALOG } from '../../../components/Badges/BadgeCard'
import { useAuth } from '../../../context/AuthContext'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import { getUserBadges } from '../../../services/badgeService'
import styles from './StudentProfilePage.module.css'

const QUICK_LINKS = [
  { label: 'View My Progress', path: '/student/progress', icon: '📈' },
  { label: 'My Modules', path: '/student/modules', icon: '📚' },
]

/**
 * StudentProfilePage — /student/profile
 * Identity, a compact stats row, badges showcase, self-service profile/security controls
 * (nickname, password), and quick navigation — Settings no longer exists
 * as a separate page, so its useful bits live here instead.
 */
export default function StudentProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { modules } = useStudentModules()
  const [userBadges, setUserBadges] = useState([])

  useEffect(() => {
    if (user?.uid) {
      getUserBadges(user.uid).then(setUserBadges).catch(console.error)
    }
  }, [user?.uid])

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

  const unlockedIds = new Set(userBadges.map((b) => b.id))

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

        {/* ── Badges Showcase ── */}
        <Card>
          <h2 className={styles.cardTitle}>🏆 Achievement Badges ({userBadges.length} / {ALL_BADGE_CATALOG.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {ALL_BADGE_CATALOG.map((badge) => {
              const unlockedBadge = userBadges.find((b) => b.id === badge.id)
              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={unlockedIds.has(badge.id)}
                  unlockedAt={unlockedBadge?.unlockedAt}
                />
              )
            })}
          </div>
        </Card>

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
                <span aria-hidden="true">{link.icon}</span> {link.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

