import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listStudentModuleProgress } from '../services/moduleProgressService'

/**
 * useStudentModules
 * Every one of SENTRI's six modules — admin metadata merged with the
 * signed-in student's own progress and derived status, sorted by
 * moduleOrder. The Dashboard's module grid is the only consumer; it
 * reads, it never mutates (see useModuleProgress for that).
 */
export function useStudentModules() {
  const { user } = useAuth()
  const userId = user?.uid ?? null

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [modules, setModules] = useState([])
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')

    listStudentModuleProgress(userId)
      .then((result) => {
        if (cancelled) return
        setModules(result)
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Something went wrong loading your modules. Please try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [userId, retryToken])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  return { status, errorMessage, retry, modules }
}
