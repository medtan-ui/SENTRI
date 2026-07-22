import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { validatePassword, passwordStrength } from '../../utils/passwordPolicy'
import styles from './ResetPasswordPage.module.css'

/**
 * ResetPasswordPage
 * Destination for the link sent by authService.sendResetEmail(). Handles
 * the oobCode ourselves (instead of Firebase's default hosted page) so we
 * can apply our own password policy/UI.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const oobCode = searchParams.get('oobCode')
  const { verifyResetCode, confirmReset } = useAuth()

  // 'verifying' | 'ready' | 'invalid' | 'done'
  const [stage, setStage] = useState('verifying')
  const [email, setEmail] = useState('')
  const [verifyError, setVerifyError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!oobCode) {
      setVerifyError('This reset link is missing required information. Please request a new one.')
      setStage('invalid')
      return
    }
    verifyResetCode(oobCode)
      .then((resolvedEmail) => {
        setEmail(resolvedEmail)
        setStage('ready')
      })
      .catch((err) => {
        setVerifyError(err.message)
        setStage('invalid')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oobCode])

  const { errors: policyErrors } = validatePassword(password)
  const strength = passwordStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (policyErrors.length > 0) {
      setFormError(`Password requirements not met: ${policyErrors.join(', ')}.`)
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await confirmReset(oobCode, password)
      setStage('done')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <Card className={styles.card}>
          <h1 className={styles.title}>Reset your password</h1>

          {stage === 'verifying' && (
            <p className={styles.body}>Checking your reset link…</p>
          )}

          {stage === 'invalid' && (
            <>
              <div className={styles.errorBanner} role="alert">
                <span aria-hidden="true">⚠</span> {verifyError}
              </div>
              <Link to="/" className={styles.backLink}>← Back to Sign In</Link>
            </>
          )}

          {stage === 'ready' && (
            <>
              <p className={styles.body}>
                Choose a new password for <strong>{email}</strong>.
              </p>

              {formError && (
                <div className={styles.errorBanner} role="alert">
                  <span aria-hidden="true">⚠</span> {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className={styles.form}>
                <Input
                  id="newPassword"
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  required
                />

                {password && (
                  <div className={styles.strengthRow}>
                    <div className={styles.strengthTrack}>
                      <div
                        className={styles.strengthFill}
                        data-score={strength.score}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className={styles.strengthLabel}>{strength.label}</span>
                  </div>
                )}

                <ul className={styles.policyList}>
                  {['At least 8 characters', 'One lowercase letter', 'One uppercase letter', 'One number'].map(
                    (rule) => (
                      <li
                        key={rule}
                        className={policyErrors.includes(rule) ? styles.policyPending : styles.policyMet}
                      >
                        {policyErrors.includes(rule) ? '○' : '✓'} {rule}
                      </li>
                    )
                  )}
                </ul>

                <Input
                  id="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </Button>
              </form>
            </>
          )}

          {stage === 'done' && (
            <>
              <div className={styles.successBanner} role="status">
                <span aria-hidden="true">✓</span> Your password has been reset.
              </div>
              <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/', { replace: true })}>
                Continue to Sign In
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
