import React, { useEffect, useRef, useState } from 'react'
import Icon from '../../../../components/Icon/Icon'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import ModuleAccessGuard from '../../../../components/ModuleAccessGuard/ModuleAccessGuard'
import { useModuleProgress } from '../../../../hooks/useModuleProgress'
import { getQuiz, submitQuiz } from '../../../../services/quizService'
import { recordEvent, startTimedEvent } from '../../../../services/analyticsEventService'
import styles from './StudentQuizPage.module.css'

/**
 * StudentQuizPage — /student/modules/:moduleId/quiz
 * Reads the same moduleQuizzes document the admin editor authors (to
 * render questions/choices), but grading and recording the attempt
 * happens authoritatively server-side via the submitQuiz Cloud Function
 * — this page never computes a score itself. Submitting always completes
 * the module and unlocks the next one, pass or fail. After a successful
 * submit, useModuleProgress is refetched so attempts/moduleCompleted
 * reflect the server's write.
 *
 * One attempt by default. A student who appealed and was granted a retry
 * has `attemptsAllowed > attempts` on their progress doc, and this page
 * simply lets them back into the form — the server is what enforces the
 * allowance, this is only the matching UI.
 *
 * Per-question time is measured here (first interaction → submit) and
 * sent alongside the answers. It is what the time-to-answer and item
 * analysis metrics are built from; a question never touched sends no
 * duration at all rather than a zero.
 */
