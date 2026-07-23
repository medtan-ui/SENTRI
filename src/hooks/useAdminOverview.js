import { useCallback, useEffect, useState } from 'react'
import { listUsers } from '../services/adminService'
import { getModuleAnalytics, getRecentQuizAttempts } from '../services/analyticsService'
import { useModuleList } from './useModule'

/**
 * useAdminOverview
 * Everything the Admin Dashboard's stat cards, recent-activity feed, and
 * per-module completion widget need — all real reads, no mock data:
 * accounts (listUsers), recent quiz attempts (analyticsService, admin-only
 * per firestore.rules), and each module's last-aggregated analytics summary
 * (null if nobody has visited /admin/analytics and refreshed it yet).
 */
export function useAdminOverview() {
  const { status: modulesStatus, errorMessage: modulesErrorMessage, retry: retryModules, modules } = useModuleList()

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [users, setUsers] = useState([])
  const [recentAttempts, setRecentAttempts] = useState([])
  const [moduleSummaries, setModuleSummaries] = useState({})

  useEffect(() => {
    if (modulesStatus !== 'success') return undefined
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')

    Promise.all([
      listUsers(),
      getRecentQuizAttempts(15),
      Promise.all(modules.map((m) => getModuleAnalytics(m.id).catch(() => null))),
    ])
      .then(([userList, attempts, summaries]) => {
        if (cancelled) return
        setUsers(userList)
        setRecentAttempts(attempts)
        setModuleSummaries(Object.fromEntries(modules.map((m, i) => [m.id, summaries[i]])))
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Something went wrong loading the dashboard. Please try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesStatus, retryToken])

  const retry = useCallback(() => {
    if (modulesStatus === 'error') {
      retryModules()
      return
    }
    setRetryToken((n) => n + 1)
  }, [modulesStatus, retryModules])

  return {
    status: modulesStatus === 'error' ? 'error' : status,
    errorMessage: modulesStatus === 'error' ? modulesErrorMessage : errorMessage,
    retry,
    modules,
    users,
    recentAttempts,
    moduleSummaries,
  }
}
