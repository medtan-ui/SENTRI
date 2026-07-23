import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPretest } from '../services/pretestService'
import { getModuleProgress, markPretestCompleted } from '../services/moduleProgressService'

/**
 * useModulePretest
 * Whether the signed-in student still needs to take this module's
 * pre-test, and the means to submit it. Deliberately never persists a
 * partial attempt — only submit() writes anything — so quitting or losing
 * connection mid-pretest leaves pretestCompleted false and the student
 * simply sees the full pre-test again next time, no separate resume state
 * to manage.
 *
 * @param {string} moduleId
 */
export function useModulePretest(moduleId) {
  const { user } = useAuth()
  const userId = user?.uid ?? null

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [pretest, setPretest] = useState(null)
  const [pretestCompleted, setPretestCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!userId || !moduleId) return undefined
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')

    Promise.all([getPretest(moduleId), getModuleProgress(userId, moduleId)])
      .then(([pretestDoc, progress]) => {
        if (cancelled) return
        setPretest(pretestDoc)
        setPretestCompleted(Boolean(progress?.pretestCompleted))
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Something went wrong loading the pre-test. Please try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [userId, moduleId, retryToken])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  /**
   * @param {Record<string,string>} answers  questionId -> choiceId
   * @returns {Promise<{score:number, correctCount:number, total:number}>}
   */
  const submit = useCallback(
    async (answers) => {
      if (!pretest || !userId) return null
      setSubmitting(true)
      try {
        const total = pretest.questions.length
        const correctCount = pretest.questions.filter((q) => answers[q.id] === q.correctChoiceId).length
        const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
        await markPretestCompleted(userId, moduleId, score)
        setPretestCompleted(true)
        return { score, correctCount, total }
      } finally {
        setSubmitting(false)
      }
    },
    [pretest, userId, moduleId],
  )

  return { status, errorMessage, retry, pretest, pretestCompleted, submitting, submit }
}
