import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getModuleProgress } from '../services/moduleProgressService'

const LOCKED_ACCESS = Object.freeze({
  isUnlocked: false,
  lessonAccessible: false,
  simulationAccessible: false,
  quizAccessible: false,
})

/**
 * useModuleUnlocks
 * A narrow, route-guard-focused access check for ONE module: is this
 * student allowed on its lesson, its simulation, or its quiz right now.
 * Used by ModuleAccessGuard. Deliberately separate from useModuleProgress
 * (which content pages use to read *and mutate* the full progress
 * object) and useStudentModules (the full curriculum list for the
 * Dashboard) — all three call the same service underneath, just shaped
 * for a different consumer.
 *
 * Fails closed: any error resolving access is treated as fully locked
 * rather than guessing a student in.
 *
 * @param {string} moduleId
 */
export function useModuleUnlocks(moduleId) {
  const { user } = useAuth()
  const userId = user?.uid ?? null

  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState(LOCKED_ACCESS)

  useEffect(() => {
    if (!userId || !moduleId) return undefined
    let cancelled = false
    setLoading(true)

    getModuleProgress(userId, moduleId)
      .then((progress) => {
        if (cancelled) return
        const unlocked = Boolean(progress?.isUnlocked)
        setAccess({
          isUnlocked: unlocked,
          lessonAccessible: unlocked,
          simulationAccessible: unlocked && Boolean(progress?.lessonCompleted),
          quizAccessible: unlocked && Boolean(progress?.simulationCompleted),
        })
      })
      .catch((err) => {
        console.error('[useModuleUnlocks] failed to resolve access — defaulting to locked:', err)
        if (!cancelled) setAccess(LOCKED_ACCESS)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, moduleId])

  return { loading, ...access }
}
