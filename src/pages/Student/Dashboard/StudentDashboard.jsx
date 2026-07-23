import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import ModuleGrid, { MODULE_STATUS_META, moduleDestination } from '../../../components/ModuleGrid/ModuleGrid'
import ModuleProgressList from '../../../components/ModuleProgressList/ModuleProgressList'
import { useAuth } from '../../../context/AuthContext'
import { useStudentModules } from '../../../hooks/useStudentModules'
import { MODULE_STATUS } from '../../../services/moduleProgressService'
import styles from './StudentDashboard.module.css'

const STATUS_DOT_COLOR = {
  [MODULE_STATUS.LOCKED]: '#AAAAAA',
  [MODULE_STATUS.AVAILABLE]: '#2E86AB',
  [MODULE_STATUS.IN_PROGRESS]: '#B8860B',
  [MODULE_STATUS.QUIZ_AVAILABLE]: '#B8860B',
  [MODULE_STATUS.COMPLETED]: '#1E7E34',
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { status, errorMessage, retry, modules } = useStudentModules()

  const inProgressOrNext = modules.find((m) =>
    [MODULE_STATUS.AVAILABLE, MODULE_STATUS.IN_PROGRESS, MODULE_STATUS.QUIZ_AVAILABLE].includes(m.status),
  )

  const completedModules = modules.filter((m) => m.status === MODULE_STATUS.COMPLETED)
  const scoredModules = modules.filter((m) => typeof m.progress?.score === 'number')
  const quizAverage =
    scoredModules.length > 0
      ? Math.round(scoredModules.reduce((sum, m) => sum + m.progress.score, 0) / scoredModules.length)
      : null
  const scenariosCompleted = modules.filter((m) => m.progress?.simulationCompleted).length
  const curriculumPct = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0

  const stats = [
    { label: 'Modules Completed', value: `${completedModules.length} / ${modules.length || 6}`, icon: '📚', accent: '#B8860B' },
    { label: 'Quiz Average', value: quizAverage === null ? '—' : `${quizAverage}%`, icon: '✎', accent: '#2E86AB' },
    { label: 'Scenarios Completed', value: `${scenariosCompleted} / ${modules.length || 6}`, icon: '🎬', accent: '#1E7E34' },
    { label: 'Curriculum Progress', value: `${curriculumPct}%`, icon: '📈', accent: '#C0392B' },
  ]

  const upNext = modules.filter((m) => m.status !== MODULE_STATUS.COMPLETED).slice(0, 3)

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>

        {/* ── Page header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Student Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome back, <strong>{user?.displayName ?? 'Student'}</strong>! Here's your progress overview.
            </p>
          </div>
          <div className={styles.dateBadge}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* ── Continue where you left off ── */}
        {inProgressOrNext && (
          <section className={styles.assignedModule}>
            <div>
              <span className={styles.assignedEyebrow}>
                {inProgressOrNext.status === MODULE_STATUS.AVAILABLE ? 'Up Next' : 'Continue'}
              </span>
              <h2 className={styles.assignedTitle}>{inProgressOrNext.title}</h2>
              <span className={styles.assignedStatus}>{MODULE_STATUS_META[inProgressOrNext.status].label}</span>
            </div>
            <button
              type="button"
              className={styles.assignedBtn}
              onClick={() => navigate(moduleDestination(inProgressOrNext))}
            >
              {MODULE_STATUS_META[inProgressOrNext.status].cta}
            </button>
          </section>
        )}

        {/* ── Stats row ── */}
        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statIcon} style={{ background: s.accent + '18' }}>
                {s.icon}
              </span>
              <div>
                <p className={styles.statValue}>{s.value}</p>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Module grid ── */}
        <section className={styles.moduleSection}>
          <h2 className={styles.sectionHeading}>Your Modules</h2>

          {status === 'loading' && <LoadingSkeleton blocks={3} rows={2} />}
          {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}
          {status === 'success' && <ModuleGrid modules={modules} />}
        </section>

        {/* ── Content columns ── */}
        <div className={styles.columns}>

          {/* What's next in the curriculum */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>What's Next</h2>
            {upNext.length === 0 ? (
              <p className={styles.emptyText}>You've completed every module. Nice work!</p>
            ) : (
              <ul className={styles.taskList}>
                {upNext.map((m) => {
                  const destination = moduleDestination(m)
                  return (
                    <li key={m.moduleId} className={styles.taskItem}>
                      <button
                        type="button"
                        className={styles.taskButton}
                        disabled={!destination}
                        onClick={() => destination && navigate(destination)}
                      >
                        <div className={styles.taskMeta}>
                          <span className={styles.statusDot} style={{ background: STATUS_DOT_COLOR[m.status] }} />
                          <div>
                            <p className={styles.taskTitle}>{m.title}</p>
                            <p className={styles.taskDue}>{MODULE_STATUS_META[m.status].label}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Progress overview — same six modules, real data */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Module Progress</h2>
            <ModuleProgressList modules={modules} />
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
