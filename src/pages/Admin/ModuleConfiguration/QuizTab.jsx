import React from 'react'
import QuizConfigTab from '../../../features/admin/quiz-config/components/QuizConfigTab'

/**
 * QuizTab
 * Thin wrapper delegating to the Quiz Configuration feature — kept as
 * its own file so ModuleConfigurationPage's tab wiring doesn't need to
 * change beyond this file's contents.
 */
export default function QuizTab({ moduleId, moduleName, quiz }) {
  return <QuizConfigTab moduleId={moduleId} moduleName={moduleName} overview={quiz} />
}
