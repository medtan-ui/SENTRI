import React, { useState } from 'react'
import Card from '../../../../components/Card/Card'
import { sceneLabelFor } from '../../../scenario/engine/sceneLabels'
import VideoSection from './VideoSection'
import ChoiceList from './ChoiceList'
import PreviewPanel from './PreviewPanel'
import badges from '../styles/badges.module.css'
import forms from '../styles/formControls.module.css'
import styles from './ScenarioCard.module.css'

/**
 * ScenarioCard
 * One predefined scenario, fully expandable/collapsible. Scenario order
 * and the scene that renders it are fixed and shown read-only — only the
 * copy and media students encounter are editable, never the scenario's
 * position, existence, or interaction wiring.
 */
export default function ScenarioCard({
  scenario,
  validation,
  defaultExpanded = false,
  onUpdateScenario,
  onUpdateChoice,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const scenarioLevelIssues = validation.issues.filter((issue) =>
    ['safeChoice', 'scenario_title', 'scenario_description', 'posterCaption'].includes(issue.field),
  )
  const titleError = validation.issues.find((i) => i.field === 'scenario_title')?.message || ''
  const descriptionError =
    validation.issues.find((i) => i.field === 'scenario_description')?.message || ''

  return (
    <Card className={styles.card}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className={styles.headerLeft}>
          <span className={styles.orderBadge}>Scenario {scenario.scenario_order}</span>
          <span className={styles.titlePreview}>{scenario.scenario_title || '(untitled)'}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={`${badges.pill} ${validation.isValid ? badges.valid : badges.invalid}`}>
            {validation.isValid
              ? '✓ Valid'
              : `⚠ ${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}
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
              <label className={forms.fieldLabel} htmlFor={`${scenario.scenario_id}-title`}>
                Scenario Title
              </label>
              <input
                id={`${scenario.scenario_id}-title`}
                className={`${styles.titleInput} ${titleError ? forms.textareaError : ''}`}
                value={scenario.scenario_title}
                onChange={(e) => onUpdateScenario({ scenario_title: e.target.value })}
              />
            </div>
            <div className={styles.orderDisplay}>
              <span className={forms.fieldLabel}>Order</span>
              <span className={styles.orderValue}>{scenario.scenario_order}</span>
            </div>
          </div>

          <div className={styles.structuralRow}>
            <span className={styles.structuralChip} title={`Rendered by the ${scenario.scene} component`}>
              {sceneLabelFor(scenario.scene)} · <code>{scenario.scene}</code>
            </span>
            <span className={styles.structuralNote}>Scene wired in code, not editable here</span>
          </div>

          <div className={forms.fieldGroup} style={{ marginTop: 'var(--space-4)' }}>
            <label className={forms.fieldLabel} htmlFor={`${scenario.scenario_id}-description`}>
              Scenario Description
            </label>
            <textarea
              id={`${scenario.scenario_id}-description`}
              className={`${forms.textarea} ${descriptionError ? forms.textareaError : ''}`}
              rows={2}
              value={scenario.scenario_description}
              onChange={(e) => onUpdateScenario({ scenario_description: e.target.value })}
            />
          </div>

          <div className={forms.fieldGroup} style={{ marginTop: 'var(--space-4)' }}>
            <label className={forms.fieldLabel} htmlFor={`${scenario.scenario_id}-reflection`}>
              Closing Reflection <span className={styles.labelHint}>(optional — shown once this scenario is resolved safely)</span>
            </label>
            <textarea
              id={`${scenario.scenario_id}-reflection`}
              className={forms.textarea}
              rows={2}
              value={scenario.postCompletionReflection || ''}
              onChange={(e) =>
                onUpdateScenario({ postCompletionReflection: e.target.value || undefined })
              }
            />
          </div>

          <div className={styles.layout}>
            <div className={styles.editColumn}>
              <VideoSection scenario={scenario} errors={validation.issues} onUpdate={onUpdateScenario} />
              <ChoiceList
                choices={scenario.choices}
                issues={validation.issues}
                onUpdateChoice={onUpdateChoice}
              />
            </div>
            <div className={styles.previewColumn}>
              <PreviewPanel scenario={scenario} />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
