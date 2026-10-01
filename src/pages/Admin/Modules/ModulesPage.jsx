import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useModuleList } from '../../../hooks/useModule'
import styles from './ModulesPage.module.css'

/**
 * ModulesPage
 * SENTRI's cybersecurity curriculum is fixed — exactly six modules,
 * always present. Admins don't create, delete, duplicate, archive, or
 * publish modules here; this is a real-data overview (via useModuleList,
 * Firestore-backed). Order is fixed to standard curriculum progression.
 */
export default function ModulesPage() {
  const navigate = useNavigate()
  const { status, errorMessage, retry, modules } = useModuleList()

  function openConfiguration(moduleId) {
    navigate(`/admin/modules/${moduleId}/configure`)
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Cybersecurity Training Curriculum</h1>
          <p className={styles.subtitle}>
            Manage content and settings for the six core training modules.
          </p>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={4} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

        {status === 'success' && (
          <div className={styles.grid}>
            {modules.map((m) => (
              <Card key={m.id} className={styles.moduleCard}>
                <div className={styles.cardHeader}>
                  <span
                    className={styles.iconTile}
                    style={{ background: `${m.color}18`, color: m.color }}
                    aria-hidden="true"
                  >
                    {m.icon}
                  </span>
                  <span className={styles.orderBadge}>Position {m.moduleOrder} of {modules.length}</span>
                </div>

                <h2 className={styles.moduleName}>{m.name}</h2>
                <p className={styles.moduleDescription}>{m.description}</p>

                <div className={styles.metaRow}>
                  <span className={styles.difficultyBadge} data-difficulty={(m.difficulty || '').toLowerCase()}>
                    {m.difficulty}
                  </span>
                  <span className={styles.timeText}>⏱ {m.estimatedTime}</span>
                </div>

                <div className={styles.divider} />

                <Button variant="primary" fullWidth onClick={() => openConfiguration(m.id)}>
                  Manage
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

