import React from 'react'
import ChoiceEditor from './ChoiceEditor'
import { MIN_CHOICES, MAX_CHOICES } from '../types/scenarioConfigAdmin.types'
import styles from './ChoiceList.module.css'

/**
 * ChoiceList
 * Renders a scenario's 2-3 choices and the Add Choice control. Enforces
 * the fixed bounds visually (disabled buttons) — the hook enforces them
 * again at the data layer, so this is a UX convenience, not the only guard.
 */
export default function ChoiceList({
  choices,
  issues,
  onUpdateChoice,
  onRemoveChoice,
  onMoveChoice,
  onAddChoice,
  onSetConsequenceEnabled,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h4 className={styles.heading}>Choices</h4>
        <button
          type="button"
          className={styles.addBtn}
          onClick={onAddChoice}
          disabled={choices.length >= MAX_CHOICES}
          title={choices.length >= MAX_CHOICES ? `Maximum ${MAX_CHOICES} choices` : 'Add choice'}
        >
          + Add Choice
        </button>
      </div>

      <div className={styles.list}>
        {choices.map((choice, index) => (
          <ChoiceEditor
            key={choice.id}
            choice={choice}
            index={index}
            total={choices.length}
            canRemove={choices.length > MIN_CHOICES}
            errors={issues.filter((issue) => issue.field.startsWith(`choice-${choice.id}`))}
            onUpdate={(patch) => onUpdateChoice(choice.id, patch)}
            onRemove={() => onRemoveChoice(choice.id)}
            onMoveUp={() => onMoveChoice(choice.id, -1)}
            onMoveDown={() => onMoveChoice(choice.id, 1)}
            onSetConsequenceEnabled={(enabled) => onSetConsequenceEnabled(choice.id, enabled)}
          />
        ))}
      </div>
    </div>
  )
}
