import React from 'react'
import ModulePickerGrid from '../../../components/ModulePickerGrid/ModulePickerGrid'

/**
 * QuizManagerPage — /admin/quizzes
 * Pick a module, then configure its quiz in ModuleConfigurationPage's Quiz
 * tab (the real editor is QuizConfigTab, already there — this page is
 * just the entry point).
 */
export default function QuizManagerPage() {
  return (
    <ModulePickerGrid
      title="Quiz Configuration"
      subtitle="Choose a module to configure its knowledge-check quiz."
      tab="quiz"
      actionLabel="Configure Quiz →"
    />
  )
}
