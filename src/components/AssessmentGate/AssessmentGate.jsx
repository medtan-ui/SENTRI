import React, { useCallback, useRef, useState } from 'react'
import Card from '../Card/Card'
import Button from '../Button/Button'
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../ErrorState/ErrorState'
import styles from './AssessmentGate.module.css'

/**
 * Copy that differs between the two bookend assessments. Everything else
 * about them — the item bank, the layout, the "no passing score" rule —
 * is identical by design, so it lives in one component.
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
      "This is just a baseline check, so there's no passing score. You'll answer these same questions again " +
      "at the end of the module, and that's when you'll see how much you've learned.",
  },
  posttest: {
    emptyText: 'This module has no post-test configured yet.',
    continueLabel: 'Return to Dashboard →',
    introText: (count) =>
      `These are the same ${count} questions you answered before the lesson. Answering them again is what ` +
      'measures how much this module actually taught you. Still no passing score, and still only once.',
    submitLabel: 'Submit Post-Test',
    resultTitle: 'Post-Test Complete',
    resultNote: 'Thanks. This is the measurement that tells us whether the module worked.',
  },
}

/**
 * AssessmentGate
 * Presentational form for either bookend assessment — the one-time,
 * ungraded pre-test that blocks a module's lesson, or the one-time
 * post-test after its quiz. All data and state come from
 * useModuleAssessment (called once by the page rendering this), so
 * there's a single source of truth instead of a second, redundant fetch.
 *
 * Neither assessment has a passing score: any fully-answered submission
 * counts. The score is recorded for the pre/post comparison, never shown
 * as pass/fail.
 *
 * This component also measures per-question time. The clock starts when a
 * question is first touched and stops at submit, which is what the
 * time-to-answer and "fast-wrong vs slow-wrong" diagnostics are built
 * from. A question a student never touched reports no duration at all
 * rather than a zero, so untouched items don't drag the average down.
 *
 * @param {{
 *   variant?: 'pretest'|'posttest',
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
    const showGain = variant === 'posttest' && typeof result.preTestScore === 'number'
    return (
      <div className={styles.wrap}>
        <Card className={styles.resultCard}>
          <span className={styles.icon} aria-hidden="true">✓</span>
          <h1 className={styles.title}>{copy.resultTitle}</h1>
          <p className={styles.resultText}>
            You answered {result.correctCount} of {result.total} correctly ({result.score}%).
          </p>

          {showGain && (
            <div className={styles.gainPanel}>
              <div className={styles.gainRow}>
                <span className={styles.gainStat}>
                  <span className={styles.gainValue}>{result.preTestScore}%</span>
                  <span className={styles.gainLabel}>Before</span>
                </span>
                <span className={styles.gainArrow} aria-hidden="true">→</span>
                <span className={styles.gainStat}>
                  <span className={styles.gainValue}>{result.score}%</span>
                  <span className={styles.gainLabel}>After</span>
                </span>
              </div>
              <p className={styles.gainNote}>
                {result.score > result.preTestScore
                  ? `That's ${result.score - result.preTestScore} percentage points better than where you started.`
                  : result.score === result.preTestScore
                    ? 'Same score as before. Worth another look at the lesson sections you found tricky.'
                    : 'Lower than your pre-test. That happens, and the lesson is always there to revisit.'}
              </p>
            </div>
          )}

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
