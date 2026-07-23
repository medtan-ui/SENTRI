import { useCallback, useEffect, useState } from 'react'
import { listUsers } from '../services/adminService'

/**
 * useStudentRoster
 * The real list of registered student accounts (role === 'student'),
 * for pickers like the Assignments tab's "Individual Students" list —
 * replaces what used to be MOCK_STUDENTS. Read-only; account creation
 * happens on the Accounts page.
 */
export function useStudentRoster() {
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [students, setStudents] = useState([])
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')

    listUsers()
      .then((users) => {
        if (cancelled) return
        setStudents(users.filter((u) => u.role === 'student'))
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Something went wrong loading students. Please try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [retryToken])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  return { status, errorMessage, retry, students }
}
