import React from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import QuestionList from '../../../features/admin/quiz-config/components/QuestionList'
import QuizSummaryCard from '../../../features/admin/quiz-config/components/QuizSummaryCard'
import { useFinalAssessmentConfig } from '../../../hooks/useFinalAssessmentConfig'
import { TOPIC_LABELS } from '../../../data/modulePretestContent'
import forms from '../../../features/admin/quiz-config/styles/formControls.module.css'
import styles from './FinalAssessmentManagerPage.module.css'

/**
 * FinalAssessmentManagerPage — /admin/final-assessment
 *
 * The editor for SENTRI's single end-of-curriculum assessment. There is
 * no module picker here, unlike the Quiz Manager, because there is
 * exactly one final assessment for the whole curriculum rather than one
 * per module.
 *
 * The question editor itself is the module quiz's QuestionList reused
 * as-is — the two share a question shape, so a parallel editor would only
 * be a second place for the same UI to drift.
 *
 * The seeded questions come from the six modules' pre-test banks, which is
 * what makes the reported learning gain a same-instrument comparison. The
 * banner below says so, because an admin replacing every question is a
 * legitimate thing to do and a silently weakened metric is not.
 */
export default function FinalAssessmentManagerPage() {
  const { status, errorMessage, retry, draft, validations, isValid, dirty, saveState, notice, actions } =
    useFinalAssessmentConfig()

  function renderBody() {
    if (status === 'loading') return <LoadingSkeleton blocks={3} rows={4} />
    if (status === 'error') return <ErrorState message={errorMessage} onRetry={retry} />
    if (!draft) return <p className={styles.emptyText}>No final assessment configuration exists yet.</p>

    return (
      <>
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

        {/* Shared by every QuestionCard's topic field, so an admin picks
            from the existing taxonomy instead of inventing a near-duplicate
            slug that would silently split a topic on the analytics
            dashboard. Still free text, so a genuinely new topic is possible. */}
        <datalist id="sentri-topic-slugs">
          {Object.entries(TOPIC_LABELS).map(([slug, label]) => (
            <option key={slug} value={slug}>{label}</option>
          ))}
        </datalist>

        <Card className={styles.methodNote}>
          <h3 className={styles.methodHeading}>Why these questions</h3>
          <p className={styles.methodText}>
            The seeded items are drawn from the six modules' pre-test banks. That's deliberate: the reported
            learning gain compares each student's average pre-test against this assessment, and that comparison
            only holds when both use the same questions. Editing items is fine — just know that replacing them
            wholesale turns the gain figure into a before/after of two different tests.
          </p>
        </Card>

        <Card className={styles.settingsCard}>
          <h3 className={styles.heading}>Assessment Settings</h3>

          <div className={forms.fieldGroup}>
            <label className={forms.fieldLabel} htmlFor="faTitle">Title</label>
            <input
              id="faTitle"
              type="text"
              className={forms.textInput}
              value={draft.title}
              onChange={(e) => actions.updateTitle(e.target.value)}
            />
          </div>

          <div className={styles.settingsGrid}>
            <div className={forms.fieldGroup}>
              <label className={forms.fieldLabel} htmlFor="faPassingScore">Passing Score (%)</label>
              <input
                id="faPassingScore"
                type="number"
                min={0}
                max={100}
                className={forms.numberInput}
                value={draft.settings.passingScore}
                onChange={(e) => actions.updateSettings({ passingScore: Number(e.target.value) })}
              />
            </div>

            <div className={forms.fieldGroup}>
              <label className={forms.fieldLabel} htmlFor="faTimeLimit">Time Limit (minutes)</label>
              <input
                id="faTimeLimit"
                type="number"
                min={0}
                className={forms.numberInput}
                value={draft.settings.timeLimitMinutes}
                onChange={(e) => actions.updateSettings({ timeLimitMinutes: Number(e.target.value) })}
              />
            </div>

            <div className={forms.fieldGroup}>
              <label className={forms.fieldLabel} htmlFor="faAttempts">Attempts Allowed</label>
              <input
                id="faAttempts"
                type="number"
                min={1}
                max={10}
                className={forms.numberInput}
                value={draft.settings.attemptsAllowed ?? 1}
                onChange={(e) => actions.updateSettings({ attemptsAllowed: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className={forms.fieldGroup}>
            <label className={forms.fieldLabel} htmlFor="faInstructions">Instructions</label>
            <textarea
              id="faInstructions"
              className={forms.textarea}
              rows={3}
              value={draft.settings.instructions}
              onChange={(e) => actions.updateSettings({ instructions: e.target.value })}
            />
          </div>

          <div className={forms.fieldGroup}>
            <span className={forms.fieldLabel}>Availability</span>
            <div className={forms.toggleRow}>
              <button
                type="button"
                role="switch"
                aria-checked={draft.settings.available}
                className={forms.toggleSwitch}
                data-on={draft.settings.available}
                onClick={() => actions.updateSettings({ available: !draft.settings.available })}
              >
                <span className={forms.toggleKnob} />
              </button>
              <span className={forms.toggleLabel}>
                {draft.settings.available
                  ? 'Open to students who have finished all six modules'
                  : 'Closed to everyone'}
              </span>
            </div>
          </div>
        </Card>

        <QuizSummaryCard questions={draft.questions} passingScore={draft.settings.passingScore} />

        <QuestionList
          questions={draft.questions}
          validations={validations}
          onUpdateQuestion={actions.updateQuestion}
          onUpdateChoiceText={actions.updateChoiceText}
          onSetCorrectChoice={actions.setCorrectChoice}
          onMoveQuestion={actions.moveQuestion}
        />
      </>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Final Assessment</h1>
          <p className={styles.subtitle}>
            One test covering all six modules, taken once the whole curriculum is complete.
          </p>
        </div>
        {renderBody()}
      </div>
    </DashboardLayout>
  )
}
