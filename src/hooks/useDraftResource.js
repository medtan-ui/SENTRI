import { useCallback, useEffect, useState } from 'react'

function clone(value) {
  return value === null || value === undefined ? value : JSON.parse(JSON.stringify(value))
}

/**
 * useDraftResource
 * Shared fetch + draft/dirty + save/cancel/reset mechanics reused by
 * every Training Curriculum hook (useModule, useLesson, useScenario,
 * useQuiz, useAssignments): the loading/error/success fetch lifecycle
 * (with retry) plus optimistic-save bookkeeping. Each domain hook wraps
 * this with its own field-specific update actions and, where relevant,
 * its own validation before calling `persist`.
 *
 * This is the "Hooks" layer talking to the "Services" layer — no
 * Firestore calls happen here directly, only through the `get`/`save`
 * functions passed in.
 *
 * @param {string} resourceId
 * @param {{
 *   get: (id: string) => Promise<object|null>,
 *   save: (id: string, data: object) => Promise<void>,
 *   getDefault?: (id: string) => object|null,
 * }} services
 */
export function useDraftResource(resourceId, { get, save, getDefault }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success' | 'not-found'
  const [errorMessage, setErrorMessage] = useState('')
  const [savedData, setSavedData] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saveState, setSaveState] = useState('idle') // 'idle' | 'saving' | 'saved'
  const [notice, setNotice] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')
    setDraft(null)
    setSavedData(null)

    get(resourceId)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setStatus('not-found')
          return
        }
        setSavedData(result)
        setDraft(clone(result))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, retryToken])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(''), 3200)
    return () => clearTimeout(t)
  }, [notice])

  const dirty = draft && savedData ? JSON.stringify(draft) !== JSON.stringify(savedData) : false

  // A fresh edit after a successful save should stop showing "Saved".
  useEffect(() => {
    if (saveState === 'saved' && dirty) setSaveState('idle')
  }, [dirty, saveState])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  const persist = useCallback(async () => {
    setSaveState('saving')
    try {
      await save(resourceId, draft)
      setSavedData(clone(draft))
      setSaveState('saved')
      setNotice('Saved successfully.')
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2500)
      return true
    } catch (err) {
      setSaveState('idle')
      setNotice(err?.message || 'Unable to save. Please try again.')
      return false
    }
  }, [resourceId, draft, save])

  const cancel = useCallback(() => {
    setDraft(clone(savedData))
    setNotice('Changes discarded.')
  }, [savedData])

  const resetToDefaults = useCallback(() => {
    if (!getDefault) return
    const defaults = getDefault(resourceId)
    if (defaults) {
      setDraft(clone(defaults))
      setNotice('Reset to default content — click Save to keep it.')
    }
  }, [resourceId, getDefault])

  return {
    status,
    errorMessage,
    retry,
    draft,
    setDraft,
    dirty,
    saveState,
    notice,
    persist,
    cancel,
    resetToDefaults,
  }
}
