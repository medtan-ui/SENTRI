import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ModuleProgressContext = createContext(null)

const DEFAULT_STATUS = Object.freeze({
  lessonComplete: false,
  simulationComplete: false,
  // Always locked for now — there is no quiz to unlock into yet.
  quizLocked: true,
})

/**
 * Human-readable status for a module's progress, most-advanced-first.
 * Used anywhere a short label is shown (dashboard cards, page headers).
 */
export function describeModuleStatus(status) {
  if (!status) return 'Not Started'
  if (status.simulationComplete) return 'Simulation Complete'
  if (status.lessonComplete) return 'Lesson Complete'
  return 'Not Started'
}

/**
 * ModuleProgressProvider
 * Mock, in-memory-only progress tracking per moduleId — reset on page
 * reload, no Firestore. Later this becomes a thin wrapper around reading/
 * writing a student's progress document; every consumer already calls it
 * through the same three functions, so that swap won't touch call sites.
 */
export function ModuleProgressProvider({ children }) {
  const [progressByModule, setProgressByModule] = useState({})

  const getModuleStatus = useCallback(
    (moduleId) => progressByModule[moduleId] ?? DEFAULT_STATUS,
    [progressByModule],
  )

  const markLessonComplete = useCallback((moduleId) => {
    setProgressByModule((prev) => ({
      ...prev,
      [moduleId]: { ...DEFAULT_STATUS, ...prev[moduleId], lessonComplete: true },
    }))
  }, [])

  const markSimulationComplete = useCallback((moduleId) => {
    setProgressByModule((prev) => ({
      ...prev,
      [moduleId]: {
        ...DEFAULT_STATUS,
        ...prev[moduleId],
        lessonComplete: true,
        simulationComplete: true,
      },
    }))
  }, [])

  const value = useMemo(
    () => ({ getModuleStatus, markLessonComplete, markSimulationComplete }),
    [getModuleStatus, markLessonComplete, markSimulationComplete],
  )

  return <ModuleProgressContext.Provider value={value}>{children}</ModuleProgressContext.Provider>
}

export function useModuleProgress() {
  const ctx = useContext(ModuleProgressContext)
  if (!ctx) {
    throw new Error('useModuleProgress must be used within a ModuleProgressProvider')
  }
  return ctx
}
