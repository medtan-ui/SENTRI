import { useCallback, useMemo } from 'react'
import { getScenario, saveScenario, getDefaultScenario } from '../services/scenarioService'
import { validateModuleConfig } from '../features/admin/scenario-config/hooks/validateScenarioConfig'
import { MIN_CHOICES, MAX_CHOICES } from '../features/admin/scenario-config/types/scenarioConfigAdmin.types'
import { useDraftResource } from './useDraftResource'

function generateChoiceId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `choice-${crypto.randomUUID()}`
    : `choice-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

function blankChoice() {
  return { id: generateChoiceId(), text: '', isSafe: false, feedbackTitle: '', feedbackText: '' }
}

/**
 * useScenario
 * Loads and edits one module's Scenario Engine configuration — the
 * Scenario Configuration tab's data source. Manages loading/error/
 * success and optimistic save. The persisted shape is exactly what the
 * Scenario Engine consumes; this hook never changes that shape, only
 * where it's read from and written to (Firestore, via scenarioService).
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

  const updateScenario = useCallback((scenarioId, patch) => {
    setDraft((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) => (s.id === scenarioId ? { ...s, ...patch } : s)),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateChoice = useCallback((scenarioId, choiceId, patch) => {
    setDraft((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) =>
        s.id !== scenarioId
          ? s
          : { ...s, choices: s.choices.map((c) => (c.id === choiceId ? { ...c, ...patch } : c)) },
      ),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setConsequenceEnabled = useCallback((scenarioId, choiceId, enabled) => {
    setDraft((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) => {
        if (s.id !== scenarioId) return s
        return {
          ...s,
          choices: s.choices.map((c) => {
            if (c.id !== choiceId) return c
            if (!enabled) {
              const { consequenceVideo, ...rest } = c
              return rest
            }
            return {
              ...c,
              consequenceVideo: c.consequenceVideo || {
                videoUrl: '',
                videoAvailable: false,
                thumbnail: '',
                duration: 15,
              },
            }
          }),
        }
      }),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addChoice = useCallback((scenarioId) => {
    setDraft((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) => {
        if (s.id !== scenarioId) return s
        if (s.choices.length >= MAX_CHOICES) return s
        return { ...s, choices: [...s.choices, blankChoice()] }
      }),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const removeChoice = useCallback((scenarioId, choiceId) => {
    setDraft((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) => {
        if (s.id !== scenarioId) return s
        if (s.choices.length <= MIN_CHOICES) return s
        return { ...s, choices: s.choices.filter((c) => c.id !== choiceId) }
      }),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moveChoice = useCallback((scenarioId, choiceId, direction) => {
    setDraft((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) => {
        if (s.id !== scenarioId) return s
        const index = s.choices.findIndex((c) => c.id === choiceId)
        const targetIndex = index + direction
        if (index === -1 || targetIndex < 0 || targetIndex >= s.choices.length) return s
        const nextChoices = [...s.choices]
        ;[nextChoices[index], nextChoices[targetIndex]] = [nextChoices[targetIndex], nextChoices[index]]
        return { ...s, choices: nextChoices }
      }),
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
      updateScenario,
      updateChoice,
      setConsequenceEnabled,
      addChoice,
      removeChoice,
      moveChoice,
      save,
      cancel: resource.cancel,
      resetToDefaults: resource.resetToDefaults,
    },
  }
}
