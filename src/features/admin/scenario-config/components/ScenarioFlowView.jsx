import React from 'react'
import Card from '../../../../components/Card/Card'
import { sceneLabelFor } from '../../../scenario/engine/sceneLabels'
import { CONSEQUENCE_TYPE_LABELS } from '../types/scenarioConfigAdmin.types'
import badges from '../styles/badges.module.css'
import styles from './ScenarioFlowView.module.css'

/**
 * ScenarioFlowView
 * Read-only, CSS-only branching diagram of every scenario — title, then
 * each choice branching to its outcome — built for a quick, presentable
 * overview (e.g. a capstone demo) rather than the deep-edit forms
 * ScenarioCard shows. No diagram library: plain boxes + arrows render
 * reliably offline and never break on a projector.
 *
 * @param {{ scenarios: Array }} props  Same scenarios array ScenarioConfigTab
 *   already has from useScenario()'s draft.
 */
export default function ScenarioFlowView({ scenarios }) {
  return (
    <div className={styles.wrap}>
      {scenarios.map((scenario) => (
        <Card key={scenario.scenario_id} className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.orderBadge}>Scenario {scenario.scenario_order}</span>
            <h3 className={styles.columnTitle}>{scenario.scenario_title || '(untitled)'}</h3>
            <span className={styles.sceneTag}>{sceneLabelFor(scenario.scene)}</span>
          </div>

          <div className={styles.arrowDown} aria-hidden="true">↓</div>

          <div className={styles.choices}>
            {scenario.choices.map((choice) => (
              <div key={choice.scenario_choice_id} className={styles.choiceNode}>
                <div className={styles.choiceHeader}>
                  <span className={`${badges.pill} ${choice.is_safe_choice ? badges.safe : badges.risky}`}>
                    {choice.is_safe_choice ? 'Safe' : 'Risky'}
                  </span>
                </div>
                <p className={styles.choiceText}>{choice.choice_text || '(no choice description yet)'}</p>
                <div className={styles.arrowDown} aria-hidden="true">↓</div>
                <div className={styles.outcomeNode} data-safe={choice.is_safe_choice}>
                  <p className={styles.outcomeTitle}>{choice.outcome_title || '(no outcome title yet)'}</p>
                  {!choice.is_safe_choice && (
                    <span className={styles.outcomeMeta}>
                      ⚠ {CONSEQUENCE_TYPE_LABELS[choice.consequence_type] || choice.consequence_type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
