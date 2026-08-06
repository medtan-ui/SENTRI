import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAssessment, submitAssessment } from '../services/assessmentService'
import { recordEvent } from '../services/analyticsEventService'
import { getModuleProgress } from '../services/moduleProgressService'

/**
 * useModuleAssessment
 * Drives one of the two ungraded bookend assessments for a module — the
 * pre-test before the first lesson, or the post-test after the quiz.
 * Both run on the same item bank, so one hook serves both; the only
 * difference is which progress flag it reads and which `assessmentType`
 * it submits.
 *
 * Grading is server-side (submitAssessment). This hook never computes a
 * score — it collects answers, measures how long each question took, and
 * hands both to the Cloud Function.
 *
 * Deliberately never persists a partial attempt: only submit() writes
 * anything, so quitting or losing connection mid-assessment leaves the
 * completion flag false and the student simply sees the whole thing again
 * next time, with no separate resume state to manage.
 *
 * @param {string} moduleId
 * @param {'pretest'|'posttest'} assessmentType
 */
export function useModuleAssessment(moduleId, assessmentType = 'pretest') {
  const { user } = useAuth()
  const userId = user?.uid ?? null

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [assessment, setAssessment] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [eligible, setEligible] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!userId || !moduleId) return undefined
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')

    Promise.all([getAssessment(moduleId), getModuleProgress(userId, moduleId)])
      .then(([assessmentDoc, progress]) => {
        if (cancelled) return
        setAssessment(assessmentDoc)
        setCompleted(
          Boolean(assessmentType === 'pretest' ? progress?.preTestCompleted : progress?.postTestCompleted),
        )
        // A post-test only exists once the quiz has been submitted; the
        // pre-test has no precondition beyond the module being open.
        setEligible(assessmentType === 'pretest' ? true : Boolean(progress?.quizCompleted))
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Something went wrong loading this assessment. Please try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [userId, moduleId, assessmentType, retryToken])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  /**
   * @param {Record<string,string>} answers    questionId -> choiceId
   * @param {Record<string,number>} [durations] questionId -> milliseconds
   * @returns {Promise<{score:number, correctCount:number, total:number,
   *   normalizedGain:number|null, preTestScore:number|null} | null>}
   */
  const submit = useCallback(
    async (answers, durations) => {
      if (!assessment || !userId) return null
      setSubmitting(true)
      try {
        const outcome = await submitAssessment(moduleId, assessmentType, answers, durations)
        setCompleted(true)
        // Total time across the assessment, summed from the per-question
        // measurements the form already collected — no second stopwatch,
        // and questions never touched simply contribute nothing.
        const totalMs = Object.values(durations || {}).reduce((sum, ms) => sum + (ms || 0), 0)
        recordEvent(assessmentType === 'pretest' ? 'pretest_submitted' : 'posttest_submitted', {
          moduleId,
          durationMs: totalMs > 0 ? totalMs : undefined,
          payload: { score: outcome?.score ?? null },
        })
        return outcome
      } finally {
        setSubmitting(false)
      }
    },
    [assessment, userId, moduleId, assessmentType],
  )

  return { status, errorMessage, retry, assessment, completed, eligible, submitting, submit }
}
