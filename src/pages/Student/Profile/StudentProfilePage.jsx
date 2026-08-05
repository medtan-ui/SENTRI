import React from 'react'
import Icon from '../../../components/Icon/Icon'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import EditNicknameSection from '../../../components/EditNicknameSection/EditNicknameSection'
import ChangePasswordSection from '../../../components/ChangePasswordSection/ChangePasswordSection'
import BadgeShelf from '../../../components/Gamification/BadgeShelf'
import { resetFirstRunTour } from '../../../components/TourGuide/useFirstRunTour'
import { useAuth } from '../../../context/AuthContext'
import { useGamificationState } from '../../../context/GamificationContext'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import styles from './StudentProfilePage.module.css'

const QUICK_LINKS = [
  { label: 'View My Progress', path: '/student/progress', icon: 'chart' },
  { label: 'My Modules', path: '/student/modules', icon: 'book' },
]

/**
 * StudentProfilePage — /student/profile
 * Identity, a compact stats row, badges showcase, self-service profile/security controls
 * (nickname, password), and quick navigation — Settings no longer exists
 * as a separate page, so its useful bits live here instead.
 *
 * The badge showcase reads from the same gamification context the
 * dashboard and the Progress page use. It briefly did not: a second
 * badge system existed alongside this one, with its own five-badge
 * catalog, its own Firestore collection and its own Cloud Function, and
 * this page was its only consumer. Two systems meant a student could see
 * a badge here that the dashboard did not know about, and one named
 * "Streak Hero" that had nothing to do with streaks. There is one
 * catalog now (functions/src/modules/gamification/catalog.ts), and the
 * two badges worth keeping from the other one were absorbed into it.
 */
export default function StudentProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { modules } = useStudentModules()
  const { status: rewardStatus, gamification, catalog } = useGamificationState()

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

  const rewardsReady = rewardStatus === 'success' && gamification
  const earnedBadges = gamification?.badges ?? []

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

        {/* ── Badges ── */}
        <Card className={styles.badgesCard}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Achievement badges</h2>
            {rewardsReady && (
              <span className={styles.countTag}>
                {earnedBadges.length} of {catalog.length} earned
              </span>
            )}
          </div>
          {rewardStatus === 'loading' && <p className={styles.emptyText}>Loading your badges…</p>}
          {rewardStatus === 'error' && (
            <p className={styles.emptyText}>Your badges could not be loaded right now.</p>
          )}
          {rewardsReady && <BadgeShelf catalog={catalog} earnedIds={earnedBadges} />}
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
                <Icon name={link.icon} size={17} />
                {link.label}
              </button>
            ))}
            {/* The first-run tour tells students they can come back to it
                from here, so this is what makes that true. Clearing the
                flag and landing on the dashboard is all it takes — the
                tour offers itself whenever the flag is absent. */}
            <button
              type="button"
              className={styles.quickLink}
              onClick={() => {
                resetFirstRunTour(user?.uid)
                navigate('/student/dashboard')
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

