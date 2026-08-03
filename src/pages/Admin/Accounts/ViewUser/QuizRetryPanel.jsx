import React, { useState } from 'react'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import { grantQuizRetry } from '../../../../services/adminService'
import styles from './ViewUserPage.module.css'

/**
 * QuizRetryPanel
 * The admin-facing half of the quiz appeal path.
 *
 * SENTRI's quiz is one attempt by design — submitting it completes the
 * module regardless of score, so a low score costs progress, not access.
 * That makes a blanket retry button wrong, but it also left admins with
 * no answer at all when a student had a genuine problem (a browser crash
 * mid-quiz, a misread question). This is the narrow, recorded exception:
 * one extra attempt, on one module, with a written reason.
 *
 * Only modules the student has actually submitted are listed — there is
 * nothing to retry otherwise, and the server rejects it anyway.
 */
export default function QuizRetryPanel({ userId, modules, onGranted }) {
  const [moduleId, setModuleId] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const eligible = modules.filter((m) => m.progress?.quizCompleted)
  const selected = eligible.find((m) => m.moduleId === moduleId)
  const attemptsUsed = selected?.progress?.attempts ?? 0
  const attemptsAllowed = selected?.progress?.attemptsAllowed ?? 1
  const alreadyHasSpare = Boolean(selected) && attemptsAllowed > attemptsUsed

  async function handleGrant() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await grantQuizRetry({ userId, moduleId, reason: reason.trim() })
      setNotice(
        `Retry granted. ${selected?.title || moduleId} now allows ${result.attemptsAllowed} attempt${
          result.attemptsAllowed === 1 ? '' : 's'
        }, and the student can retake it from their quiz page.`,
      )
      setReason('')
      setModuleId('')
      if (onGranted) onGranted()
    } catch (err) {
      setError(err?.message || 'Something went wrong granting the retry. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (eligible.length === 0) {
    return (
      <Card className={styles.panel}>
        <h2 className={styles.cardTitle}>Quiz Appeals</h2>
        <p className={styles.emptyState}>
          This student hasn't submitted any quizzes yet, so there's nothing to grant a retry for.
        </p>
      </Card>
    )
  }

  return (
    <Card className={styles.panel}>
      <h2 className={styles.cardTitle}>Quiz Appeals</h2>
      <p className={styles.retryIntro}>
        Quizzes are one attempt by design. Granting a retry reopens exactly one extra attempt on one module,
        and is recorded against your account with the reason you give. The student's existing lesson and
        simulation progress is untouched, and a retake can only raise their recorded score.
      </p>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span aria-hidden="true">⚠</span> {error}
        </div>
      )}
      {notice && (
        <div className={styles.successBanner} role="status">
          <span aria-hidden="true">✓</span> {notice}
        </div>
      )}

      <div className={styles.retryForm}>
        <label className={styles.retryLabel} htmlFor="retryModule">Module</label>
        <select
          id="retryModule"
          className={styles.retrySelect}
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
        >
          <option value="">Select a submitted quiz…</option>
          {eligible.map((m) => (
            <option key={m.moduleId} value={m.moduleId}>
              {m.title} (scored {m.progress?.score ?? '—'}%)
            </option>
          ))}
        </select>

        {alreadyHasSpare && (
          <p className={styles.retryWarning}>
            This student already has an unused attempt on that module, so there's no need to grant another.
          </p>
        )}

        <label className={styles.retryLabel} htmlFor="retryReason">Reason (recorded)</label>
        <textarea
          id="retryReason"
          className={styles.retryTextarea}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Browser crashed partway through; student contacted me the same day."
        />

        <Button
          variant="primary"
          onClick={handleGrant}
          loading={busy}
          disabled={busy || !moduleId || reason.trim().length < 5 || alreadyHasSpare}
        >
          Grant One Retry
        </Button>
      </div>
    </Card>
  )
}
