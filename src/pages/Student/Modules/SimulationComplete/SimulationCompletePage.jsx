import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import { loadModuleConfig } from '../../../../services/moduleLoader'
import { useModuleProgress, describeModuleStatus } from '../../../../context/ModuleProgressContext'
import styles from './SimulationCompletePage.module.css'

/**
 * SimulationCompletePage — /student/modules/:moduleId/simulation-complete
 * Reusable "what's next" screen after a module's simulation is finished.
 * Distinct from the Scenario Engine's own internal ScenarioComplete
 * screen (which shows safe/risky stats right after the last scenario) —
 * this page is the app-level landing spot afterward, with real next
 * steps: the quiz (not built yet) or returning to the dashboard.
 */
export default function SimulationCompletePage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { getModuleStatus } = useModuleProgress()
  const [config, setConfig] = useState(undefined)
  const [quizComingSoon, setQuizComingSoon] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadModuleConfig(moduleId).then((result) => {
      if (!cancelled) setConfig(result)
    })
    return () => {
      cancelled = true
    }
  }, [moduleId])

  const status = getModuleStatus(moduleId)

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
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

          <span className={styles.statusBadge}>{describeModuleStatus(status)}</span>

          <div className={styles.actions}>
            <Button variant="primary" size="lg" onClick={() => setQuizComingSoon(true)}>
              Start Quiz
            </Button>
            {quizComingSoon ? <p className={styles.comingSoon}>Coming Soon</p> : null}
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
