import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button'
import styles from './ModuleConfigurationPage.module.css'

/**
 * ScenarioTab
 * Read-only display of the module's scenario. "Configure Scenario" is a
 * navigation placeholder only — the scenario editor doesn't exist yet.
 */
export default function ScenarioTab({ moduleId, scenario }) {
  const navigate = useNavigate()

  return (
    <div>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Scenario Title</span>
          <span className={styles.infoValue}>{scenario.title}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Scenario Description</span>
          <span className={styles.infoValue}>{scenario.description}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Scenario Status</span>
          <span className={styles.statusBadge} data-status={scenario.status.toLowerCase()}>{scenario.status}</span>
        </div>
      </div>

      <Button variant="primary" onClick={() => navigate(`/admin/modules/${moduleId}/scenario`)}>
        Configure Scenario
      </Button>
    </div>
  )
}
