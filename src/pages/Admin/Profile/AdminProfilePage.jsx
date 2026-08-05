import React, { useEffect, useState } from 'react'
import Icon from '../../../components/Icon/Icon'
import { resetFirstRunTour } from '../../../components/TourGuide/useFirstRunTour'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import EditNicknameSection from '../../../components/EditNicknameSection/EditNicknameSection'
import ChangePasswordSection from '../../../components/ChangePasswordSection/ChangePasswordSection'
import { useAuth } from '../../../context/AuthContext'
import { listUsers } from '../../../services/adminService'
import styles from './AdminProfilePage.module.css'

const QUICK_LINKS = [
  { label: 'Manage Accounts', path: '/admin/accounts', icon: 'users' },
  { label: 'View Analytics', path: '/admin/analytics', icon: 'analytics' },
]

/**
 * AdminProfilePage — /admin/profile
 * Identity, a compact stats row, self-service profile/security controls
 * (nickname, password), and quick navigation — Settings no longer exists
 * as a separate page, so its useful bits live here instead.
 */
export default function AdminProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    let cancelled = false
    listUsers()
      .then((users) => {
        if (cancelled) return
        setCounts({
          total: users.length,
          students: users.filter((u) => u.role === 'student').length,
          admins: users.filter((u) => u.role === 'admin').length,
        })
      })
      .catch(() => {
        if (!cancelled) setCounts(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const name = user?.nickname || user?.displayName
  const initials = (name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.subtitle}>Your account at a glance.</p>
        </div>

        <Card className={styles.identityCard}>
          <span className={styles.avatar} aria-hidden="true">{initials}</span>
          <div className={styles.identityInfo}>
            <h2 className={styles.name}>{name ?? 'Admin'}</h2>
            {user?.displayName && user.displayName !== name && (
              <p className={styles.fullName}>{user.displayName}</p>
            )}
            <p className={styles.email}>{user?.email}</p>
            <div className={styles.badgeRow}>
              <span className={styles.roleBadge}>Administrator</span>
              <span className={user?.emailVerified ? styles.verifiedBadge : styles.unverifiedBadge}>
                {user?.emailVerified ? '✓ Verified' : '⚠ Not verified'}
              </span>
            </div>
          </div>
        </Card>

        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <p className={styles.statValue}>{counts ? counts.total : '—'}</p>
            <p className={styles.statLabel}>Total Accounts</p>
          </Card>
          <Card className={styles.statCard}>
            <p className={styles.statValue}>{counts ? counts.students : '—'}</p>
            <p className={styles.statLabel}>Students</p>
          </Card>
          <Card className={styles.statCard}>
            <p className={styles.statValue}>{counts ? counts.admins : '—'}</p>
            <p className={styles.statLabel}>Admins</p>
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
            {/* Matches the student profile. The admin tour's own copy
                says it can be reopened from here, so it must be. */}
            <button
              type="button"
              className={styles.quickLink}
              onClick={() => {
                resetFirstRunTour(user?.uid)
                navigate('/admin/dashboard')
              }}
            >
              <Icon name="play" size={17} />
              Replay the tour
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
