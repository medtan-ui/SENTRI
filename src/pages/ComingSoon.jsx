import React from 'react'
import { useLocation } from 'react-router-dom'
import DashboardLayout from '../components/Layout/DashboardLayout'
import { getCurrentUser } from '../services/authService'
import styles from './ComingSoon.module.css'

export default function ComingSoon() {
  const user = getCurrentUser()
  const location = useLocation()

  // Derive a friendly page name from the URL path
  const segments = location.pathname.split('/').filter(Boolean)
  const pageName = segments[segments.length - 1]
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Page'

  const role = user?.role ?? 'student'

  return (
    <DashboardLayout role={role}>
      <div className={styles.center}>
        <div className={styles.icon}>🛠</div>
        <h2 className={styles.title}>{pageName}</h2>
        <p className={styles.message}>
          This section is under construction and will be available in a future release.
        </p>
        <span className={styles.badge}>Coming Soon</span>
      </div>
    </DashboardLayout>
  )
}
