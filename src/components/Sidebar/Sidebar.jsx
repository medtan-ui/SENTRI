import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../services/authService'
import styles from './Sidebar.module.css'

const STUDENT_NAV = [
  { label: 'Dashboard',        path: '/student/dashboard', icon: '⊞' },
  { label: 'Modules',          path: '/student/modules',   icon: '📚' },
  { label: 'Scenario Training',path: '/student/scenarios', icon: '🛡' },
  { label: 'Quiz',             path: '/student/quiz',      icon: '✎' },
  { label: 'Progress',         path: '/student/progress',  icon: '📈' },
  { label: 'Profile',          path: '/student/profile',   icon: '👤' },
]

const ADMIN_NAV = [
  { label: 'Dashboard',    path: '/admin/dashboard',  icon: '⊞' },
  { label: 'Students',     path: '/admin/students',   icon: '👥' },
  { label: 'Modules',      path: '/admin/modules',    icon: '📚' },
  { label: 'Scenarios',    path: '/admin/scenarios',  icon: '🛡' },
  { label: 'Quiz Manager', path: '/admin/quizzes',    icon: '✎' },
  { label: 'Analytics',    path: '/admin/analytics',  icon: '📊' },
  { label: 'Settings',     path: '/admin/settings',   icon: '⚙' },
]

export default function Sidebar({ role = 'student', isOpen, onClose }) {
  const navigate = useNavigate()
  const navItems = role === 'admin' ? ADMIN_NAV : STUDENT_NAV

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
      >
        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.brandLogo}>S</span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>SENTRI</span>
            <span className={styles.brandSub}>Training System</span>
          </div>
        </div>

        {/* Nav items */}
        <ul className={styles.navList} role="list">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                onClick={onClose}
              >
                <span className={styles.icon} aria-hidden="true">{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout at bottom */}
        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.icon} aria-hidden="true">⎋</span>
            <span className={styles.label}>Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}
