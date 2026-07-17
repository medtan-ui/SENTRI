import React, { useState } from 'react'
import Navbar from '../Navbar/Navbar'
import Sidebar from '../Sidebar/Sidebar'
import styles from './DashboardLayout.module.css'

/**
 * DashboardLayout
 * Wraps all authenticated pages: fixed Navbar + collapsible Sidebar + scrollable main.
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
      <Navbar onToggleSidebar={toggleSidebar} />
      <Sidebar role={role} isOpen={sidebarOpen} onClose={closeSidebar} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
