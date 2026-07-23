import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../Layout/DashboardLayout'
import Card from '../Card/Card'
import Button from '../Button/Button'
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../ErrorState/ErrorState'
import { useModuleList } from '../../hooks/useModule'
import styles from './ModulePickerGrid.module.css'

/**
 * ModulePickerGrid
 * Shared shell for admin landing pages that don't own an editor of their
 * own — they just pick which of the six modules to configure. Used by
 * ScenarioManagerPage and QuizManagerPage: both jump straight into
 * ModuleConfigurationPage with a tab pre-selected via `?tab=`, instead of
 * duplicating the real editors (ScenarioConfigTab/QuizConfigTab) that
 * already live there.
 *
 * @param {{ title: string, subtitle: string, tab: string, actionLabel: string }} props
 */
export default function ModulePickerGrid({ title, subtitle, tab, actionLabel }) {
  const navigate = useNavigate()
  const { status, errorMessage, retry, modules } = useModuleList()

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {status === 'loading' && <LoadingSkeleton blocks={3} rows={3} />}
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
                </div>
                <h2 className={styles.moduleName}>{m.name}</h2>
                <p className={styles.moduleDescription}>{m.description}</p>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate(`/admin/modules/${m.id}/configure?tab=${tab}`)}
                >
                  {actionLabel}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
