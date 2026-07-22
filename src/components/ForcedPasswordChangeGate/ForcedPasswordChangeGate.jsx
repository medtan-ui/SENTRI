import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../Card/Card'
import Button from '../Button/Button'
import Input from '../Input/Input'
import { validatePassword, passwordStrength } from '../../utils/passwordPolicy'
import logo from '../../assets/images/logo.png'
import styles from './ForcedPasswordChangeGate.module.css'

const POLICY_RULES = ['At least 8 characters', 'One lowercase letter', 'One uppercase letter', 'One number']

/**
 * ForcedPasswordChangeGate
 * Blocks access to every protected route until an account created (or
 * reset) with a temporary password sets its own. Rendered by
 * ProtectedRoute in place of the requested page, the same way
 * EmailVerificationGate is — no dedicated route/URL involved.
 */
export default function ForcedPasswordChangeGate() {
  const { user, changeOwnPassword, logout } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { errors: policyErrors } = validatePassword(password)
  const strength = passwordStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (policyErrors.length > 0) {
      setError(`Password requirements not met: ${policyErrors.join(', ')}.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await changeOwnPassword(password)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const ToggleBtn = (
    <button
      type="button"
      onClick={() => setShowPwd((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showPwd ? 'Hide password' : 'Show password'}
    >
      {showPwd ? '🙈' : '👁'}
    </button>
  )

  const ConfirmToggleBtn = (
    <button
      type="button"
      onClick={() => setShowConfirmPwd((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
    >
      {showConfirmPwd ? '🙈' : '👁'}
    </button>
  )

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <Card className={styles.card}>

          {/* ── Branding ── */}
          <div className={styles.branding}>
            <img src={logo} alt="SENTRI logo" className={styles.logo} />
            <p className={styles.tagline}>Cybersecurity Awareness Training System</p>
          </div>

          {/* ── Divider ── */}
          <div className={styles.divider} />

          <h1 className={styles.title}>Set a new password</h1>
          <p className={styles.body}>
            You signed in with a temporary password for <strong>{user?.email}</strong>. Choose a new
            password to continue.
          </p>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.errorIcon} aria-hidden="true">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <Input
              id="newPassword"
              label="New Password"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a new password"
              autoComplete="new-password"
              required
              rightElement={ToggleBtn}
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
              {POLICY_RULES.map((rule) => (
                <li key={rule} className={policyErrors.includes(rule) ? styles.policyPending : styles.policyMet}>
                  {policyErrors.includes(rule) ? '○' : '✓'} {rule}
                </li>
              ))}
            </ul>

            <Input
              id="confirmNewPassword"
              label="Confirm New Password"
              type={showConfirmPwd ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              required
              rightElement={ConfirmToggleBtn}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? 'Updating…' : 'Set New Password'}
            </Button>

            <button type="button" className={styles.signOutLink} onClick={logout}>
              Sign out
            </button>
          </form>

          {/* ── Footer ── */}
          <p className={styles.copyright}>© 2026 SENTRI</p>
        </Card>
      </div>
    </div>
  )
}
