import React from 'react'
import ChoiceEditor from './ChoiceEditor'
import styles from './ChoiceList.module.css'

/**
 * ChoiceList
 * Renders a scenario's choices. There is no Add/Remove control any more:
 * every choice corresponds to a named interactive target inside a
 * hand-authored scene component, so the set of choices is fixed by the
 * scene, not by this form. See useScenario for the full reasoning.
 */
export default function ChoiceList({ choices, issues, onUpdateChoice }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h4 className={styles.heading}>Choices</h4>
        <span className={styles.countNote}>
          {choices.length} defined by this scene
        </span>
      </div>

      <div className={styles.list}>
        {choices.map((choice, index) => (
          <ChoiceEditor
            key={choice.scenarioChoiceId}
            choice={choice}
            index={index}
            errors={issues.filter((issue) => issue.field.startsWith(`choice-${choice.scenarioChoiceId}`))}
            onUpdate={(patch) => onUpdateChoice(choice.scenarioChoiceId, patch)}
          />
        ))}
      </div>
    </div>
  )
}
