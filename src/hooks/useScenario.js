import { useCallback, useMemo } from 'react'
import { getScenario, saveScenario, getDefaultScenario } from '../services/scenarioService'
import { validateModuleConfig } from '../features/admin/scenario-config/hooks/validateScenarioConfig'
import { useDraftResource } from './useDraftResource'

/**
 * useScenario
 * Loads and edits one module's Scenario Engine configuration — the
 * Scenario Configuration tab's data source. Manages loading/error/
 * success and optimistic save.
 *
 * The persisted shape is exactly what the Scenario Engine consumes, and
 * what students actually run (services/moduleLoader.js layers a saved
 * document over the authored config before handing it to the engine).
 *
 * There is deliberately no addChoice/removeChoice/moveChoice here any
 * more. Each choice is bound to a named interactive `target` inside a
 * hand-authored scene component; a choice with no target is unreachable,
 * and a removed choice leaves a live target with nothing to resolve to.
 * Choice *structure* is code-owned — this hook edits copy and media only.
 *
 * @param {string} moduleId
 */
export function useScenario(moduleId) {
  const resource = useDraftResource(moduleId, {
    get: getScenario,
    save: saveScenario,
    getDefault: getDefaultScenario,
  })
  const { draft, setDraft, persist } = resource

  const validations = useMemo(() => (draft ? validateModuleConfig(draft) : []), [draft])
  const isValid = validations.length > 0 && validations.every((v) => v.isValid)

  const updateModule = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateScenario = useCallback((scenarioId, patch) => {
    setDraft((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) => (s.scenarioId === scenarioId ? { ...s, ...patch } : s)),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateChoice = useCallback((scenarioId, choiceId, patch) => {
    setDraft((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) =>
        s.scenarioId !== scenarioId
          ? s
          : {
              ...s,
              choices: s.choices.map((c) => (c.scenarioChoiceId === choiceId ? { ...c, ...patch } : c)),
            },
      ),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = useCallback(async () => {
    if (!isValid) return false
    return persist()
  }, [isValid, persist])

  return {
    status: resource.status,
    errorMessage: resource.errorMessage,
    retry: resource.retry,
    draft,
    validations,
    isValid,
    dirty: resource.dirty,
    saveState: resource.saveState,
    notice: resource.notice,
    actions: {
      updateModule,
      updateScenario,
      updateChoice,
      save,
      cancel: resource.cancel,
      resetToDefaults: resource.resetToDefaults,
    },
  }
}
