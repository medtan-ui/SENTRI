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
 * One decision choice's full editable content: text, Safe/Risky, feedback
 * (shared by FeedbackPanel and — for risky choices — ConsequencePlayer's
 * explanation), and its consequence type when risky. Reordering is two
 * arrow buttons only, scoped to this scenario's own choice list — no
 * drag-and-drop, per spec.
 */
export default function ChoiceEditor({
  choice,
  index,
  total,
  errors,
  canRemove,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSetConsequenceEnabled,
}) {
  const textError = errorFor(errors, '-text')
  const titleError = errorFor(errors, '-feedbackTitle')
  const bodyError = errorFor(errors, '-feedbackText')

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.index}>Choice {index + 1}</span>

        <div className={styles.headerRight}>
          <span className={`${badges.pill} ${choice.isSafe ? badges.safe : badges.risky}`}>
            {choice.isSafe ? 'Safe' : 'Risky'}
          </span>
          <div className={styles.reorderBtns}>
            <button type="button" onClick={onMoveUp} disabled={index === 0} title="Move up">
              ↑
            </button>
            <button type="button" onClick={onMoveDown} disabled={index === total - 1} title="Move down">
              ↓
            </button>
          </div>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={onRemove}
            disabled={!canRemove}
            title={canRemove ? 'Remove choice' : `A scenario needs at least 2 choices`}
          >
            Remove
          </button>
        </div>
      </div>

      <div className={styles.safeToggle}>
        <span className={forms.fieldLabel}>Outcome</span>
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={`${styles.typeBtn} ${!choice.isSafe ? styles.typeBtnActive : ''} ${styles.typeBtnRisky}`}
            onClick={() => onUpdate({ isSafe: false })}
          >
            Risky
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${choice.isSafe ? styles.typeBtnActive : ''} ${styles.typeBtnSafe}`}
            onClick={() => onUpdate({ isSafe: true })}
          >
            Safe
          </button>
        </div>
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${choice.id}-text`}>Choice Text</label>
        <textarea
          id={`${choice.id}-text`}
          className={`${forms.textarea} ${textError ? forms.textareaError : ''}`}
          rows={2}
          value={choice.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
        />
        {textError && <span className={forms.errorText}>{textError}</span>}
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${choice.id}-feedbackTitle`}>Feedback Title</label>
        <input
          id={`${choice.id}-feedbackTitle`}
          className={`${styles.textInput} ${titleError ? forms.textareaError : ''}`}
          value={choice.feedbackTitle}
          onChange={(e) => onUpdate({ feedbackTitle: e.target.value })}
        />
        {titleError && <span className={forms.errorText}>{titleError}</span>}
      </div>

      <div className={forms.fieldGroup}>
        <label className={forms.fieldLabel} htmlFor={`${choice.id}-feedbackText`}>
          Feedback Description {!choice.isSafe && '(also shown after the consequence)'}
        </label>
        <textarea
          id={`${choice.id}-feedbackText`}
          className={`${forms.textarea} ${bodyError ? forms.textareaError : ''}`}
          rows={3}
          value={choice.feedbackText}
          onChange={(e) => onUpdate({ feedbackText: e.target.value })}
        />
        {bodyError && <span className={forms.errorText}>{bodyError}</span>}
      </div>

      {!choice.isSafe && (
        <ConsequenceEditor
          choice={choice}
          onSetEnabled={onSetConsequenceEnabled}
          onChangeVideoUrl={(value) =>
            onUpdate({ consequenceVideo: { ...choice.consequenceVideo, videoUrl: value } })
          }
        />
      )}
    </div>
  )
}
