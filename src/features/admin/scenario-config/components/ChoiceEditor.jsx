import React from 'react'
import ConsequenceEditor from './ConsequenceEditor'
import badges from '../styles/badges.module.css'
import forms from '../styles/formControls.module.css'
import styles from './ChoiceEditor.module.css'

function errorFor(errors, suffix) {
  return errors.find((e) => e.field.endsWith(suffix))?.message || ''
}

/**
 * ChoiceEditor
 * One decision choice's editable content, in the Scenario Engine's own
 * field names — so what's typed here is literally what the engine reads.
 *
 * Safe/Risky and the interactive `target` are shown as read-only chips,
 * not toggles. Both are wired into a hand-authored scene component (the
 * scene decides which target resolves to which choice, and its own logic
 * was written against which one is safe); flipping either from a form
 * would leave the scenario unwinnable with no visible cause.
 *
 * `choiceText` is deliberately labelled as admin-facing: a student never
 * picks from a list of choice texts, they act on the real interface
 * element. It appears in the flow diagram and in decision analytics.
 */
export default function ChoiceEditor({ choice, index, errors, onUpdate }) {
  const id = choice.scenarioChoiceId
  const textError = errorFor(errors, '-choiceText')
  const titleError = errorFor(errors, '-outcomeTitle')
  const bodyError = errorFor(errors, '-feedbackText')

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.index}>Choice {index + 1}</span>

        <div className={styles.headerRight}>
          <span className={`${badges.pill} ${choice.isSafeChoice ? badges.safe : badges.risky}`}>
            {choice.isSafeChoice ? 'Safe' : 'Risky'}
          </span>
        </div>
      </div>

      <div className={styles.structuralRow}>
        <span
          className={styles.structuralChip}
          title="The interactive element inside the scene that resolves to this choice"
        >
          🔗 target: <code>{choice.target}</code>
        </span>
        <span className={styles.structuralNote}>Wired in code, not editable here</span>
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${id}-choiceText`}>
          Choice Description{' '}
          <span className={styles.labelHint}>(admin record and analytics; students never see this text)</span>
        </label>
        <textarea
          id={`${id}-choiceText`}
          className={`${forms.textarea} ${textError ? forms.textareaError : ''}`}
          rows={2}
          value={choice.choiceText}
          onChange={(e) => onUpdate({ choiceText: e.target.value })}
        />
        {textError && <span className={forms.errorText}>{textError}</span>}
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${id}-outcomeTitle`}>Outcome Title</label>
        <input
          id={`${id}-outcomeTitle`}
          className={`${styles.textInput} ${titleError ? forms.textareaError : ''}`}
          value={choice.outcomeTitle}
          onChange={(e) => onUpdate({ outcomeTitle: e.target.value })}
        />
        {titleError && <span className={forms.errorText}>{titleError}</span>}
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${id}-feedbackText`}>
          Feedback Text
          {!choice.isSafeChoice && ' (shown on the consequence beat, then again in the feedback panel)'}
        </label>
        <textarea
          id={`${id}-feedbackText`}
          className={`${forms.textarea} ${bodyError ? forms.textareaError : ''}`}
          rows={3}
          value={choice.feedbackText}
          onChange={(e) => onUpdate({ feedbackText: e.target.value })}
        />
        {bodyError && <span className={forms.errorText}>{bodyError}</span>}
      </div>

      {!choice.isSafeChoice && (
        <ConsequenceEditor choice={choice} error={errorFor(errors, '-consequenceType')} onUpdate={onUpdate} />
      )}
    </div>
  )
}
