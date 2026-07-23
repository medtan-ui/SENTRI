import React from 'react'
import Card from '../../../../components/Card/Card'
import badges from '../styles/badges.module.css'
import styles from './ScenarioFlowView.module.css'

/**
 * ScenarioFlowView
 * Read-only, CSS-only branching diagram of all 3 scenarios — title, then
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
        <Card key={scenario.id} className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.orderBadge}>Scenario {scenario.order}</span>
            <h3 className={styles.columnTitle}>{scenario.title || '(untitled)'}</h3>
          </div>

          <div className={styles.arrowDown} aria-hidden="true">↓</div>

          <div className={styles.choices}>
            {scenario.choices.map((choice) => (
              <div key={choice.id} className={styles.choiceNode}>
                <div className={styles.choiceHeader}>
                  <span className={`${badges.pill} ${choice.isSafe ? badges.safe : badges.risky}`}>
                    {choice.isSafe ? 'Safe' : 'Risky'}
                  </span>
                </div>
                <p className={styles.choiceText}>{choice.text || '(no choice text yet)'}</p>
                <div className={styles.arrowDown} aria-hidden="true">↓</div>
                <div className={styles.outcomeNode} data-safe={choice.isSafe}>
                  <p className={styles.outcomeTitle}>{choice.feedbackTitle || '(no feedback title yet)'}</p>
                  {!choice.isSafe && (
                    <span className={styles.outcomeMeta}>
                      {choice.consequenceVideo ? '🎥 Video consequence' : '🖼 Still-image consequence'}
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
