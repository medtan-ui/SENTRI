import React from 'react'
import forms from '../styles/formControls.module.css'
import styles from './QuizChoiceRow.module.css'

/**
 * QuizChoiceRow
 * One of a question's 4 fixed answer choices — text is editable, and a
 * radio-style control marks it as the correct answer. Choices are never
 * added, removed, or reordered — only their text and which one is
 * correct can change.
 */
export default function QuizChoiceRow({ choice, index, isCorrect, onChangeText, onSetCorrect }) {
  return (
    <div className={`${styles.row} ${isCorrect ? styles.rowCorrect : ''}`}>
      <button
        type="button"
        role="radio"
        aria-checked={isCorrect}
        className={styles.radio}
        data-checked={isCorrect}
        onClick={onSetCorrect}
        title="Mark as correct answer"
      >
        {isCorrect && <span className={styles.radioDot} />}
      </button>

      <span className={styles.letter}>{String.fromCharCode(65 + index)}</span>

      <input
        className={`${forms.textInput} ${styles.input}`}
        value={choice.text}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={`Choice ${index + 1}`}
      />

      {isCorrect && <span className={styles.correctTag}>Correct</span>}
    </div>
  )
}
