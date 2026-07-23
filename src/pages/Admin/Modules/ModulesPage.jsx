import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useModuleList } from '../../../hooks/useModule'
import { updateModule } from '../../../services/moduleService'
import styles from './ModulesPage.module.css'

/**
 * ModulesPage
 * SENTRI's cybersecurity curriculum is fixed — exactly six modules,
 * always present. Admins don't create, delete, duplicate, archive, or
 * publish modules here; this is a real-data overview (via useModuleList,
 * Firestore-backed) with one curriculum-wide control: reordering, via the
 * up/down arrows below each card. Order is the actual unlock mechanism
 * (see moduleProgressService.js) — there is no separate "prerequisite"
 * picker or enabled/disabled toggle anymore.
 */
export default function ModulesPage() {
  const navigate = useNavigate()
  const { status, errorMessage, retry, modules } = useModuleList()
  const [reordering, setReordering] = useState(null) // moduleId currently being moved, or null

  function openConfiguration(moduleId) {
    navigate(`/admin/modules/${moduleId}/configure`)
  }

  async function move(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= modules.length) return
    const current = modules[index]
    const target = modules[targetIndex]
    setReordering(current.id)
    try {
      await Promise.all([
        updateModule(current.id, { moduleOrder: target.moduleOrder }),
        updateModule(target.id, { moduleOrder: current.moduleOrder }),
      ])
      retry()
    } catch (err) {
      console.error('[ModulesPage] reorder failed:', err)
    } finally {
      setReordering(null)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Cybersecurity Training Curriculum</h1>
          <p className={styles.subtitle}>
            Manage content and settings for the six core training modules, and arrange the order students unlock
            them in.
          </p>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={4} />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={retry} />}

        {status === 'success' && (
          <div className={styles.grid}>
            {modules.map((m, index) => (
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

                <div className={styles.reorderRow}>
                  <span className={styles.infoLabel}>Curriculum Order</span>
                  <div className={styles.reorderButtons}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === 0 || reordering}
                      onClick={() => move(index, -1)}
                      title="Move earlier"
                    >
                      ↑ Earlier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === modules.length - 1 || reordering}
                      onClick={() => move(index, 1)}
                      title="Move later"
                    >
                      ↓ Later
                    </Button>
                  </div>
                </div>

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
