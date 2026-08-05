import React from 'react'
import Icon from '../../../components/Icon/Icon'
import { useAuth } from '../../../context/AuthContext'
import { useScenarioEngine } from './useScenarioEngine'
import { ScenarioInteractionProvider } from './ScenarioInteractionContext'
import { SCENE_REGISTRY } from '../scenes/sceneRegistry'
import ScenarioProgress from './ScenarioProgress'
import ScenarioPlayer from './ScenarioPlayer'
import ConsequenceOverlay from './ConsequenceOverlay'
import FeedbackPanel from './FeedbackPanel'
import { sceneLabelFor } from './sceneLabels'
import styles from './ScenarioEngine.module.css'

/**
 * ScenarioEngine
 * Orchestrates the Video-Pause-Interact-Branch loop for one module's
 * config. Everything module-specific, scenario content and which scene
 * renders, comes from `config`; this file has no knowledge of Password
 * Security or any other module.
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

  const {
    state,
    currentScenario,
    scenarioIndex,
    totalScenarios,
    completedScenarioIds,
    attemptCount,
    cleanCalls,
    guidedHintActive,
    selectedChoice,
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
            cleanCalls={cleanCalls}
          />
        </div>

        {/* `data-phase` lets the stage fade its contents out while the
            engine is advancing, so one scene leaves before the next
            arrives instead of being replaced mid-frame. */}
        <div className={styles.stage} data-phase={state}>
          {(state === 'loading' || state === 'playing') && (
            <div className={styles.layer} key={`player-${scenarioIndex}`}>
              <ScenarioPlayer
                videoAvailable={currentScenario.videoAvailable}
                materialUrl={currentScenario.material_url}
                posterCaption={currentScenario.posterCaption}
                scenarioTitle={currentScenario.scenario_title}
              />
            </div>
          )}

          {showScene && SceneComponent && (
            /* Keyed on the scenario so React remounts this wrapper on
               every scene change, which is what re-runs the entrance
               animation. Without the key the element persists and the
               new scene simply pops into the old box. */
            <div className={styles.layer} key={`scene-${scenarioIndex}`}>
              <span className={styles.sceneLabel}>{sceneLabelFor(currentScenario.scene)}</span>
              <SceneComponent
                scenario={currentScenario}
                interactive={state === 'paused_interactive'}
                phase={state}
                guidedHintActive={guidedHintActive}
                onResolve={actions.selectChoice}
              />
            </div>
          )}

          {state === 'consequence' && selectedChoice && (
            <ConsequenceOverlay choice={selectedChoice} onContinue={actions.dismissConsequence} />
          )}

          {state === 'feedback' && selectedChoice && (
            <FeedbackPanel
              choice={selectedChoice}
              scenario={currentScenario}
              attemptCount={attemptCount}
              onRetry={actions.retry}
              onContinue={actions.continueToNext}
            />
          )}

          {state === 'complete' && (
            <div className={styles.completeCard}>
              <span className={styles.completeIcon} aria-hidden="true">
                <Icon name="shield" size={30} strokeWidth={1.6} />
              </span>
              <h3 className={styles.completeTitle}>Simulation complete</h3>
              <p className={styles.completeText}>
                You made it through all {totalScenarios} scenes safely. Your quiz is ready when you are.
              </p>

              {/* The run's own scoreline. Completion is guaranteed here —
                  the engine never lets anyone leave on a risky choice —
                  so the only figure worth reporting is how many calls
                  needed no second go. */}
              <div className={styles.scoreline}>
                <span className={styles.scorelineValue}>
                  {cleanCalls}
                  <span className={styles.scorelineTotal}>/ {totalScenarios}</span>
                </span>
                <span className={styles.scorelineLabel}>called right first time</span>
              </div>

              {cleanCalls === totalScenarios ? (
                <p className={styles.completeNote}>A clean run. Not one wrong turn.</p>
              ) : (
                <p className={styles.completeNote}>
                  The ones that caught you out are the ones worth remembering. You can replay this any time.
                </p>
              )}
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
