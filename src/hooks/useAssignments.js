import { useCallback } from 'react'
import { getAssignments, saveAssignments, getDefaultAssignments } from '../services/assignmentService'
import { useDraftResource } from './useDraftResource'

function validateAssignments(draft) {
  const issues = []
  if (draft.assignmentType === 'students' && draft.assignedStudentIds.length === 0) {
    issues.push({ field: 'assignedStudentIds', message: 'Select at least one student.' })
  }
  return issues
}

/**
 * useAssignments
 * Loads and edits which students/sections a module is assigned to (or
 * "assign all") — the Assignments tab's data source. Manages loading/
 * error/success and optimistic save. `assignAll` and `assignmentDate`
 * are derived/stamped by assignmentService on save, not part of the
 * editable draft.
 *
 * @param {string} moduleId
 */
export function useAssignments(moduleId) {
  const resource = useDraftResource(moduleId, {
    get: getAssignments,
    save: saveAssignments,
    getDefault: getDefaultAssignments,
  })
  const { draft, persist } = resource

  const issues = draft ? validateAssignments(draft) : []
  const isValid = issues.length === 0

  const updateField = useCallback(
    (patch) => {
      resource.setDraft((prev) => ({ ...prev, ...patch }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const save = useCallback(async () => {
    if (!isValid) return false
    return persist()
  }, [isValid, persist])

  return {
    status: resource.status,
    errorMessage: resource.errorMessage,
    retry: resource.retry,
    assignments: draft,
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
