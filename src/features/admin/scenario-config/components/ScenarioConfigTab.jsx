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
 * The Scenario tab inside Module Configuration. What's saved here is the
 * Scenario Engine's own configuration, and students run it: see
 * services/moduleLoader.js, which layers this document over the authored
 * config before handing it to the engine.
 *
 * Administrators configure content only — scenario and choice copy, the
 * opening clip, and consequence framing. Scenarios are never created,
 * deleted, or reordered, and choice wiring (which scene renders a
 * scenario, which interactive target maps to which choice, which choice
 * is safe) is code-owned and shown read-only.
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

          <p className={styles.liveNote}>
            Saved changes go live for students the next time they open this module's simulation.
          </p>

          <ScenarioOverviewCard
            moduleName={moduleName}
            overviewDescription={overview?.description}
            scenarios={draft.scenarios}
            validations={validations}
          />

          <div className={styles.cardList}>
            {draft.scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.scenarioId}
                scenario={scenario}
                validation={validations.find((v) => v.scenarioId === scenario.scenarioId)}
                onUpdateScenario={(patch) => actions.updateScenario(scenario.scenarioId, patch)}
                onUpdateChoice={(choiceId, patch) =>
                  actions.updateChoice(scenario.scenarioId, choiceId, patch)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
