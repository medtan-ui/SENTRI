import React from 'react'
import ScenarioPlayer from '../../../scenario/engine/ScenarioPlayer'
import styles from './PausedVideoPreview.module.css'

/**
 * PausedVideoPreview
 * The scenario's opening beat as students see it, rendered by the
 * engine's own ScenarioPlayer — so a pasted clip URL previews as a real
 * embed, and an empty one previews as the same poster card the engine
 * falls back to. Presentational only: ScenarioPlayer owns no timers or
 * state, so mounting it in a static admin form is safe (unlike the
 * interactive scenes, which the engine's state machine drives).
 */
export default function PausedVideoPreview({ scenario }) {
  return (
    <div className={styles.wrap}>
      <ScenarioPlayer
        videoAvailable={scenario.videoAvailable}
        materialUrl={scenario.material_url}
        posterCaption={scenario.posterCaption}
        scenarioTitle={scenario.scenario_title || '(untitled scenario)'}
      />
    </div>
  )
}
