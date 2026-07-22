import React from 'react'
import QuestionCard from './QuestionCard'
import styles from './QuestionList.module.css'

/**
 * QuestionList
 * Renders every predefined question in order. No add/remove — the
 * question count is fixed per module's quiz; only content and order
 * (via each card's up/down buttons) are editable.
 */
export default function QuestionList({
  questions,
  validations,
  onUpdateQuestion,
  onUpdateChoiceText,
  onSetCorrectChoice,
  onMoveQuestion,
}) {
  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>Question List</h3>
      <div className={styles.list}>
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            total={questions.length}
            validation={validations.find((v) => v.questionId === question.id)}
            onUpdateQuestion={(patch) => onUpdateQuestion(question.id, patch)}
            onUpdateChoiceText={(choiceId, text) => onUpdateChoiceText(question.id, choiceId, text)}
            onSetCorrectChoice={(choiceId) => onSetCorrectChoice(question.id, choiceId)}
            onMoveUp={() => onMoveQuestion(question.id, -1)}
            onMoveDown={() => onMoveQuestion(question.id, 1)}
          />
        ))}
      </div>
    </div>
  )
}
