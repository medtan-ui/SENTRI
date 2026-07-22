import { useCallback, useEffect, useState } from 'react'
import { getModule, saveModule, getDefaultModule, listModules } from '../services/moduleService'
import { useDraftResource } from './useDraftResource'

function validateModule(draft) {
  const issues = []
  if (!draft.title || !draft.title.trim()) {
    issues.push({ field: 'title', message: 'Module title is required.' })
  }
  if (!draft.description || !draft.description.trim()) {
    issues.push({ field: 'description', message: 'Description is required.' })
  }
  return issues
}

/**
 * useModule
 * Loads and edits one module's base record (title, description,
 * difficulty, estimatedTime, status, prerequisite) — the Overview tab's
 * data source. Manages loading/error/success and optimistic save.
 *
 * @param {string} moduleId
 */
export function useModule(moduleId) {
  const resource = useDraftResource(moduleId, {
    get: getModule,
    save: saveModule,
    getDefault: getDefaultModule,
  })
  const { draft, persist } = resource

  const issues = draft ? validateModule(draft) : []
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
    module: draft,
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

/**
 * useModuleList
 * Read-only list of all six modules, sorted by moduleOrder — used by
 * PrerequisitesTab (and any future curriculum-wide view) to show the
 * other modules' current names without touching draft/edit state. Field
 * names are adapted here (title -> name) to match the shape components
 * already expect, so those components stay unchanged.
 */
export function useModuleList() {
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [modules, setModules] = useState([])
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    listModules()
      .then((docs) => {
        if (cancelled) return
        setModules(docs.map((d) => ({ id: d.moduleId, name: d.title, ...d })))
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Something went wrong. Please try again.')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [retryToken])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  return { status, errorMessage, retry, modules }
}
