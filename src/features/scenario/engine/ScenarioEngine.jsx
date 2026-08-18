import React, { useEffect, useRef } from 'react'
import Icon from '../../../components/Icon/Icon'
import { useAuth } from '../../../context/AuthContext'
import { useScenarioEngine } from './useScenarioEngine'
import { ScenarioInteractionProvider } from './ScenarioInteractionContext'
import { SCENE_REGISTRY } from '../scenes/sceneRegistry'
import ScenarioProgress from './ScenarioProgress'
import ScenarioPlayer from './ScenarioPlayer'
import FeedbackPanel from './FeedbackPanel'
import { sceneLabelFor } from './sceneLabels'
import '../styles/sketch.css'
import styles from './ScenarioEngine.module.css'

/**
 * ScenarioEngine
 * Orchestrates the Video-Pause-Interact-Branch loop for one module's
 * config. Everything module-specific, scenario content and which scene
 * renders, comes from `config`; this file has no knowledge of Password
 * Security or any other module.
 *
 * `isReplay` marks a run through a simulation this student has already
 * finished. It changes what the run means rather than what it contains:
 * nothing is recorded, the first-try marker is retired (they have been
 * here before, saying "first try" would be a lie), and the closing card
 * reads as practice. A clean replay is still reported to the caller so
 * it can count for the badge that asks for one.
 *
 * `onSimulationComplete` fires the moment the last scenario resolves,
 * not when the student presses Continue to Quiz. Those used to be the
 * same event, which meant a student who finished every scene and then
 * went back to the dashboard had no record of finishing: their next
 * click sent them into the simulation again. Reaching the end is the
 * achievement; pressing the button is only navigation.
 *
 * @param {{
 *   config: import('../configs/passwordSecurity.config').ModuleScenarioConfig,
 *   isReplay?: boolean,
 *   onBackToLesson?: () => void,
 *   onSimulationComplete?: (summary: { flawless: boolean }) => void,
 *   onContinueToQuiz?: () => void,
 * }} props
 */
export default function ScenarioEngine({
  config,
  isReplay = false,
  onBackToLesson,
  onSimulationComplete,
  onContinueToQuiz,
}) {
  const { user } = useAuth()
  const engine = useScenarioEngine(config, user?.uid || null, { isReplay })

  const {
    state,
    currentScenario,
    scenarioIndex,
    totalScenarios,
    completedScenarioIds,
    awaitingStart,
    attemptCount,
    cleanCalls,
    guidedHintActive,
    selectedChoice,
    interaction,
    actions,
  } = engine

  // Once per mount: the engine can re-enter `complete` on a replay, but
  // a run only finishes once.
  const reportedRef = useRef(false)
  useEffect(() => {
    if (state !== 'complete' || reportedRef.current) return
    reportedRef.current = true
    onSimulationComplete?.({ flawless: cleanCalls === totalScenarios })
  }, [state, cleanCalls, totalScenarios, onSimulationComplete])

  const SceneComponent = SCENE_REGISTRY[currentScenario.scene]
  const showScene = ['paused_interactive', 'resolving', 'feedback'].includes(state)

  return (
    <ScenarioInteractionProvider value={interaction}>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <h2 className={styles.moduleTitle}>
            {config.moduleTitle}
            {isReplay && <span className={styles.replayChip}>Replay</span>}
          </h2>
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
        {/* `sketchStage` is the storyboard treatment: it defines the ink
            and paper the scene stylesheets draw with, and stops at the
            edge of the stage so the rest of SENTRI keeps its own look.
            See features/scenario/styles/sketch.css. */}
        <div className={`${styles.stage} sketchStage`} data-phase={state}>
          {(state === 'loading' || state === 'playing') && (
            <div className={styles.layer} key={`player-${scenarioIndex}`}>
              {/* onStart is what turns the clip into a held beat: passed
                  only while the engine is genuinely waiting on the
                  student, never during the poster-only path. */}
              <ScenarioPlayer
                videoAvailable={currentScenario.videoAvailable}
                materialUrl={currentScenario.materialUrl}
                posterCaption={currentScenario.posterCaption}
                scenarioTitle={currentScenario.scenarioTitle}
                onStart={awaitingStart ? actions.startScenario : null}
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

          {state === 'feedback' && selectedChoice && (
            <FeedbackPanel
              choice={selectedChoice}
              scenario={currentScenario}
              attemptCount={attemptCount}
              isReplay={isReplay}
              onRetry={actions.retry}
              onContinue={actions.continueToNext}
            />
          )}

          {state === 'complete' && (
            <div className={styles.completeCard}>
              <span className={styles.completeIcon} aria-hidden="true">
                <Icon name="shield" size={30} strokeWidth={1.6} />
              </span>
              <h3 className={styles.completeTitle}>
                {isReplay ? 'Replay complete' : 'Simulation complete'}
              </h3>
              <p className={styles.completeText}>
                {isReplay
                  ? `You went back through all ${totalScenarios} scenes. This one was practice, so nothing here changed what is already on your record.`
                  : `You made it through all ${totalScenarios} scenes safely. Your quiz is ready when you are.`}
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
            onClick={() => onContinueToQuiz?.()}
            disabled={state !== 'complete'}
          >
            Continue to Quiz →
          </button>
        </div>
      </div>
    </ScenarioInteractionProvider>
  )
}
