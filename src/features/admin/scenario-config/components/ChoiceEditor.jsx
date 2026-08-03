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
 * `choice_text` is deliberately labelled as admin-facing: a student never
 * picks from a list of choice texts, they act on the real interface
 * element. It appears in the flow diagram and in decision analytics.
 */
export default function ChoiceEditor({ choice, index, errors, onUpdate }) {
  const id = choice.scenario_choice_id
  const textError = errorFor(errors, '-choice_text')
  const titleError = errorFor(errors, '-outcome_title')
  const bodyError = errorFor(errors, '-feedback_text')

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.index}>Choice {index + 1}</span>

        <div className={styles.headerRight}>
          <span className={`${badges.pill} ${choice.is_safe_choice ? badges.safe : badges.risky}`}>
            {choice.is_safe_choice ? 'Safe' : 'Risky'}
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
        <label className={forms.fieldLabel} htmlFor={`${id}-choice_text`}>
          Choice Description{' '}
          <span className={styles.labelHint}>(admin record and analytics; students never see this text)</span>
        </label>
        <textarea
          id={`${id}-choice_text`}
          className={`${forms.textarea} ${textError ? forms.textareaError : ''}`}
          rows={2}
          value={choice.choice_text}
          onChange={(e) => onUpdate({ choice_text: e.target.value })}
        />
        {textError && <span className={forms.errorText}>{textError}</span>}
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${id}-outcome_title`}>Outcome Title</label>
        <input
          id={`${id}-outcome_title`}
          className={`${styles.textInput} ${titleError ? forms.textareaError : ''}`}
          value={choice.outcome_title}
          onChange={(e) => onUpdate({ outcome_title: e.target.value })}
        />
        {titleError && <span className={forms.errorText}>{titleError}</span>}
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${id}-feedback_text`}>
          Feedback Text
          {!choice.is_safe_choice && ' (shown on the consequence beat, then again in the feedback panel)'}
        </label>
        <textarea
          id={`${id}-feedback_text`}
          className={`${forms.textarea} ${bodyError ? forms.textareaError : ''}`}
          rows={3}
          value={choice.feedback_text}
          onChange={(e) => onUpdate({ feedback_text: e.target.value })}
        />
        {bodyError && <span className={forms.errorText}>{bodyError}</span>}
      </div>

      {!choice.is_safe_choice && (
        <ConsequenceEditor choice={choice} error={errorFor(errors, '-consequence_type')} onUpdate={onUpdate} />
      )}
    </div>
  )
}
