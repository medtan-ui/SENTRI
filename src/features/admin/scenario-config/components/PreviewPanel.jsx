import React, { useEffect, useState } from 'react'
import ConsequenceOverlay from '../../../scenario/engine/ConsequenceOverlay'
import FeedbackPanel from '../../../scenario/engine/FeedbackPanel'
import { sceneLabelFor } from '../../../scenario/engine/sceneLabels'
import PausedVideoPreview from './PausedVideoPreview'
import styles from './PreviewPanel.module.css'

const MODES = [
  { key: 'poster', label: 'Opening' },
  { key: 'consequence', label: 'Consequence' },
  { key: 'feedback', label: 'Feedback' },
]

const noop = () => {}

/**
 * PreviewPanel
 * A live, read-only preview of exactly what a student sees — built by
 * reusing the Scenario Engine's own overlays (ConsequenceOverlay,
 * FeedbackPanel) verbatim, fed with the admin's in-progress draft. No
 * gameplay: every callback is a no-op, so clicking a button here never
 * advances anything.
 *
 * The interactive scene itself is not rendered here. Scenes are bespoke
 * components driven by the engine's state machine (they expect a live
 * target registry, idle-pulse timers, and a resolve callback); mounting
 * one inside a static form would start real timers for a session that
 * isn't happening. The scene is identified by name instead, and its
 * copy — which is all an admin can change — previews in full.
 */
export default function PreviewPanel({ scenario }) {
  const [mode, setMode] = useState('poster')
  const [choiceId, setChoiceId] = useState(scenario.choices[0]?.scenario_choice_id || null)

  useEffect(() => {
    if (!scenario.choices.some((c) => c.scenario_choice_id === choiceId)) {
      setChoiceId(scenario.choices[0]?.scenario_choice_id || null)
    }
  }, [scenario.choices, choiceId])

  const riskyChoices = scenario.choices.filter((c) => !c.is_safe_choice)
  const feedbackChoice =
    scenario.choices.find((c) => c.scenario_choice_id === choiceId) || scenario.choices[0]
  const consequenceChoice =
    riskyChoices.find((c) => c.scenario_choice_id === choiceId) || riskyChoices[0]

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h4 className={styles.heading}>Live Preview</h4>
        <div className={styles.modeRow}>
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`${styles.modeBtn} ${mode === m.key ? styles.modeBtnActive : ''}`}
              onClick={() => setMode(m.key)}
              disabled={m.key === 'consequence' && riskyChoices.length === 0}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {(mode === 'feedback' || mode === 'consequence') && (
        <div className={styles.choicePicker}>
          <span className={styles.choicePickerLabel}>Previewing choice:</span>
          <select
            value={
              (mode === 'consequence' ? consequenceChoice : feedbackChoice)?.scenario_choice_id || ''
            }
            onChange={(e) => setChoiceId(e.target.value)}
          >
            {(mode === 'consequence' ? riskyChoices : scenario.choices).map((c) => (
              <option key={c.scenario_choice_id} value={c.scenario_choice_id}>
                Choice {scenario.choices.indexOf(c) + 1}:{' '}
                {c.choice_text ? c.choice_text.slice(0, 40) : '(empty)'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.stage}>
        <span className={styles.sceneLabel}>{sceneLabelFor(scenario.scene)}</span>

        {mode === 'poster' && <PausedVideoPreview scenario={scenario} />}

        {mode === 'consequence' && consequenceChoice && (
          <ConsequenceOverlay choice={consequenceChoice} onContinue={noop} />
        )}

        {mode === 'feedback' && feedbackChoice && (
          <FeedbackPanel
            choice={feedbackChoice}
            scenario={scenario}
            attemptCount={0}
            onRetry={noop}
            onContinue={noop}
          />
        )}
      </div>

      <p className={styles.readOnlyNote}>
        Read-only preview, so clicking elements here has no effect. The interactive scene itself renders
        live in the student simulation.
      </p>
    </div>
  )
}
