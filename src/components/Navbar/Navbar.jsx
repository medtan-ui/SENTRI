import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Navbar.module.css'

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
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
        <span className={styles.brand}>SENTRI</span>
      </div>

      <div className={styles.right}>
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
