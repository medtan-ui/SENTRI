import React from 'react'
import Card from '../../../../components/Card/Card'
import badges from '../styles/badges.module.css'
import styles from './ScenarioOverviewCard.module.css'

/**
 * ScenarioOverviewCard
 * Module Name + a short overview blurb, plus an at-a-glance validity
 * summary for every predefined scenario (so an admin can see which
 * scenario needs attention before expanding it).
 */
export default function ScenarioOverviewCard({ moduleName, overviewDescription, scenarios, validations }) {
  return (
    <Card className={styles.card}>
      <h2 className={styles.moduleName}>{moduleName}</h2>
      {overviewDescription && <p className={styles.description}>{overviewDescription}</p>}

      <div className={styles.summaryRow}>
        {scenarios.map((scenario) => {
          const validation = validations.find((v) => v.scenarioId === scenario.scenario_id)
          const isValid = validation?.isValid ?? true
          return (
            <div key={scenario.scenario_id} className={styles.summaryItem}>
              <span className={styles.summaryOrder}>Scenario {scenario.scenario_order}</span>
              <span className={styles.summaryTitle}>{scenario.scenario_title || '(untitled)'}</span>
              <span className={`${badges.pill} ${isValid ? badges.valid : badges.invalid}`}>
                {isValid
                  ? '✓ Valid'
                  : `⚠ ${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
