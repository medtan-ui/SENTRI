import React from 'react'
import { getCurrentUser } from '../../services/authService'
import styles from './Navbar.module.css'

export default function Navbar({ onToggleSidebar }) {
  const user = getCurrentUser()

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
        <span className={styles.brand}>SENTRI</span>
      </div>

      <div className={styles.right}>
        <div className={styles.userBadge}>
          <span className={styles.avatar} aria-hidden="true">
            {user?.displayName?.[0] ?? 'U'}
          </span>
          <span className={styles.userName}>{user?.displayName ?? 'User'}</span>
          <span className={styles.roleTag}>{user?.role ?? ''}</span>
        </div>
      </div>
    </header>
  )
}
