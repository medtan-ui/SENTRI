import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGamificationState } from '../../context/GamificationContext'
import Icon from '../Icon/Icon'
import RewardChip from '../Gamification/RewardChip'
import styles from './Navbar.module.css'

/**
 * Navbar
 * The fixed top bar. For students it also carries the two reward figures
 * that are worth seeing everywhere rather than only on the dashboard:
 * total XP and the current streak.
 *
 * They live here, small, instead of as cards on every page. A streak's
 * whole job is to be visible on the day you might skip; a number in the
 * corner does that, while a card demanding attention on six different
 * screens is how a training app starts feeling like a slot machine.
 * Clicking either goes to Progress, where the full picture is.
 */
export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { status, gamification } = useGamificationState()

  const name = user?.nickname || user?.displayName
  const showRewards = user?.role === 'student' && status === 'success' && gamification

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          data-tour-menu-toggle
        >
          <Icon name="menu" size={20} />
        </button>
        <span className={styles.brand}>SENTRI</span>
      </div>

      <div className={styles.right}>
        {showRewards && (
          <button
            type="button"
            className={styles.rewards}
            data-tour="rewards"
            onClick={() => navigate('/student/progress')}
            aria-label={`${gamification.points} XP, ${gamification.currentStreak} day streak. View your progress.`}
          >
            <RewardChip tone="xp" icon="bolt" value={`${gamification.points} XP`} label="experience points" />
            <RewardChip
              tone="streak"
              icon="flame"
              value={gamification.currentStreak}
              label="day streak"
              muted={!gamification.currentStreak}
            />
          </button>
        )}

        <button
          type="button"
          className={styles.userBadge}
          onClick={() => user && navigate(`/${user.role}/profile`)}
          aria-label="View your profile"
        >
          <span className={styles.avatar} aria-hidden="true">
            {name?.[0] ?? 'U'}
          </span>
          <span className={styles.userName}>{name ?? 'User'}</span>
          <span className={styles.roleTag}>{user?.role ?? ''}</span>
        </button>
      </div>
    </header>
  )
}
