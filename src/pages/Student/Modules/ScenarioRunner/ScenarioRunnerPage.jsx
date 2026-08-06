import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import ModuleAccessGuard from '../../../../components/ModuleAccessGuard/ModuleAccessGuard'
import LoadingScreen from '../../../../features/scenario/components/LoadingScreen'
import ScenarioEngine from '../../../../features/scenario/engine/ScenarioEngine'
import ScenarioIntroTutorial from '../../../../features/scenario/engine/ScenarioIntroTutorial'
import { loadModuleConfig } from '../../../../services/moduleLoader'
import { recordEvent, startTimedEvent } from '../../../../services/analyticsEventService'
import { useModuleProgress } from '../../../../hooks/useModuleProgress'
import styles from './ScenarioRunnerPage.module.css'

const ENTER_MESSAGES = ['Loading Scenario…', 'Loading module assets…', 'Preparing simulation…']
const EXIT_MESSAGES = ['Simulation Complete', 'Preparing Quiz…']
const STAGE_MS = 550

/**
 * ScenarioRunnerPage — /student/modules/:moduleId/scenario
 * The bridge between the Lesson Viewer and the reusable Scenario Engine
 * (src/features/scenario/engine/) — diegetic, target-based interaction,
 * not a "what should you do?" menu. Loads a module's scenario config via
 * loadModuleConfig, hands it to <ScenarioEngine> untouched, and reacts
 * to its onContinueToQuiz callback (only enabled once every scenario has
 * resolved safely) by recording mock progress and moving on to the
 * completion page. onBackToLesson returns to this module's Lesson
 * Viewer at any time. This page only wires the engine up — it contains
 * no scenario logic itself.
 */
export default function ScenarioRunnerPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { actions } = useModuleProgress(moduleId)

  // undefined = still loading, null = not found, object = loaded
  const [config, setConfig] = useState(undefined)
  const [phase, setPhase] = useState('entering') // 'entering' | 'tutorial' | 'engine' | 'exiting' | 'not-found'
  const [messageIndex, setMessageIndex] = useState(0)

  // Time-on-simulation, measured from the moment the engine actually
  // starts — not from page load, which includes the staging animation and
  // the intro tutorial the student reads at their own pace.
  const simulationTimerRef = useRef(null)

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
  // move into the pre-scenario tutorial screen (or report a missing config).
  useEffect(() => {
    if (phase !== 'entering') return undefined
    if (config === undefined) return undefined
    if (messageIndex < ENTER_MESSAGES.length - 1) return undefined
    const timer = setTimeout(() => setPhase(config === null ? 'not-found' : 'tutorial'), STAGE_MS)
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

  // Start the simulation stopwatch the first time the engine is shown.
  useEffect(() => {
    if (phase !== 'engine' || simulationTimerRef.current) return
    recordEvent('simulation_started', { moduleId })
    simulationTimerRef.current = startTimedEvent('simulation_completed', moduleId)
  }, [phase, moduleId])

  function handleContinueToQuiz() {
    actions.completeSimulation()
    if (simulationTimerRef.current) {
      simulationTimerRef.current({ scenarios: config?.scenario?.scenarios?.length ?? null })
      simulationTimerRef.current = null
    }
    setMessageIndex(0)
    setPhase('exiting')
  }

  function handleBackToLesson() {
    navigate(`/student/modules/${moduleId}`)
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

  if (phase === 'tutorial') {
    return (
      <DashboardLayout role="student">
        <div className={styles.page}>
          <ScenarioIntroTutorial
            moduleTitle={config?.scenario?.moduleTitle}
            onContinue={() => setPhase('engine')}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <ModuleAccessGuard moduleId={moduleId} require="simulation">
          <ScenarioEngine
            config={config.scenario}
            onBackToLesson={handleBackToLesson}
            onContinueToQuiz={handleContinueToQuiz}
          />
        </ModuleAccessGuard>
      </div>
    </DashboardLayout>
  )
}
