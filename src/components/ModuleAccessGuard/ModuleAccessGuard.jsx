import React from 'react'
import { Navigate } from 'react-router-dom'
import { useModuleUnlocks } from '../../hooks/useModuleUnlocks'
import LoadingScreen from '../LoadingScreen/LoadingScreen'

/**
 * ModuleAccessGuard
 * Wraps a module page's content and redirects to the student dashboard
 * if this student can't be here yet — a locked module, a simulation
 * before its lesson is complete, or a quiz before its simulation is
 * complete. `require` names which gate applies.
 *
 * @param {{ moduleId: string, require: 'lesson'|'simulation'|'quiz', children: React.ReactNode }} props
 */
export default function ModuleAccessGuard({ moduleId, require, children }) {
  const { loading, lessonAccessible, simulationAccessible, quizAccessible } = useModuleUnlocks(moduleId)

  if (loading) {
    return <LoadingScreen label="Checking access…" />
  }

  const allowed =
    require === 'lesson' ? lessonAccessible : require === 'simulation' ? simulationAccessible : quizAccessible

  if (!allowed) {
    return <Navigate to="/student/dashboard" replace />
  }

  return children
}
