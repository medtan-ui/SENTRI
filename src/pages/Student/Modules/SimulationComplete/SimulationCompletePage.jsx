import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import ModuleAccessGuard from '../../../../components/ModuleAccessGuard/ModuleAccessGuard'
import { loadModuleConfig } from '../../../../services/moduleLoader'
import styles from './SimulationCompletePage.module.css'

/**
 * SimulationCompletePage — /student/modules/:moduleId/simulation-complete
 * Reusable "what's next" screen after a module's simulation is finished.
 * Distinct from the Scenario Engine's own internal ScenarioComplete
 * screen (which shows safe/risky stats right after the last scenario) —
 * this page is the app-level landing spot afterward, with real next
 * steps: the quiz or returning to the dashboard. Only reachable once
 * simulationCompleted is true (ModuleAccessGuard), so the badge below
 * can say so unconditionally rather than re-deriving status.
 */
export default function SimulationCompletePage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [config, setConfig] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    loadModuleConfig(moduleId).then((result) => {
      if (!cancelled) setConfig(result)
    })
    return () => {
      cancelled = true
    }
  }, [moduleId])

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <ModuleAccessGuard moduleId={moduleId} require="simulation">
          <Card className={styles.card}>
            <span className={styles.icon} aria-hidden="true">🎉</span>
            <h1 className={styles.heading}>Simulation Complete</h1>
            <p className={styles.subheading}>Great job!</p>
            {config ? <p className={styles.moduleTitle}>{config.title}</p> : null}

            <p className={styles.body}>
              You have completed the interactive simulation.
              <br />
              Your quiz is now available.
            </p>

            <span className={styles.statusBadge}>Quiz Available</span>

            <div className={styles.actions}>
              <Button variant="primary" size="lg" onClick={() => navigate(`/student/modules/${moduleId}/quiz`)}>
                Start Quiz
              </Button>
              <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </Card>
        </ModuleAccessGuard>
      </div>
    </DashboardLayout>
  )
}
