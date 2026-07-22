import React, { useState } from 'react'
import Card from '../../../../components/Card/Card'
import QuizChoiceRow from './QuizChoiceRow'
import QuizPreviewPanel from './QuizPreviewPanel'
import badges from '../styles/badges.module.css'
import forms from '../styles/formControls.module.css'
import { DIFFICULTY_OPTIONS } from '../types/quizConfigAdmin.types'
import styles from './QuestionCard.module.css'

const DIFFICULTY_BADGE_CLASS = { Easy: badges.easy, Medium: badges.medium, Hard: badges.hard }

/**
 * QuestionCard
 * One predefined question, fully expandable/collapsible. Question order
 * is reorderable via up/down only (no drag-and-drop); questions
 * themselves are never added or removed — this is a fixed 1-quiz,
 * fixed-question-count editor, not a general quiz builder.
 */
export default function QuestionCard({
  question,
  validation,
  total,
  defaultExpanded = false,
  onUpdateQuestion,
  onUpdateChoiceText,
  onSetCorrectChoice,
  onMoveUp,
  onMoveDown,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const textError = validation.issues.find((i) => i.field === 'text')?.message
  const choicesError = validation.issues.find((i) => i.field === 'choices')?.message
  const correctError = validation.issues.find((i) => i.field === 'correctChoiceId')?.message
  const explanationError = validation.issues.find((i) => i.field === 'explanation')?.message

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.headerToggle}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className={styles.orderBadge}>Question {question.order}</span>
          <span className={styles.textPreview}>{question.text || '(untitled question)'}</span>
        </button>

        <div className={styles.headerRight}>
          <span className={`${badges.pill} ${DIFFICULTY_BADGE_CLASS[question.difficulty]}`}>
            {question.difficulty}
          </span>
          <span className={`${badges.pill} ${validation.isValid ? badges.valid : badges.invalid}`}>
            {validation.isValid ? '✓ Valid' : `⚠ ${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}
          </span>
          <div className={styles.reorderBtns}>
            <button type="button" onClick={onMoveUp} disabled={question.order === 1} title="Move up">↑</button>
            <button type="button" onClick={onMoveDown} disabled={question.order === total} title="Move down">↓</button>
          </div>
          <button
            type="button"
            className={styles.chevronBtn}
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse question' : 'Expand question'}
          >
            <span className={styles.chevron} data-expanded={expanded} aria-hidden="true">▾</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.body}>
          <div className={forms.fieldGroup}>
            <label className={forms.fieldLabel} htmlFor={`${question.id}-text`}>Question Text</label>
            <textarea
              id={`${question.id}-text`}
              className={`${forms.textarea} ${textError ? forms.inputError : ''}`}
              rows={2}
              value={question.text}
              onChange={(e) => onUpdateQuestion({ text: e.target.value })}
            />
            {textError && <span className={forms.errorText}>{textError}</span>}
          </div>

          <div className={forms.fieldGroup}>
            <span className={forms.fieldLabel}>Difficulty</span>
            <select
              className={forms.selectInput}
              value={question.difficulty}
              onChange={(e) => onUpdateQuestion({ difficulty: e.target.value })}
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className={forms.fieldGroup}>
            <span className={forms.fieldLabel}>Choices — select the correct answer</span>
            {(choicesError || correctError) && (
              <div className={styles.choiceIssueBanner}>
                {choicesError && <p>{choicesError}</p>}
                {correctError && <p>{correctError}</p>}
              </div>
            )}
            <div className={styles.choiceList}>
              {question.choices.map((choice, index) => (
                <QuizChoiceRow
                  key={choice.id}
                  choice={choice}
                  index={index}
                  isCorrect={choice.id === question.correctChoiceId}
                  onChangeText={(text) => onUpdateChoiceText(choice.id, text)}
                  onSetCorrect={() => onSetCorrectChoice(choice.id)}
                />
              ))}
            </div>
          </div>

          <div className={forms.fieldGroup}>
            <label className={forms.fieldLabel} htmlFor={`${question.id}-explanation`}>
              Explanation (shown after submission)
            </label>
            <textarea
              id={`${question.id}-explanation`}
              className={`${forms.textarea} ${explanationError ? forms.inputError : ''}`}
              rows={2}
              value={question.explanation}
              onChange={(e) => onUpdateQuestion({ explanation: e.target.value })}
            />
            {explanationError && <span className={forms.errorText}>{explanationError}</span>}
          </div>

          <QuizPreviewPanel question={question} />
        </div>
      )}
    </Card>
  )
}
