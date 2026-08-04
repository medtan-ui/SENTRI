import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from '../Icon/Icon'
import logo from '../../assets/images/logo.png'
import styles from './Sidebar.module.css'

/**
 * Nav items are grouped rather than listed flat. Seven admin links in one
 * unbroken column read as seven equally-weighted choices; split into
 * "what students see" and "what I configure", the same seven links become
 * two short decisions. The group label is the cheapest structure
 * available — no extra clicks, no collapsing, no state to get wrong.
 */
const STUDENT_NAV = [
  {
    items: [
      { label: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
      { label: 'Modules', path: '/student/modules', icon: 'book' },
      { label: 'Quiz', path: '/student/quiz', icon: 'quiz' },
    ],
  },
  {
    title: 'You',
    items: [
      { label: 'Progress', path: '/student/progress', icon: 'chart' },
      { label: 'Profile', path: '/student/profile', icon: 'user' },
    ],
  },
]

const ADMIN_NAV = [
  {
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
      { label: 'Analytics', path: '/admin/analytics', icon: 'analytics' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Modules', path: '/admin/modules', icon: 'book' },
      { label: 'Scenarios', path: '/admin/scenarios', icon: 'shield' },
      { label: 'Quiz Manager', path: '/admin/quizzes', icon: 'quiz' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Accounts', path: '/admin/accounts', icon: 'users' },
      { label: 'Profile', path: '/admin/profile', icon: 'user' },
    ],
  },
]

export default function Sidebar({ role = 'student', isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const navGroups = role === 'admin' ? ADMIN_NAV : STUDENT_NAV

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        aria-label="Main navigation"
        data-surface="dark"
      >
        {/* Brand */}
        <div className={styles.brand}>
          <img src={logo} alt="SENTRI logo" className={styles.brandLogo} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>SENTRI</span>
            <span className={styles.brandSub}>Training System</span>
          </div>
        </div>

        {/* Nav items */}
        <div className={styles.navScroll}>
          {navGroups.map((group, groupIndex) => (
            <div key={group.title ?? `group-${groupIndex}`} className={styles.navGroup}>
              {group.title && <p className={styles.navGroupTitle}>{group.title}</p>}
              <ul className={styles.navList} role="list">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `${styles.navLink} ${isActive ? styles.active : ''}`
                      }
                      onClick={onClose}
                    >
                      <span className={styles.iconSlot}>
                        <Icon name={item.icon} size={18} />
                      </span>
                      <span className={styles.label}>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Logout at bottom */}
        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.iconSlot}>
              <Icon name="logout" size={18} />
            </span>
            <span className={styles.label}>Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}
