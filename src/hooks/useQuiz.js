import { useCallback, useMemo } from 'react'
import { getQuiz, saveQuiz, getDefaultQuiz } from '../services/quizService'
import { validateQuizConfig } from '../features/admin/quiz-config/hooks/validateQuizQuestion'
import { useDraftResource } from './useDraftResource'

function reorder(questions) {
  return questions.map((q, index) => ({ ...q, order: index + 1 }))
}

/**
 * useQuiz
 * Loads and edits one module's quiz configuration — settings and its
 * fixed set of questions — the Quiz Configuration tab's data source.
 * Manages loading/error/success and optimistic save.
 *
 * @param {string} moduleId
 */
export function useQuiz(moduleId) {
  const resource = useDraftResource(moduleId, {
    get: getQuiz,
    save: saveQuiz,
    getDefault: getDefaultQuiz,
  })
  const { draft, setDraft, persist } = resource

  const validations = useMemo(() => (draft ? validateQuizConfig(draft) : []), [draft])
  const isValid = validations.length > 0 && validations.every((v) => v.isValid)

  const updateSettings = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
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
