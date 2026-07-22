import React from 'react'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import LoadingSkeleton from '../../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../../components/ErrorState/ErrorState'
import { useQuiz } from '../../../../hooks/useQuiz'
import QuizSettingsCard from './QuizSettingsCard'
import QuizSummaryCard from './QuizSummaryCard'
import QuestionList from './QuestionList'
import styles from './QuizConfigTab.module.css'

/**
 * QuizConfigTab
 * The Quiz tab inside Module Configuration. Administrators only
 * configure this module's one predefined quiz — its settings and its
 * fixed set of questions. No creating quizzes, no categories, no
 * question banks, no imports.
 *
 * Data comes from useQuiz() (Hooks layer, backed by quizService →
 * Firestore). This component only renders — it never talks to
 * Firestore directly.
 */
export default function QuizConfigTab({ moduleId, moduleName, overview }) {
  const { status, errorMessage, retry, draft, validations, isValid, dirty, saveState, notice, actions } =
    useQuiz(moduleId)

  if (status === 'loading') {
    return <LoadingSkeleton blocks={3} rows={4} />
  }

  if (status === 'error') {
    return <ErrorState message={errorMessage} onRetry={retry} />
  }

  if (status === 'not-found' || !draft) {
    return <p className={styles.loading}>No quiz configuration exists for this module yet.</p>
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topActions}>
        <Button variant="ghost" onClick={actions.resetToDefaults} disabled={saveState === 'saving'}>
          Reset to Defaults
        </Button>
        <div className={styles.topActionsRight}>
          <Button variant="ghost" onClick={actions.cancel} disabled={!dirty || saveState === 'saving'}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={actions.save}
            disabled={!dirty || !isValid || saveState === 'saving'}
          >
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {notice && (
        <div className={styles.notice} role="status">
          <span aria-hidden="true">✓</span> {notice}
        </div>
      )}

      {!isValid && (
        <div className={styles.blockingBanner} role="alert">
          Fix the issues marked below before saving.
        </div>
      )}

      <Card className={styles.overviewCard}>
        <h2 className={styles.moduleName}>{moduleName}</h2>
        <p className={styles.quizTitle}>{draft.title || overview?.title}</p>
      </Card>

      <QuizSettingsCard settings={draft.settings} onChange={actions.updateSettings} />

      <QuizSummaryCard questions={draft.questions} passingScore={draft.settings.passingScore} />

      <QuestionList
        questions={draft.questions}
        validations={validations}
        onUpdateQuestion={actions.updateQuestion}
        onUpdateChoiceText={actions.updateChoiceText}
        onSetCorrectChoice={actions.setCorrectChoice}
        onMoveQuestion={actions.moveQuestion}
      />
    </div>
  )
}
