import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAssessmentForStudent, submitAssessment } from '../services/assessmentService'
import { recordEvent } from '../services/analyticsEventService'
import { getModuleProgress } from '../services/moduleProgressService'

/**
 * useModuleAssessment
 * Drives a module's ungraded pre-test — the baseline a student answers
 * once, before their first lesson.
 *
 * There is no matching per-module post-test any more. The "after" half of
 * the measurement is the single end-of-curriculum final assessment (see
 * useFinalAssessment), which reuses these same items so the comparison
 * still holds. This hook keeps its `assessmentType` parameter only
 * because the Cloud Function's payload has one; 'pretest' is now the
 * only accepted value, server-side included.
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
 * @param {'pretest'} assessmentType
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

    // Progress first, item bank second, and deliberately not as one
    // Promise.all: a student who has already sat this pre-test never sees
    // the gate again (the Lesson Viewer reads `completed` and skips
    // straight past it), so failing to load the questions must not lock
    // them out of a module they came back to review. A first-timer
    // genuinely needs those questions, so for them the same failure is
    // still a real error.
    getModuleProgress(userId, moduleId)
      .then(async (progress) => {
        const alreadyCompleted = Boolean(progress?.preTestCompleted)
        let assessmentDoc = null
        try {
          assessmentDoc = await getAssessmentForStudent(moduleId)
        } catch (err) {
          if (!alreadyCompleted) throw err
          console.error(
            '[useModuleAssessment] pre-test items failed to load — already completed, letting the lesson through:',
            err,
          )
        }
        if (cancelled) return
        setAssessment(assessmentDoc)
        setCompleted(alreadyCompleted)
        // The pre-test has no precondition beyond the module being open.
        setEligible(true)
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
        recordEvent('pretest_submitted', {
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
