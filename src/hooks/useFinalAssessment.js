import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudentModules } from './useStudentModules'
import { MODULE_STATUS } from '../services/moduleProgressService'
import {
  getFinalAssessmentForStudent,
  getFinalAssessmentProgress,
  submitFinalAssessment,
} from '../services/finalAssessmentService'
import { recordEvent } from '../services/analyticsEventService'

/**
 * useFinalAssessment
 * Drives SENTRI's single end-of-curriculum assessment: whether the student
 * has unlocked it, whether they've already taken it, and submitting an
 * attempt.
 *
 * Eligibility is "every module completed" — not a per-module gate, which
 * is the whole point of this replacing six per-module post-tests. The
 * check is duplicated server-side (submitFinalAssessment re-verifies it
 * inside its transaction); this hook's copy exists only so the UI can
 * explain the lock instead of failing on submit.
 *
 * Grading is server-side. This hook never computes a score — it collects
 * answers, measures how long each question took, and hands both to the
 * Cloud Function.
 */
export function useFinalAssessment() {
  const { user } = useAuth()
  const userId = user?.uid ?? null
  const { status: modulesStatus, modules } = useStudentModules()

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [assessment, setAssessment] = useState(null)
  const [progress, setProgress] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')

    Promise.all([getFinalAssessmentForStudent(), getFinalAssessmentProgress(userId)])
      .then(([config, progressDoc]) => {
        if (cancelled) return
        setAssessment(config)
        setProgress(progressDoc)
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Something went wrong loading the final assessment. Please try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [userId, retryToken])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  const totalModules = modules.length
  const completedModules = modules.filter((m) => m.status === MODULE_STATUS.COMPLETED).length
  // Only meaningful once the module list has actually loaded — before that,
  // completedModules and totalModules are both 0, which would otherwise
  // read as "all done".
  const unlocked = modulesStatus === 'success' && totalModules > 0 && completedModules === totalModules

  const attemptsUsed = progress?.attempts ?? 0
  const attemptsAllowed = progress?.attemptsAllowed ?? assessment?.settings?.attemptsAllowed ?? 1
  const passed = Boolean(progress?.passed)
  // A passing attempt closes it for good; a failing one only closes it once
  // the allowance is spent.
  const canAttempt = unlocked && !passed && attemptsUsed < attemptsAllowed

  const submit = useCallback(
    async (answers, durations) => {
      if (!assessment || !userId) return null
      setSubmitting(true)
      try {
        const outcome = await submitFinalAssessment(answers, durations)
        const totalMs = Object.values(durations || {}).reduce((sum, ms) => sum + (ms || 0), 0)
        recordEvent('posttest_submitted', {
          durationMs: totalMs > 0 ? totalMs : undefined,
          payload: { score: outcome?.score ?? null, finalAssessment: true },
        })
        // Refetch rather than patching locally: attempts, the stored gain,
        // and whether a retake actually replaced the recorded score are all
        // decided server-side, and guessing them here would drift.
        setProgress(await getFinalAssessmentProgress(userId))
        return outcome
      } finally {
        setSubmitting(false)
      }
    },
    [assessment, userId],
  )

  return {
    // 'loading' until BOTH the config read and the module list have
    // resolved. Without the module half, a page that renders a locked
    // state on `!unlocked` would flash "0 of 0 modules complete" before
    // the real counts arrive.
    status: status === 'success' && modulesStatus !== 'success' ? 'loading' : status,
    errorMessage,
    retry,
    assessment,
    progress,
    unlocked,
    completedModules,
    totalModules,
    completed: Boolean(progress?.completed),
    passed,
    attemptsUsed,
    attemptsAllowed,
    canAttempt,
    submitting,
    submit,
  }
}
