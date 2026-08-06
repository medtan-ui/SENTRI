import React, { useCallback, useRef, useState } from 'react'
import Card from '../Card/Card'
import Button from '../Button/Button'
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../ErrorState/ErrorState'
import styles from './AssessmentGate.module.css'

/**
 * Copy for the one assessment this component still serves. It used to
 * serve two — a pre-test and a matching per-module post-test — and the
 * variant shape is kept because the "after" measurement still exists, it
 * just moved to the end of the curriculum and got its own page (see
 * StudentFinalAssessmentPage, which is graded and so can't share this
 * form's "no passing score" wording).
 */
const VARIANTS = {
  pretest: {
    emptyText: 'This module has no pre-test configured yet.',
    continueLabel: 'Continue to Lesson →',
    introText: (count) =>
      `Before you start this lesson, answer these ${count} quick questions to check what you already know. ` +
      "There's no passing score, and you only need to do this once.",
    submitLabel: 'Submit Pre-Test',
    resultTitle: 'Pre-Test Complete',
    resultNote:
      "This is just a baseline check, so there's no passing score. You'll see these ideas again in the final " +
      "assessment after all six modules, and that's where you'll see how far you've come.",
  },
}

/**
 * AssessmentGate
 * Presentational form for the one-time, ungraded pre-test that blocks a
 * module's lesson. All data and state come from useModuleAssessment
 * (called once by the page rendering this), so there's a single source of
 * truth instead of a second, redundant fetch.
 *
 * No passing score: any fully-answered submission counts. The score is
 * recorded for the later pre/post comparison, never shown as pass/fail.
 *
 * This component also measures per-question time. The clock starts when a
 * question is first touched and stops at submit, which is what the
 * time-to-answer and "fast-wrong vs slow-wrong" diagnostics are built
 * from. A question a student never touched reports no duration at all
 * rather than a zero, so untouched items don't drag the average down.
 *
 * @param {{
 *   variant?: 'pretest',
 *   status: 'loading'|'error'|'success',
 *   errorMessage: string,
 *   retry: () => void,
 *   assessment: {title:string, questions:Array} | null,
 *   submitting: boolean,
 *   onSubmit: (answers: Record<string,string>, durations: Record<string,number>) => Promise<object>,
 *   onContinue: () => void,
 * }} props
 */
export default function AssessmentGate({
  variant = 'pretest',
  status,
  errorMessage,
  retry,
  assessment,
  submitting,
  onSubmit,
  onContinue,
}) {
  const copy = VARIANTS[variant] || VARIANTS.pretest
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')

  // questionId -> epoch ms of first interaction. Refs, not state: these
  // only feed the submit payload and must never trigger a re-render
  // (which would reset the very timing being measured).
  const firstTouchedAt = useRef({})

  const selectAnswer = useCallback((questionId, choiceId) => {
    if (!firstTouchedAt.current[questionId]) {
      firstTouchedAt.current[questionId] = Date.now()
    }
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }))
  }, [])

  if (status === 'loading') {
    return (
      <div className={styles.wrap}>
        <LoadingSkeleton blocks={2} rows={3} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.wrap}>
        <ErrorState message={errorMessage} onRetry={retry} />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className={styles.wrap}>
        <Card className={styles.introCard}>
          <p>{copy.emptyText}</p>
          <Button variant="primary" onClick={onContinue}>{copy.continueLabel}</Button>
        </Card>
      </div>
    )
  }

  if (result) {
    return (
      <div className={styles.wrap}>
        <Card className={styles.resultCard}>
          <span className={styles.icon} aria-hidden="true">✓</span>
          <h1 className={styles.title}>{copy.resultTitle}</h1>
          <p className={styles.resultText}>
            You answered {result.correctCount} of {result.total} correctly ({result.score}%).
          </p>
          <p className={styles.resultNote}>{copy.resultNote}</p>
          <Button variant="primary" size="lg" onClick={onContinue}>{copy.continueLabel}</Button>
        </Card>
      </div>
    )
  }

  const totalQuestions = assessment.questions.length
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === totalQuestions

  async function handleSubmit() {
    setSubmitError('')
    const submittedAt = Date.now()
    const durations = {}
    Object.entries(firstTouchedAt.current).forEach(([questionId, startedAt]) => {
      durations[questionId] = submittedAt - startedAt
    })
    try {
      const outcome = await onSubmit(answers, durations)
      setResult(outcome)
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong submitting your answers. Please try again.')
    }
  }

  return (
    <div className={styles.wrap}>
      <Card className={styles.introCard}>
        <h1 className={styles.title}>{assessment.title}</h1>
        <p className={styles.introText}>{copy.introText(totalQuestions)}</p>
      </Card>

      {assessment.questions.map((q, i) => (
        <Card key={q.id} className={styles.questionCard}>
          <p className={styles.questionNumber}>Question {i + 1} of {totalQuestions}</p>
          <h2 className={styles.questionText}>{q.text}</h2>
          <div className={styles.choiceList}>
            {q.choices.map((c) => (
              <label key={c.id} className={styles.choiceRow} data-selected={answers[q.id] === c.id}>
                <input
                  type="radio"
                  name={q.id}
                  value={c.id}
                  checked={answers[q.id] === c.id}
                  onChange={() => selectAnswer(q.id, c.id)}
                />
                <span>{c.text}</span>
              </label>
            ))}
          </div>
        </Card>
      ))}

      {submitError && (
        <div className={styles.errorBanner} role="alert">
          <span aria-hidden="true">⚠</span> {submitError}
        </div>
      )}

      <div className={styles.submitRow}>
        <span className={styles.progressText}>{answeredCount} of {totalQuestions} answered</span>
        <Button
          variant="primary"
          size="lg"
          disabled={!allAnswered || submitting}
          loading={submitting}
          onClick={handleSubmit}
        >
          {copy.submitLabel}
        </Button>
      </div>
    </div>
  )
}
