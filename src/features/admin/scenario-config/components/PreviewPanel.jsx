import React, { useEffect, useState } from 'react'
import { BrowserChrome, PhoneFrame, DecisionOverlay, FeedbackPanel, ConsequencePlayer } from '../../../scenario'
import PausedVideoPreview from './PausedVideoPreview'
import styles from './PreviewPanel.module.css'

const MODES = [
  { key: 'paused', label: 'Paused Video' },
  { key: 'decision', label: 'Decision' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'consequence', label: 'Consequence' },
]

const noop = () => {}

/**
 * PreviewPanel
 * A live, read-only preview of exactly what the student sees at each
 * moment — built by reusing the Scenario Engine's own presentational
 * components (BrowserChrome/PhoneFrame, DecisionOverlay, FeedbackPanel,
 * ConsequencePlayer) verbatim, fed with the admin's in-progress draft.
 * No gameplay: every callback is a no-op, so clicking a choice or button
 * here never advances anything.
 */
export default function PreviewPanel({ scenario, surface }) {
  const [mode, setMode] = useState('paused')
  const [choiceId, setChoiceId] = useState(scenario.choices[0]?.id || null)

  useEffect(() => {
    if (!scenario.choices.some((c) => c.id === choiceId)) {
      setChoiceId(scenario.choices[0]?.id || null)
    }
  }, [scenario.choices, choiceId])

  const riskyChoices = scenario.choices.filter((c) => !c.isSafe)
  const feedbackChoice = scenario.choices.find((c) => c.id === choiceId) || scenario.choices[0]
  const consequenceChoice = riskyChoices.find((c) => c.id === choiceId) || riskyChoices[0]

  const Surface = surface === 'phone' ? PhoneFrame : BrowserChrome

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
            value={mode === 'consequence' ? consequenceChoice?.id : feedbackChoice?.id}
            onChange={(e) => setChoiceId(e.target.value)}
          >
            {(mode === 'consequence' ? riskyChoices : scenario.choices).map((c) => (
              <option key={c.id} value={c.id}>
                Choice {scenario.choices.indexOf(c) + 1}: {c.text ? c.text.slice(0, 40) : '(empty)'}
              </option>
            ))}
          </select>
        </div>
      )}

      <Surface url={scenario.simulatedUrl}>
        {mode === 'paused' && (
          <PausedVideoPreview video={scenario.video} pauseTimestamp={scenario.pauseTimestamp} />
        )}
        {mode === 'decision' && <DecisionOverlay choices={scenario.choices} onSelect={noop} />}
        {mode === 'feedback' && feedbackChoice && (
          <FeedbackPanel choice={feedbackChoice} onContinue={noop} onViewConsequence={noop} />
        )}
        {mode === 'consequence' && consequenceChoice && (
          <ConsequencePlayer choice={consequenceChoice} onTryAgain={noop} />
        )}
      </Surface>

      <p className={styles.readOnlyNote}>Read-only preview — clicking elements here has no effect.</p>
    </div>
  )
}
