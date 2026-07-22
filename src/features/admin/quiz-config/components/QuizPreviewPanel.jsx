import React, { useEffect, useState } from 'react'
import badges from '../styles/badges.module.css'
import styles from './QuizPreviewPanel.module.css'

/**
 * QuizPreviewPanel
 * A live, read-only preview of exactly what a student would see for
 * this question: the question text, its choices, and — once a choice is
 * clicked here for preview purposes only — the selected-answer marker,
 * the correct-answer highlight, and the explanation panel. Clicking a
 * choice never edits the question; it only simulates "what if a student
 * picked this one" for the admin's benefit.
 */
export default function QuizPreviewPanel({ question }) {
  const [previewChoiceId, setPreviewChoiceId] = useState(null)

  useEffect(() => {
    setPreviewChoiceId(null)
  }, [question.id])

  const hasAnswered = previewChoiceId !== null

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h4 className={styles.heading}>Live Preview</h4>
        <span className={styles.hint}>Click a choice to preview an answer</span>
      </div>

      <div className={styles.quizCard}>
        <p className={styles.questionText}>{question.text || '(no question text yet)'}</p>

        <div className={styles.choices}>
          {question.choices.map((choice, index) => {
            const isCorrect = choice.id === question.correctChoiceId
            const isSelected = choice.id === previewChoiceId
            return (
              <button
                key={choice.id}
                type="button"
                className={[
                  styles.choiceBtn,
                  hasAnswered && isCorrect ? styles.choiceCorrect : '',
                  hasAnswered && isSelected && !isCorrect ? styles.choiceIncorrect : '',
                  !hasAnswered && isSelected ? styles.choiceSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setPreviewChoiceId(choice.id)}
              >
                <span className={styles.choiceLetter}>{String.fromCharCode(65 + index)}</span>
                <span className={styles.choiceText}>{choice.text || `(choice ${index + 1} empty)`}</span>
                {hasAnswered && isCorrect && <span className={styles.checkIcon}>✓</span>}
                {hasAnswered && isSelected && !isCorrect && <span className={styles.crossIcon}>✕</span>}
              </button>
            )
          })}
        </div>

        {hasAnswered && (
          <div className={styles.explanationCard}>
            <span className={`${badges.pill} ${previewChoiceId === question.correctChoiceId ? badges.valid : badges.invalid}`}>
              {previewChoiceId === question.correctChoiceId ? 'Correct' : 'Incorrect'}
            </span>
            <p className={styles.explanationText}>{question.explanation || '(no explanation yet)'}</p>
          </div>
        )}
      </div>

      <p className={styles.readOnlyNote}>Read-only preview — selecting a choice here does not change the question.</p>
    </div>
  )
}
