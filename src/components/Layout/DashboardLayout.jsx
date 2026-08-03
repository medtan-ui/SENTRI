import React, { useState } from 'react'
import Navbar from '../Navbar/Navbar'
import Sidebar from '../Sidebar/Sidebar'
import styles from './DashboardLayout.module.css'

/**
 * DashboardLayout
 * Wraps all authenticated pages: fixed Navbar + collapsible Sidebar + scrollable main.
 *
 * The chrome carries `data-print-hide` so printing a page (the Analytics
 * page's "Save as PDF" export) yields the page's own content rather than a
 * screenshot of the app. See the @media print block in global.css.
 */
export default function DashboardLayout({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev)
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <div className={styles.root}>
      <div className={styles.chrome} data-print-hide>
        <Navbar onToggleSidebar={toggleSidebar} />
        <Sidebar role={role} isOpen={sidebarOpen} onClose={closeSidebar} />
      </div>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
