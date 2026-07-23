import React, { useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useScenarioEngine } from './useScenarioEngine'
import { ScenarioInteractionProvider } from './ScenarioInteractionContext'
import { SCENE_REGISTRY } from '../scenes/sceneRegistry'
import ScenarioProgress from './ScenarioProgress'
import ScenarioPlayer from './ScenarioPlayer'
import AffordanceCoach from './AffordanceCoach'
import ConsequenceOverlay from './ConsequenceOverlay'
import FeedbackPanel from './FeedbackPanel'
import styles from './ScenarioEngine.module.css'

/**
 * ScenarioEngine
 * Orchestrates the Video-Pause-Interact-Branch loop for one module's
 * config. Everything module-specific — scenario content, which scene
 * renders, coach aggressiveness — comes from `config`; this file has no
 * knowledge of Password Security or any other module.
 *
 * @param {{
 *   config: import('../configs/passwordSecurity.config').ModuleScenarioConfig,
 *   onBackToLesson?: () => void,
 *   onContinueToQuiz?: () => void,
 * }} props
 */
export default function ScenarioEngine({ config, onBackToLesson, onContinueToQuiz }) {
  const { user } = useAuth()
  const engine = useScenarioEngine(config, user?.uid || null)
  const stageRef = useRef(null)

  const {
    state,
    currentScenario,
    scenarioIndex,
    totalScenarios,
    completedScenarioIds,
    attemptCount,
    guidedHintActive,
    selectedChoice,
    coachActive,
    coachTargetId,
    interaction,
    actions,
  } = engine

  const SceneComponent = SCENE_REGISTRY[currentScenario.scene]
  const showScene = ['paused_interactive', 'resolving', 'consequence', 'feedback'].includes(state)

  return (
    <ScenarioInteractionProvider value={interaction}>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <h2 className={styles.moduleTitle}>{config.module_title}</h2>
          <ScenarioProgress
            total={totalScenarios}
            currentIndex={scenarioIndex}
            completedCount={completedScenarioIds.length}
          />
        </div>

        <div className={styles.stage} ref={stageRef}>
          {(state === 'loading' || state === 'playing') && (
            <ScenarioPlayer
              videoAvailable={currentScenario.videoAvailable}
              materialUrl={currentScenario.material_url}
              posterCaption={currentScenario.posterCaption}
              scenarioTitle={currentScenario.scenario_title}
            />
          )}

          {showScene && SceneComponent && (
            <SceneComponent
              scenario={currentScenario}
              interactive={state === 'paused_interactive'}
              phase={state}
              guidedHintActive={guidedHintActive}
              onResolve={actions.selectChoice}
            />
          )}

          {state === 'paused_interactive' && (
            <AffordanceCoach
              active={coachActive}
              targetId={coachTargetId}
              containerRef={stageRef}
              onFinished={actions.handleCoachFinished}
            />
          )}

          {state === 'consequence' && selectedChoice && (
            <ConsequenceOverlay choice={selectedChoice} onContinue={actions.dismissConsequence} />
          )}

          {state === 'feedback' && selectedChoice && (
            <FeedbackPanel
              choice={selectedChoice}
              attemptCount={attemptCount}
              onRetry={actions.retry}
              onContinue={actions.continueToNext}
            />
          )}

          {state === 'complete' && (
            <div className={styles.completeCard}>
              <span className={styles.completeIcon} aria-hidden="true">🎉</span>
              <h3 className={styles.completeTitle}>Simulation Complete</h3>
              <p className={styles.completeText}>
                You made it through all {totalScenarios} scenarios safely. Your quiz is ready when you are.
              </p>
            </div>
          )}
        </div>

        <div className={styles.actionBar}>
          <button type="button" className={styles.backBtn} onClick={onBackToLesson}>
            ← Back to Lesson
          </button>
          <button
            type="button"
            className={styles.continueBtn}
            onClick={onContinueToQuiz}
            disabled={state !== 'complete'}
          >
            Continue to Quiz →
          </button>
        </div>
      </div>
    </ScenarioInteractionProvider>
  )
}
