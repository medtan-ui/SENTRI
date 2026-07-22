import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import { ScenarioEngine, LoadingScreen } from '../../../../features/scenario'
import { loadModuleConfig } from '../../../../services/moduleLoader'
import { useModuleProgress } from '../../../../context/ModuleProgressContext'
import styles from './ScenarioRunnerPage.module.css'

const ENTER_MESSAGES = ['Loading Scenario…', 'Loading module assets…', 'Preparing simulation…']
const EXIT_MESSAGES = ['Simulation Complete', 'Preparing Quiz…']
const STAGE_MS = 550

/**
 * ScenarioRunnerPage — /student/modules/:moduleId/scenario
 * The bridge between the Lesson Viewer and the reusable Scenario Engine.
 * Loads a module's scenario config via loadModuleConfig, hands it to
 * <ScenarioEngine> untouched, and reacts to onSimulationComplete by
 * recording mock progress and moving on to the completion page. The
 * engine itself is not modified — this page only wires it up.
 */
export default function ScenarioRunnerPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { markSimulationComplete } = useModuleProgress()

  // undefined = still loading, null = not found, object = loaded
  const [config, setConfig] = useState(undefined)
  const [phase, setPhase] = useState('entering') // 'entering' | 'engine' | 'exiting' | 'not-found'
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    setConfig(undefined)
    setPhase('entering')
    setMessageIndex(0)
    loadModuleConfig(moduleId).then((result) => {
      if (!cancelled) setConfig(result)
    })
    return () => {
      cancelled = true
    }
  }, [moduleId])

  // Cycle the entry staging messages at a fixed pace.
  useEffect(() => {
    if (phase !== 'entering') return undefined
    if (messageIndex >= ENTER_MESSAGES.length - 1) return undefined
    const timer = setTimeout(() => setMessageIndex((i) => i + 1), STAGE_MS)
    return () => clearTimeout(timer)
  }, [phase, messageIndex])

  // Once the config has resolved and the last staged message has shown,
  // move into the engine (or report a missing config).
  useEffect(() => {
    if (phase !== 'entering') return undefined
    if (config === undefined) return undefined
    if (messageIndex < ENTER_MESSAGES.length - 1) return undefined
    const timer = setTimeout(() => setPhase(config === null ? 'not-found' : 'engine'), STAGE_MS)
    return () => clearTimeout(timer)
  }, [phase, config, messageIndex])

  // Cycle the exit staging messages, then hand off to the completion page.
  useEffect(() => {
    if (phase !== 'exiting') return undefined
    if (messageIndex < EXIT_MESSAGES.length - 1) {
      const timer = setTimeout(() => setMessageIndex((i) => i + 1), STAGE_MS)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(
      () => navigate(`/student/modules/${moduleId}/simulation-complete`),
      STAGE_MS,
    )
    return () => clearTimeout(timer)
  }, [phase, messageIndex, moduleId, navigate])

  function handleSimulationComplete() {
    markSimulationComplete(moduleId)
    setMessageIndex(0)
    setPhase('exiting')
  }

  if (phase === 'not-found') {
    return (
      <DashboardLayout role="student">
        <div className={styles.page}>
          <Card className={styles.errorCard}>
            <h1 className={styles.errorTitle}>Module unavailable</h1>
            <p className={styles.errorSubtitle}>Configuration not found.</p>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
                ← Return to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (phase === 'entering' || phase === 'exiting') {
    const messages = phase === 'entering' ? ENTER_MESSAGES : EXIT_MESSAGES
    return (
      <DashboardLayout role="student">
        <div className={styles.page}>
          <LoadingScreen label={messages[messageIndex]} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <ScenarioEngine config={config.scenario} onSimulationComplete={handleSimulationComplete} />
      </div>
    </DashboardLayout>
  )
}
