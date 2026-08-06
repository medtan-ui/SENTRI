import { useCallback, useMemo } from 'react'
import {
  getFinalAssessment,
  saveFinalAssessment,
  getDefaultFinalAssessmentConfig,
} from '../services/finalAssessmentService'
import { validateQuizConfig } from '../features/admin/quiz-config/hooks/validateQuizQuestion'
import { useDraftResource } from './useDraftResource'

function reorder(questions) {
  return questions.map((q, index) => ({ ...q, order: index + 1 }))
}

/**
 * useFinalAssessmentConfig
 * The admin editor's data source for SENTRI's one end-of-curriculum
 * assessment — the same draft/dirty/save mechanics as useQuiz, against a
 * single config document instead of one per module.
 *
 * Reuses the module quiz's validation wholesale: the two share a question
 * shape (four choices, one correct, an explanation, a topic), so a second
 * near-identical rule set would only be a place for them to drift apart.
 *
 * Saving goes through the updateFinalAssessment callable rather than a
 * direct Firestore write, so the same question set is validated
 * server-side before it can ever reach a student.
 */
export function useFinalAssessmentConfig() {
  const resource = useDraftResource('config', {
    get: getFinalAssessment,
    save: (_id, data) => saveFinalAssessment(data),
    getDefault: getDefaultFinalAssessmentConfig,
  })
  const { draft, setDraft, persist } = resource

  const validations = useMemo(() => (draft ? validateQuizConfig(draft) : []), [draft])
  const isValid = validations.length > 0 && validations.every((v) => v.isValid)

  const updateSettings = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateTitle = useCallback((title) => {
    setDraft((prev) => ({ ...prev, title }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateQuestion = useCallback((questionId, patch) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateChoiceText = useCallback((questionId, choiceId, text) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id !== questionId
          ? q
          : { ...q, choices: q.choices.map((c) => (c.id === choiceId ? { ...c, text } : c)) },
      ),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setCorrectChoice = useCallback((questionId, choiceId) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? { ...q, correctChoiceId: choiceId } : q)),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moveQuestion = useCallback((questionId, direction) => {
    setDraft((prev) => {
      const index = prev.questions.findIndex((q) => q.id === questionId)
      const targetIndex = index + direction
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.questions.length) return prev
      const nextQuestions = [...prev.questions]
      ;[nextQuestions[index], nextQuestions[targetIndex]] = [nextQuestions[targetIndex], nextQuestions[index]]
      return { ...prev, questions: reorder(nextQuestions) }
    })
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
      updateTitle,
      updateSettings,
      updateQuestion,
      updateChoiceText,
      setCorrectChoice,
      moveQuestion,
      save,
      cancel: resource.cancel,
      resetToDefaults: resource.resetToDefaults,
    },
  }
}
