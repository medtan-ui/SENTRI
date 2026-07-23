import React, { useState } from 'react'
import Card from '../Card/Card'
import Button from '../Button/Button'
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../ErrorState/ErrorState'
import styles from './PretestGate.module.css'

/**
 * PretestGate
 * Presentational — blocks a module's lesson content behind a one-time,
 * ungraded baseline questionnaire. All data/state comes from
 * useModulePretest (called once by the page that renders this, e.g.
 * StudentLessonViewerPage) so there's a single source of truth instead of
 * a second, redundant fetch. There is no passing score: any
 * fully-answered submission counts, and the score is recorded only for
 * later comparison against the module's quiz score, never shown as
 * pass/fail.
 *
 * @param {{
 *   status: 'loading'|'error'|'success',
 *   errorMessage: string,
 *   retry: () => void,
 *   pretest: {title:string, questions:Array} | null,
 *   submitting: boolean,
 *   onSubmit: (answers: Record<string,string>) => Promise<{score:number, correctCount:number, total:number}>,
 *   onContinue: () => void,
 * }} props
 */
export default function PretestGate({ status, errorMessage, retry, pretest, submitting, onSubmit, onContinue }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')

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

  if (!pretest) {
    return (
      <div className={styles.wrap}>
        <Card className={styles.introCard}>
          <p>This module has no pre-test configured yet.</p>
          <Button variant="primary" onClick={onContinue}>Continue to Lesson →</Button>
        </Card>
      </div>
    )
  }

  if (result) {
    return (
      <div className={styles.wrap}>
        <Card className={styles.resultCard}>
          <span className={styles.icon} aria-hidden="true">✓</span>
          <h1 className={styles.title}>Pre-Test Complete</h1>
          <p className={styles.resultText}>
            You answered {result.correctCount} of {result.total} correctly ({result.score}%).
          </p>
          <p className={styles.resultNote}>
            This is just a baseline check — there's no passing score. Your quiz at the end of this module
            will show how much you've learned.
          </p>
          <Button variant="primary" size="lg" onClick={onContinue}>Continue to Lesson →</Button>
        </Card>
      </div>
    )
  }

  const totalQuestions = pretest.questions.length
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === totalQuestions

  async function handleSubmit() {
    setSubmitError('')
    try {
      const outcome = await onSubmit(answers)
      setResult(outcome)
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong submitting the pre-test. Please try again.')
    }
  }

  return (
    <div className={styles.wrap}>
      <Card className={styles.introCard}>
        <h1 className={styles.title}>{pretest.title}</h1>
        <p className={styles.introText}>
          Before you start this lesson, answer these {totalQuestions} quick questions to check what you already
          know. There's no passing score — you just need to complete it once, and it won't ask you again.
        </p>
      </Card>

      {pretest.questions.map((q, i) => (
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
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: c.id }))}
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
          Submit Pre-Test
        </Button>
      </div>
    </div>
  )
}
