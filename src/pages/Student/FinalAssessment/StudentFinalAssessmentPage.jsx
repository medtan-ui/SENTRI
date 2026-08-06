import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import Icon from '../../../components/Icon/Icon'
import LoadingSkeleton from '../../../components/LoadingSkeleton/LoadingSkeleton'
import ErrorState from '../../../components/ErrorState/ErrorState'
import { useFinalAssessment } from '../../../hooks/useFinalAssessment'
import styles from './StudentFinalAssessmentPage.module.css'

/**
 * StudentFinalAssessmentPage — /student/final-assessment
 *
 * SENTRI's one end-of-curriculum test, unlocked only once all six modules
 * are complete. It replaces the six per-module post-tests that used to sit
 * after each quiz — same items, drawn from the same six pre-test banks,
 * but administered once at the end rather than six times minutes after
 * each lesson.
 *
 * Grading is server-side (submitFinalAssessment). This page renders the
 * form, measures per-question time, and shows the result — it never
 * decides a score, and it never sees a correct answer until the server
 * returns one in the result payload.
 *
 * The locked state is deliberately informative rather than a redirect: a
 * student who lands here early should be told how many modules are left,
 * not silently bounced to the dashboard.
 */
export default function StudentFinalAssessmentPage() {
  const navigate = useNavigate()
  const {
    status,
    errorMessage,
    retry,
    assessment,
    progress,
    unlocked,
    completedModules,
    totalModules,
    passed,
    attemptsUsed,
    attemptsAllowed,
    canAttempt,
    submitting,
    submit,
  } = useFinalAssessment()

  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [showReview, setShowReview] = useState(false)

  // questionId -> epoch ms of first interaction. A ref, not state: it only
  // feeds the submit payload, and re-rendering on every timing write would
  // be pointless churn.
  const firstTouchedAt = useRef({})

  useEffect(() => {
    firstTouchedAt.current = {}
  }, [assessment])

  function selectAnswer(questionId, choiceId) {
    if (!firstTouchedAt.current[questionId]) {
      firstTouchedAt.current[questionId] = Date.now()
    }
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }))
  }

  async function handleSubmit() {
    if (!assessment || submitting) return
    setSubmitError('')
    const submittedAt = Date.now()
    const durations = {}
    Object.entries(firstTouchedAt.current).forEach(([questionId, startedAt]) => {
      durations[questionId] = submittedAt - startedAt
    })
    try {
      const outcome = await submit(answers, durations)
      setResult(outcome)
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong submitting your answers. Please try again.')
    }
  }

  function handleRetake() {
    setAnswers({})
    setResult(null)
    setShowReview(false)
    firstTouchedAt.current = {}
  }

  function renderContent() {
    if (status === 'loading') return <LoadingSkeleton blocks={2} rows={3} />
    if (status === 'error') return <ErrorState message={errorMessage} onRetry={retry} />

    if (!assessment) {
      return (
        <Card className={styles.stateCard}>
          <h1 className={styles.stateTitle}>Final Assessment Unavailable</h1>
          <p className={styles.stateText}>It hasn't been configured yet. Check back soon.</p>
          <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      )
    }

    if (assessment.settings?.available === false) {
      return (
        <Card className={styles.stateCard}>
          <span className={styles.stateIcon} data-tone="locked" aria-hidden="true">
            <Icon name="lock" size={26} strokeWidth={1.6} />
          </span>
          <h1 className={styles.stateTitle}>Final Assessment Closed</h1>
          <p className={styles.stateText}>Your instructor hasn't opened the final assessment yet.</p>
          <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      )
    }

    // ── Locked: modules still outstanding ──
    if (!unlocked && !result) {
      const remaining = Math.max(0, totalModules - completedModules)
      return (
        <Card className={styles.stateCard}>
          <span className={styles.stateIcon} data-tone="locked" aria-hidden="true">
            <Icon name="lock" size={26} strokeWidth={1.6} />
          </span>
          <h1 className={styles.stateTitle}>Not Unlocked Yet</h1>
          <p className={styles.stateText}>
            The final assessment opens once every module is complete. You've finished{' '}
            <strong>{completedModules} of {totalModules}</strong> — {remaining} to go.
          </p>
          <div className={styles.lockProgressTrack} aria-hidden="true">
            <div
              className={styles.lockProgressFill}
              style={{ width: `${totalModules > 0 ? (completedModules / totalModules) * 100 : 0}%` }}
            />
          </div>
          <Button variant="primary" onClick={() => navigate('/student/modules')}>
            Continue Training
          </Button>
        </Card>
      )
    }

    // ── Result screen (this session's submission) ──
    if (result) {
      const gainPct =
        typeof result.normalizedGain === 'number' ? Math.round(result.normalizedGain * 100) : null
      const attemptsLeft = Math.max(0, (result.attemptsAllowed ?? 1) - (result.attemptNumber ?? 1))
      return (
        <>
          <Card className={styles.resultCard}>
            <span className={styles.stateIcon} data-tone={result.passed ? 'done' : undefined} aria-hidden="true">
              <Icon name={result.passed ? 'trophy' : 'quiz'} size={28} strokeWidth={1.6} />
            </span>
            <h1 className={styles.stateTitle}>
              {result.passed ? 'Final Assessment Passed' : 'Final Assessment Complete'}
            </h1>
            <p className={styles.scoreText}>{result.score}%</p>
            <p className={styles.stateText}>
              {result.correctCount} of {result.total} correct.
              {!result.passed && ` The passing score is ${result.passingScore}%.`}
            </p>

            {result.passed && <span className={styles.statusBadge}>Curriculum Complete</span>}

            {typeof result.averagePreTestScore === 'number' && (
              <div className={styles.gainPanel}>
                <div className={styles.gainRow}>
                  <span className={styles.gainStat}>
                    <span className={styles.gainValue}>{result.averagePreTestScore}%</span>
                    <span className={styles.gainLabel}>Before</span>
                  </span>
                  <span className={styles.gainArrow} aria-hidden="true">→</span>
                  <span className={styles.gainStat}>
                    <span className={styles.gainValue}>{result.score}%</span>
                    <span className={styles.gainLabel}>After</span>
                  </span>
                </div>
                <p className={styles.gainNote}>
                  {result.score > result.averagePreTestScore
                    ? `That's ${result.score - result.averagePreTestScore} percentage points above where you started` +
                      (gainPct !== null ? `, closing ${gainPct}% of the gap to a perfect score.` : '.')
                    : result.score === result.averagePreTestScore
                      ? 'The same as where you started. Worth revisiting the modules you found hardest.'
                      : 'Below where you started. That happens, and every lesson is still there to revisit.'}
                </p>
              </div>
            )}

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setShowReview((v) => !v)}>
                {showReview ? 'Hide Answer Review' : 'Review Your Answers'}
              </Button>
              {!result.passed && attemptsLeft > 0 ? (
                <Button variant="primary" size="lg" onClick={handleRetake}>
                  Try Again ({attemptsLeft} left)
                </Button>
              ) : (
                <Button variant="primary" size="lg" onClick={() => navigate('/student/progress')}>
                  View My Progress
                </Button>
              )}
            </div>
          </Card>

          {showReview && (
            <Card className={styles.reviewCard}>
              <h2 className={styles.reviewHeading}>Answer Review</h2>
              <div className={styles.reviewList}>
                {result.perQuestionResults.map((r, i) => {
                  const question = assessment.questions.find((q) => q.id === r.questionId)
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

    // ── Revisit after already finishing it in an earlier session ──
    if (!canAttempt) {
      const gainPct =
        typeof progress?.normalizedGain === 'number' ? Math.round(progress.normalizedGain * 100) : null
      return (
        <Card className={styles.stateCard}>
          <span className={styles.stateIcon} data-tone="done" aria-hidden="true">
            <Icon name={passed ? 'trophy' : 'check'} size={26} strokeWidth={1.6} />
          </span>
          <h1 className={styles.stateTitle}>
            {passed ? 'Final Assessment Passed' : 'No Attempts Remaining'}
          </h1>
          <p className={styles.stateText}>
            {passed
              ? `You scored ${progress?.score ?? '—'}%. That's the whole curriculum finished.`
              : `You scored ${progress?.score ?? '—'}%, and all ${attemptsAllowed} attempts have been used. ` +
                'Contact your instructor if you need another.'}
          </p>
          {typeof progress?.averagePreTestScore === 'number' && (
            <div className={styles.gainPanel}>
              <div className={styles.gainRow}>
                <span className={styles.gainStat}>
                  <span className={styles.gainValue}>{progress.averagePreTestScore}%</span>
                  <span className={styles.gainLabel}>Before</span>
                </span>
                <span className={styles.gainArrow} aria-hidden="true">→</span>
                <span className={styles.gainStat}>
                  <span className={styles.gainValue}>{progress?.score ?? '—'}%</span>
                  <span className={styles.gainLabel}>After</span>
                </span>
              </div>
              {gainPct !== null && (
                <p className={styles.gainNote}>You closed {gainPct}% of the gap to a perfect score.</p>
              )}
            </div>
          )}
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => navigate('/student/progress')}>View My Progress</Button>
            <Button variant="primary" onClick={() => navigate('/student/dashboard')}>Return to Dashboard</Button>
          </div>
        </Card>
      )
    }

    // ── The form ──
    const totalQuestions = assessment.questions.length
    const answeredCount = Object.keys(answers).length
    const allAnswered = answeredCount === totalQuestions
    const attemptsLeft = Math.max(0, attemptsAllowed - attemptsUsed)

    return (
      <>
        <Card className={styles.introCard}>
          <span className={styles.introBadge}>
            <Icon name="trophy" size={14} /> Final Assessment
          </span>
          <h1 className={styles.title}>{assessment.title}</h1>
          {assessment.settings?.instructions && (
            <p className={styles.instructions}>{assessment.settings.instructions}</p>
          )}
          <div className={styles.metaRow}>
            <span>{totalQuestions} questions</span>
            <span>Passing score: {assessment.settings?.passingScore ?? 75}%</span>
            <span>
              {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left
            </span>
          </div>
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
            Submit Final Assessment
          </Button>
        </div>
      </>
    )
  }

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>{renderContent()}</div>
    </DashboardLayout>
  )
}
