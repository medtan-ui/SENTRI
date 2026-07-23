import React, { useState } from 'react'
import Button from '../../../../components/Button/Button'
import LoadingSkeleton from '../../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../../components/ErrorState/ErrorState'
import { useScenario } from '../../../../hooks/useScenario'
import ScenarioOverviewCard from './ScenarioOverviewCard'
import ScenarioCard from './ScenarioCard'
import ScenarioFlowView from './ScenarioFlowView'
import styles from './ScenarioConfigTab.module.css'

/**
 * ScenarioConfigTab
 * The Scenario tab inside Module Configuration. Administrators only
 * configure the content the reusable Scenario Engine consumes for this
 * module's three predefined scenarios — no creating, deleting, or
 * reordering scenarios, no drag-and-drop, no arbitrary branching.
 *
 * Data comes from useScenario() (Hooks layer, backed by scenarioService
 * → Firestore). This component only renders — it never talks to
 * Firestore directly.
 */
export default function ScenarioConfigTab({ moduleId, moduleName, overview }) {
  const { status, errorMessage, retry, draft, validations, isValid, dirty, saveState, notice, actions } =
    useScenario(moduleId)
  const [viewMode, setViewMode] = useState('edit') // 'edit' | 'flow'

  if (status === 'loading') {
    return <LoadingSkeleton blocks={3} rows={4} />
  }

  if (status === 'error') {
    return <ErrorState message={errorMessage} onRetry={retry} />
  }

  if (status === 'not-found' || !draft) {
    return <p className={styles.loading}>No scenario configuration exists for this module yet.</p>
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topActions}>
        <div className={styles.topActionsLeft}>
          <Button variant="ghost" onClick={actions.resetToDefaults} disabled={saveState === 'saving'}>
            Reset to Defaults
          </Button>
          <Button variant="ghost" onClick={() => setViewMode((v) => (v === 'edit' ? 'flow' : 'edit'))}>
            {viewMode === 'edit' ? '🔀 View Scenario Flow' : '✎ Back to Editing'}
          </Button>
        </div>
        {viewMode === 'edit' && (
          <div className={styles.topActionsRight}>
            <Button variant="ghost" onClick={actions.cancel} disabled={!dirty || saveState === 'saving'}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={actions.save}
              disabled={!dirty || !isValid || saveState === 'saving'}
            >
              {saveState === 'saving' ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {viewMode === 'flow' ? (
        <ScenarioFlowView scenarios={draft.scenarios} />
      ) : (
        <>
          {notice && (
            <div className={styles.notice} role="status">
              <span aria-hidden="true">✓</span> {notice}
            </div>
          )}

          {!isValid && (
            <div className={styles.blockingBanner} role="alert">
              Fix the issues marked below before saving.
            </div>
          )}

          <ScenarioOverviewCard
            moduleName={moduleName}
            overviewDescription={overview?.description}
            scenarios={draft.scenarios}
            validations={validations}
          />

          <div className={styles.cardList}>
            {draft.scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                surface={draft.surface}
                validation={validations.find((v) => v.scenarioId === scenario.id)}
                onUpdateScenario={(patch) => actions.updateScenario(scenario.id, patch)}
                onUpdateChoice={(choiceId, patch) => actions.updateChoice(scenario.id, choiceId, patch)}
                onAddChoice={() => actions.addChoice(scenario.id)}
                onRemoveChoice={(choiceId) => actions.removeChoice(scenario.id, choiceId)}
                onMoveChoice={(choiceId, direction) => actions.moveChoice(scenario.id, choiceId, direction)}
                onSetConsequenceEnabled={(choiceId, enabled) =>
                  actions.setConsequenceEnabled(scenario.id, choiceId, enabled)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