export default function StudentQuizPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { progress, status: progressStatus, retry: retryProgress } = useModuleProgress(moduleId)

  // undefined = loading, null = not found
  const [quiz, setQuiz] = useState(undefined)
  const [quizError, setQuizError] = useState('')
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showReview, setShowReview] = useState(false)

  // questionId -> epoch ms of first interaction. A ref, not state: it
  // only feeds the submit payload, and re-rendering on every keystroke of
  // timing data would be pointless churn.
  const firstTouchedAt = useRef({})

  // Whole-attempt stopwatch, separate from the per-question timings above:
  // this one answers "how long did the quiz take", they answer "which
  // question did they labour over".
  const quizTimerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setQuiz(undefined)
    setQuizError('')
    setAnswers({})
    setResult(null)
    firstTouchedAt.current = {}
    quizTimerRef.current = null
    getQuiz(moduleId)
      .then((data) => {
        if (!cancelled) setQuiz(data)
      })
      .catch((err) => {
        if (cancelled) return
        setQuizError(err?.message || 'Something went wrong loading this quiz. Please try again.')
        setQuiz(null)
      })
    return () => {
      cancelled = true
    }
  }, [moduleId])

  // Start the attempt clock once the question form is genuinely on screen
  // — not while loading, and not on a revisit that only shows a summary.
  useEffect(() => {
    if (!quiz || quizTimerRef.current) return
    if (progressStatus !== 'success') return
    if (progress?.quizCompleted) return
    if (quiz.settings?.available === false) return
    recordEvent('quiz_started', { moduleId })
    quizTimerRef.current = startTimedEvent('quiz_submitted', moduleId)
  }, [quiz, progressStatus, progress?.quizCompleted, moduleId])

  function selectAnswer(questionId, choiceId) {
    if (!firstTouchedAt.current[questionId]) {
      firstTouchedAt.current[questionId] = Date.now()
    }
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }))
  }

  async function handleSubmit() {
    if (!quiz || submitting) return
    setSubmitting(true)
    setSubmitError('')
    const submittedAt = Date.now()
    const durations = {}
    Object.entries(firstTouchedAt.current).forEach(([questionId, startedAt]) => {
      durations[questionId] = submittedAt - startedAt
    })
    try {
      const data = await submitQuiz(moduleId, answers, durations)
      setResult(data)
      if (quizTimerRef.current) {
        quizTimerRef.current({ score: data.score, attemptNumber: data.attemptNumber })
        quizTimerRef.current = null
      }
      retryProgress() // resync attempts/moduleCompleted from the server's write
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong submitting your quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function renderContent() {
    if (quiz === undefined || progressStatus === 'loading') {
      return (
        <Card className={styles.stateCard}>
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.stateLabel}>Loading quiz…</p>
        </Card>
      )
    }

    if (quiz === null) {
      return (
        <Card className={styles.stateCard}>
          <h1 className={styles.stateTitle}>Quiz Unavailable</h1>
          <p className={styles.stateText}>
            {quizError || "This module's quiz hasn't been configured yet."}
          </p>
          {quizError ? (
            <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
          ) : (
            <Button variant="primary" onClick={() => navigate('/student/dashboard')}>← Return to Dashboard</Button>
          )}
        </Card>
      )
    }

    if (quiz.settings?.available === false) {
      return (
        <Card className={styles.stateCard}>
          <span className={styles.stateIcon} data-tone="locked" aria-hidden="true"><Icon name="lock" size={26} strokeWidth={1.6} /></span>
          <h1 className={styles.stateTitle}>Quiz Not Yet Available</h1>
          <p className={styles.stateText}>Your instructor hasn't opened this quiz yet. Check back soon.</p>
          <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>← Return to Dashboard</Button>
        </Card>
      )
    }

    // A student returning to this page after already completing it gets a
    // read-only summary instead of the question form. `!result`
    // distinguishes that revisit from having just submitted this same quiz
    // a moment ago in this session. An admin-granted retry clears
    // quizCompleted, which is exactly what lets them back into the form.
    const alreadyCompleted = Boolean(progress?.quizCompleted) && !result
    const postTestDone = Boolean(progress?.postTestCompleted)

    if (alreadyCompleted) {
      return (
        <Card className={styles.stateCard}>
          <span className={styles.stateIcon} data-tone="done" aria-hidden="true"><Icon name="check" size={26} strokeWidth={1.6} /></span>
          <h1 className={styles.stateTitle}>Quiz Already Completed</h1>
          <p className={styles.stateText}>
            You've already taken this quiz — only one attempt is allowed. Your score was {progress?.score ?? '—'}%.
          </p>
          <div className={styles.actions}>
            {!postTestDone && (
              <Button
                variant="primary"
                onClick={() => navigate(`/student/modules/${moduleId}/post-test`)}
              >
                Take the Post-Test →
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>Return to Dashboard</Button>
          </div>
        </Card>
      )
    }

    if (result) {
      return (
        <>
          <Card className={styles.resultCard}>
            <span className={styles.stateIcon} data-tone={result.passed ? 'done' : undefined} aria-hidden="true">
              <Icon name={result.passed ? 'trophy' : 'quiz'} size={26} strokeWidth={1.6} />
            </span>
            <h1 className={styles.stateTitle}>{result.passed ? 'Quiz Passed!' : 'Quiz Complete'}</h1>
            <p className={styles.scoreText}>{result.score}%</p>
            <p className={styles.stateText}>
              {result.correctCount} of {result.total} correct.
              {!result.passed
                ? ` The passing score was ${result.passingScore}%, but this module is complete either way since only one attempt is given.`
                : ''}
            </p>
            <span className={styles.statusBadge}>Module Completed</span>

            <p className={styles.postTestPrompt}>
              One last step: answer the same questions you saw before the lesson, so you can see how much
              you've learned.
            </p>

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setShowReview((v) => !v)}>
                {showReview ? 'Hide Answer Review' : 'Review Your Answers'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/student/modules/${moduleId}/post-test`)}
              >
                Take the Post-Test →
              </Button>
            </div>

            <button
              type="button"
              className={styles.skipLink}
              onClick={() => navigate('/student/dashboard')}
            >
              Skip for now, return to Dashboard
            </button>
          </Card>

          {showReview && (
            <Card className={styles.reviewCard}>
              <h2 className={styles.reviewHeading}>Answer Review</h2>
              <div className={styles.reviewList}>
                {result.perQuestionResults.map((r, i) => {
                  const question = quiz.questions.find((q) => q.id === r.questionId)
                  const correctChoice = question?.choices.find((c) => c.id === r.correctChoiceId)
                  return (
                    <div key={r.questionId} className={styles.reviewItem}>
                      <div className={styles.reviewItemHeader}>
                        <span className={styles.reviewQuestionNumber}>Question {i + 1}</span>
                        <span className={r.correct ? styles.reviewCorrect : styles.reviewIncorrect}>
                          {r.correct ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <p className={styles.reviewQuestionText}>{question?.text}</p>
                      {!r.correct && correctChoice && (
                        <p className={styles.reviewAnswer}>Correct answer: {correctChoice.text}</p>
                      )}
                      <p className={styles.reviewExplanation}>{r.explanation}</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )
    }

    const totalQuestions = quiz.questions.length
    const answeredCount = Object.keys(answers).length
    const allAnswered = answeredCount === totalQuestions

    return (
      <>
        <Card className={styles.introCard}>
          <h1 className={styles.title}>{quiz.title}</h1>
          {quiz.settings?.instructions && <p className={styles.instructions}>{quiz.settings.instructions}</p>}
          <div className={styles.metaRow}>
            <span>{totalQuestions} questions</span>
            <span>Passing score: {quiz.settings?.passingScore ?? 70}%</span>
            <span>One attempt only</span>
          </div>
        </Card>

        {quiz.questions.map((q, i) => (
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
            Submit Quiz
          </Button>
        </div>
      </>
    )
  }

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <ModuleAccessGuard moduleId={moduleId} require="quiz">
          {renderContent()}
        </ModuleAccessGuard>
      </div>
    </DashboardLayout>
  )
}
