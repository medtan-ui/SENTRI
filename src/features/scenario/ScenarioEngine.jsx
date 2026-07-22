import React from 'react'
import { useScenarioEngine } from './hooks/useScenarioEngine'
import { SCENARIO_STATES } from './types/scenario.types'
import ScenarioLayout from './components/ScenarioLayout'
import BrowserChrome from './components/BrowserChrome'
import PhoneFrame from './components/PhoneFrame'
import ScenarioPlayer from './components/ScenarioPlayer'
import DecisionOverlay from './components/DecisionOverlay'
import FeedbackPanel from './components/FeedbackPanel'
import ConsequencePlayer from './components/ConsequencePlayer'
import ScenarioComplete from './components/ScenarioComplete'
import LoadingScreen from './components/LoadingScreen'
import Button from '../../components/Button/Button'
import styles from './ScenarioEngine.module.css'

/**
 * ScenarioEngine
 * The reusable simulation engine. Everything it renders is derived from
 * `config` (a ModuleScenarioConfig — see ./types/scenario.types.js) and
 * the state produced by useScenarioEngine. This file has no knowledge of
 * Password Security, Phishing, or any other specific module: swap the
 * config passed in and the entire simulation changes with zero code edits.
 *
 * @param {{ config: import('./types/scenario.types').ModuleScenarioConfig, onSimulationComplete?: (result: import('./types/scenario.types').ScenarioEngineResult) => void }} props
 */
export default function ScenarioEngine({ config, onSimulationComplete }) {
  const engine = useScenarioEngine(config)
  const Surface = config.surface === 'phone' ? PhoneFrame : BrowserChrome

  if (engine.engineState === SCENARIO_STATES.LOADING) {
    return (
      <ScenarioLayout title={config.title}>
        <LoadingScreen />
      </ScenarioLayout>
    )
  }

  if (engine.engineState === SCENARIO_STATES.COMPLETE) {
    return (
      <ScenarioLayout title={config.title}>
        <ScenarioComplete
          moduleTitle={config.title}
          result={engine.result}
          onContinueToQuiz={onSimulationComplete}
        />
      </ScenarioLayout>
    )
  }

  const scenario = engine.currentScenario
  const progress = {
    total: engine.totalScenarios,
    currentIndex: engine.scenarioIndex,
    completedCount: engine.completedScenarioIds.length,
  }

  return (
    <ScenarioLayout title={config.title} progress={progress}>
      {engine.engineState === SCENARIO_STATES.INTRO ? (
        <div className={styles.introCard}>
          <span className={styles.introEyebrow}>Up Next</span>
          <h2 className={styles.introTitle}>{scenario.title}</h2>
          <Button variant="primary" size="lg" onClick={engine.actions.beginScenario}>
            Begin Scenario →
          </Button>
        </div>
      ) : (
        <div className={styles.stage}>
          <Surface url={scenario.simulatedUrl}>
            <ScenarioPlayer
              scenarioKey={scenario.id}
              video={scenario.video}
              pauseTimestamp={scenario.pauseTimestamp}
              engineState={engine.engineState}
              onReachedPauseTimestamp={engine.actions.handleReachedPauseTimestamp}
              onVideoEnded={engine.actions.handleScenarioVideoEnded}
            />

            {engine.engineState === SCENARIO_STATES.DECISION && (
              <DecisionOverlay choices={scenario.choices} onSelect={engine.actions.selectChoice} />
            )}

            {engine.engineState === SCENARIO_STATES.FEEDBACK && engine.activeChoice && (
              <FeedbackPanel
                choice={engine.activeChoice}
                onContinue={engine.actions.continueFromFeedback}
                onViewConsequence={engine.actions.viewConsequence}
              />
            )}

            {engine.engineState === SCENARIO_STATES.CONSEQUENCE && engine.activeChoice && (
              <ConsequencePlayer
                choice={engine.activeChoice}
                onTryAgain={engine.actions.retryFromConsequence}
              />
            )}
          </Surface>
        </div>
      )}
    </ScenarioLayout>
  )
}
