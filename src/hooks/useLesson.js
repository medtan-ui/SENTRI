import { useCallback } from 'react'
import { getLesson, saveLesson, getDefaultLesson } from '../services/lessonService'
import { useDraftResource } from './useDraftResource'

function validateLesson(draft) {
  const issues = []
  if (!draft.introduction || !draft.introduction.trim()) {
    issues.push({ field: 'introduction', message: 'Introduction is required.' })
  }
  if (!draft.lessonContent || !draft.lessonContent.trim()) {
    issues.push({ field: 'lessonContent', message: 'Lesson content is required.' })
  }
  return issues
}

/**
 * useLesson
 * Loads and edits one module's lesson content (introduction, learning
 * objectives, lesson content, real-world example, best practices, key
 * takeaways, references) — the Lesson Content Editor's data source.
 * Manages loading/error/success and optimistic save.
 *
 * @param {string} moduleId
 */
export function useLesson(moduleId) {
  const resource = useDraftResource(moduleId, {
    get: getLesson,
    save: saveLesson,
    getDefault: getDefaultLesson,
  })
  const { draft, persist } = resource

  const issues = draft ? validateLesson(draft) : []
  const isValid = issues.length === 0

  const updateField = useCallback((key, value) => {
    resource.setDraft((prev) => ({ ...prev, [key]: value }))
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
    lesson: draft,
    issues,
    isValid,
    dirty: resource.dirty,
    saveState: resource.saveState,
    notice: resource.notice,
    actions: {
      updateField,
      save,
      cancel: resource.cancel,
      resetToDefaults: resource.resetToDefaults,
    },
  }
}
