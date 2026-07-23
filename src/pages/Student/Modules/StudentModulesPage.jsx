import React from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import ModuleGrid from '../../../components/ModuleGrid/ModuleGrid'
import { useStudentModules } from '../../../hooks/useStudentModules'
import styles from './StudentModulesPage.module.css'

/**
 * StudentModulesPage — /student/modules
 * The full curriculum directory — same data and cards as the Dashboard's
 * "Your Modules" section (see components/ModuleGrid), just as its own
 * page rather than one section among several.
 */
export default function StudentModulesPage() {
  const { status, errorMessage, retry, modules } = useStudentModules()

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Modules</h1>
          <p className={styles.subtitle}>Your full cybersecurity training curriculum, in unlock order.</p>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={2} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}
        {status === 'success' && <ModuleGrid modules={modules} />}
      </div>
    </DashboardLayout>
  )
}
