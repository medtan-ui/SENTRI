import React, { useState } from 'react'
import Card from '../../../../components/Card/Card'
import VideoSection from './VideoSection'
import ChoiceList from './ChoiceList'
import PreviewPanel from './PreviewPanel'
import badges from '../styles/badges.module.css'
import forms from '../styles/formControls.module.css'
import styles from './ScenarioCard.module.css'

/**
 * ScenarioCard
 * One predefined scenario, fully expandable/collapsible. Scenario order
 * is fixed and shown read-only — only content (title, video pause point,
 * choices) is editable, never the scenario's position or existence.
 */
export default function ScenarioCard({
  scenario,
  validation,
  surface,
  defaultExpanded = false,
  onUpdateScenario,
  onUpdateChoice,
  onAddChoice,
  onRemoveChoice,
  onMoveChoice,
  onSetConsequenceEnabled,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const scenarioLevelIssues = validation.issues.filter(
    (issue) => issue.field === 'safeChoice' || issue.field === 'pauseTimestamp',
  )
  const pauseError = validation.issues.find((issue) => issue.field === 'pauseTimestamp')?.message

  return (
    <Card className={styles.card}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className={styles.headerLeft}>
          <span className={styles.orderBadge}>Scenario {scenario.order}</span>
          <span className={styles.titlePreview}>{scenario.title || '(untitled)'}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={`${badges.pill} ${validation.isValid ? badges.valid : badges.invalid}`}>
            {validation.isValid ? '✓ Valid' : `⚠ ${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}
          </span>
          <span className={styles.chevron} data-expanded={expanded} aria-hidden="true">▾</span>
        </div>
      </button>

      {expanded && (
        <div className={styles.body}>
          {scenarioLevelIssues.length > 0 && (
            <div className={styles.issueBanner}>
              {scenarioLevelIssues.map((issue) => (
                <p key={issue.field}>{issue.message}</p>
              ))}
            </div>
          )}

          <div className={styles.titleRow}>
            <div className={forms.fieldGroup} style={{ flex: 1 }}>
              <label className={forms.fieldLabel} htmlFor={`${scenario.id}-title`}>Scenario Title</label>
              <input
                id={`${scenario.id}-title`}
                className={styles.titleInput}
                value={scenario.title}
                onChange={(e) => onUpdateScenario({ title: e.target.value })}
              />
            </div>
            <div className={styles.orderDisplay}>
              <span className={forms.fieldLabel}>Order</span>
              <span className={styles.orderValue}>{scenario.order}</span>
            </div>
          </div>

          <div className={styles.layout}>
            <div className={styles.editColumn}>
              <VideoSection
                video={scenario.video}
                pauseTimestamp={scenario.pauseTimestamp}
                pauseError={pauseError}
                onChangePauseTimestamp={(value) => onUpdateScenario({ pauseTimestamp: value })}
              />
              <ChoiceList
                choices={scenario.choices}
                issues={validation.issues}
                onUpdateChoice={onUpdateChoice}
                onRemoveChoice={onRemoveChoice}
                onMoveChoice={onMoveChoice}
                onAddChoice={onAddChoice}
                onSetConsequenceEnabled={onSetConsequenceEnabled}
              />
            </div>
            <div className={styles.previewColumn}>
              <PreviewPanel scenario={scenario} surface={surface} />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
