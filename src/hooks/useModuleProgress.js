import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getModuleProgress,
  markLessonStarted,
  markLessonCompleted,
  markSimulationCompleted,
  deriveModuleStatus,
} from '../services/moduleProgressService'

/**
 * useModuleProgress
 * The signed-in student's progress on ONE module — what the Lesson
 * Viewer, Scenario Runner, and Quiz pages read to know where the student
 * is, and call to report forward progress. Every mutation goes through
 * moduleProgressService; this hook never touches Firestore directly and
 * holds no business logic of its own beyond optimistic local state.
 * Quiz submission is the one exception — it goes through the submitQuiz
 * Cloud Function directly (see quizService.js / StudentQuizPage), which
 * writes progress authoritatively server-side; callers just call this
 * hook's `retry()` afterward to resync.
 *
 * @param {string} moduleId
 */
export function useModuleProgress(moduleId) {
  const { user } = useAuth()
  const userId = user?.uid ?? null

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [progress, setProgress] = useState(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!userId || !moduleId) return undefined
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')

    getModuleProgress(userId, moduleId)
      .then((result) => {
        if (cancelled) return
        setProgress(result)
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Something went wrong loading your progress. Please try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [userId, moduleId, retryToken])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  const startLesson = useCallback(async () => {
    if (!userId || !moduleId) return
    setProgress((prev) => (prev && !prev.lessonStarted ? { ...prev, lessonStarted: true } : prev))
    await markLessonStarted(userId, moduleId)
  }, [userId, moduleId])

  const completeLesson = useCallback(async () => {
    if (!userId || !moduleId) return
    setProgress((prev) => (prev ? { ...prev, lessonStarted: true, lessonCompleted: true } : prev))
    await markLessonCompleted(userId, moduleId)
  }, [userId, moduleId])

  const completeSimulation = useCallback(async () => {
    if (!userId || !moduleId) return
    setProgress((prev) => (prev ? { ...prev, simulationCompleted: true } : prev))
    await markSimulationCompleted(userId, moduleId)
  }, [userId, moduleId])

  return {
    status,
    errorMessage,
    retry,
    progress,
    derivedStatus: deriveModuleStatus(progress),
    actions: { startLesson, completeLesson, completeSimulation },
  }
}
