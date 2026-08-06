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
        <Card key={scenario.scenarioId} className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.orderBadge}>Scenario {scenario.scenarioOrder}</span>
            <h3 className={styles.columnTitle}>{scenario.scenarioTitle || '(untitled)'}</h3>
            <span className={styles.sceneTag}>{sceneLabelFor(scenario.scene)}</span>
          </div>

          <div className={styles.arrowDown} aria-hidden="true">↓</div>

          <div className={styles.choices}>
            {scenario.choices.map((choice) => (
              <div key={choice.scenarioChoiceId} className={styles.choiceNode}>
                <div className={styles.choiceHeader}>
                  <span className={`${badges.pill} ${choice.isSafeChoice ? badges.safe : badges.risky}`}>
                    {choice.isSafeChoice ? 'Safe' : 'Risky'}
                  </span>
                </div>
                <p className={styles.choiceText}>{choice.choiceText || '(no choice description yet)'}</p>
                <div className={styles.arrowDown} aria-hidden="true">↓</div>
                <div className={styles.outcomeNode} data-safe={choice.isSafeChoice}>
                  <p className={styles.outcomeTitle}>{choice.outcomeTitle || '(no outcome title yet)'}</p>
                  {!choice.isSafeChoice && (
                    <span className={styles.outcomeMeta}>
                      ⚠ {CONSEQUENCE_TYPE_LABELS[choice.consequenceType] || choice.consequenceType}
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
