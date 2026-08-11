import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from '../Icon/Icon'
import Tooltip from '../Tooltip/Tooltip'
import logo from '../../assets/images/logo.png'
import styles from './Navbar.module.css'

/**
 * Navbar
 * The fixed top bar: a hamburger + home logo on the left, the signed-in
 * user's profile button on the right.
 *
 * XP and streak used to live here as a pair of chips. They've moved into
 * the dashboard hero's rank/streak panel, which is now itself the
 * clickable link to Progress (see StudentDashboard's `.heroRewards`) — so
 * the same "tap to see the full picture" affordance survives in one place
 * instead of two, and this bar no longer has anything that has to
 * disappear at narrow widths.
 */
export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const name = user?.nickname || user?.displayName

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
        <Tooltip label="SENTRI" position="bottom">
          <button
            type="button"
            className={styles.homeBtn}
            onClick={() => user && navigate(`/${user.role}/dashboard`)}
            aria-label="Go to your dashboard"
          >
            <img src={logo} alt="" className={styles.homeLogo} />
          </button>
        </Tooltip>
      </div>

      <div className={styles.right}>
        <Tooltip label={name || 'Profile'} position="bottom">
          <button
            type="button"
            className={styles.userBadge}
            data-tour="profile"
            onClick={() => user && navigate(`/${user.role}/profile`)}
            aria-label="View your profile"
          >
            <span className={styles.avatar} aria-hidden="true">
              {name?.[0] ?? 'U'}
            </span>
            <span className={styles.userName}>{name ?? 'User'}</span>
            <span className={styles.roleTag}>{user?.role ?? ''}</span>
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
