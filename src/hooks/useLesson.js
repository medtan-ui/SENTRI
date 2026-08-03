import { useCallback } from 'react'
import { getLesson, saveLesson, getDefaultLesson } from '../services/lessonService'
import { useDraftResource } from './useDraftResource'

function validateLesson(draft) {
  const issues = []
  if (!Array.isArray(draft.sections) || draft.sections.length === 0) {
    issues.push({ field: 'sections', message: 'A lesson needs at least one section.' })
    return issues
  }
  draft.sections.forEach((section, index) => {
    if (!section.title || !section.title.trim()) {
      issues.push({ field: `sections.${index}.title`, message: `Section ${index + 1}: title is required.` })
    }
    if (!section.content || !section.content.trim()) {
      issues.push({ field: `sections.${index}.content`, message: `Section ${index + 1}: content is required.` })
    }
  })
  if (!draft.objectives.some((o) => o.trim())) {
    issues.push({ field: 'objectives', message: 'At least one learning objective is required.' })
  }
  return issues
}

/**
 * useLesson
 * Loads and edits one module's lesson content — the video slot, learning
 * objectives, ordered reading sections, best practices, key takeaways,
 * and references. This is the Lesson Content Editor's data source, and
 * the same document the student Lesson Viewer renders (see
 * services/moduleLoader.js), so saving here publishes.
 *
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
