import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { getLockoutState, recordFailedAttempt, resetAttempts } from '../../utils/loginLockout'
import logo from '../../assets/images/logo.png'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, completeMfaLogin, resetPassword } = useAuth()

  // 'login' | 'mfa' | 'reset'
  const [mode, setMode] = useState('login')

  // ── Login form state ──
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')

  // ── Lockout state ──
  const [lockout, setLockout] = useState({ locked: false, remainingMs: 0 })

  // ── MFA challenge state ──
  const [mfaResolver, setMfaResolver] = useState(null)
  const [mfaHintUid, setMfaHintUid]   = useState(null)
  const [mfaCode, setMfaCode]         = useState('')
  const [mfaLoading, setMfaLoading]   = useState(false)
  const [mfaError, setMfaError]       = useState('')

  // ── Reset-password form state ──
  const [resetEmail, setResetEmail]     = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError]     = useState('')
  const [resetSent, setResetSent]       = useState(false)

  // Tick the lockout countdown so the button re-enables on its own.
  useEffect(() => {
    if (!lockout.locked) return undefined
    const timer = setInterval(() => {
      const next = getLockoutState(email)
      setLockout(next)
    }, 1000)
    return () => clearInterval(timer)
  }, [lockout.locked, email])

  // ── Validation ──
  function validate() {
    if (!email.trim()) {
      setError('Please enter your email address.')
      return false
    }
    if (!password) {
      setError('Please enter your password.')
      return false
    }
    return true
  }

  function navigateForRole(role) {
    navigate(role === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true })
  }

  // ── Submit: login ──
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const currentLockout = getLockoutState(email)
    if (currentLockout.locked) {
      setLockout(currentLockout)
      return
    }
    if (!validate()) return

    setIsLoading(true)
    try {
      const user = await login(email, password, rememberMe)
      resetAttempts(email)
      navigateForRole(user.role)
    } catch (err) {
      if (err.mfaRequired) {
        setMfaResolver(err.resolver)
        setMfaHintUid(err.hintUid)
        setMfaError('')
        setMfaCode('')
        setMode('mfa')
        return
      }
      const nextLockout = recordFailedAttempt(email)
      setLockout(nextLockout)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Submit: MFA code ──
  async function handleMfaSubmit(e) {
    e.preventDefault()
    setMfaError('')

    if (!mfaCode.trim()) {
      setMfaError('Enter the 6-digit code from your authenticator app.')
      return
    }

    setMfaLoading(true)
    try {
      const user = await completeMfaLogin(mfaResolver, mfaHintUid, mfaCode.trim())
      resetAttempts(email)
      navigateForRole(user.role)
    } catch (err) {
      setMfaError(err.message)
    } finally {
      setMfaLoading(false)
    }
  }

  function cancelMfa() {
    setMfaResolver(null)
    setMfaHintUid(null)
    setMfaCode('')
    setMfaError('')
    setMode('login')
  }

  // ── Submit: forgot password ──
  async function handleResetSubmit(e) {
    e.preventDefault()
    setResetError('')

    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.')
      return
    }

    setResetLoading(true)
    try {
      await resetPassword(resetEmail)
      setResetSent(true)
    } catch (err) {
      setResetError(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  function openResetMode() {
    setResetEmail(email)
    setResetError('')
    setResetSent(false)
    setMode('reset')
  }

  function backToLogin() {
    setError('')
    setMode('login')
  }

  // ── Show/Hide password toggle ──
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

  const lockoutSeconds = Math.ceil(lockout.remainingMs / 1000)

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

          {mode === 'login' && (
            <>
              {/* ── Error message ── */}
              {error && (
                <div className={styles.errorBanner} role="alert">
                  <span className={styles.errorIcon} aria-hidden="true">⚠</span>
                  {error}
                </div>
              )}

              {/* ── Lockout message ── */}
              {lockout.locked && (
                <div className={styles.errorBanner} role="alert">
                  <span className={styles.errorIcon} aria-hidden="true">⏱</span>
                  Too many attempts. Try again in {lockoutSeconds}s.
                </div>
              )}

              {/* ── Login form ── */}
              <form onSubmit={handleSubmit} noValidate className={styles.form}>
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                <Input
                  id="password"
                  label="Password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  rightElement={ToggleBtn}
                />

                {/* Remember me + Forgot password */}
                <div className={styles.row}>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={styles.checkbox}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={openResetMode}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || lockout.locked}
                >
                  {lockout.locked
                    ? `Try again in ${lockoutSeconds}s`
                    : isLoading
                    ? 'Signing in…'
                    : 'Sign In'}
                </Button>
              </form>
            </>
          )}

          {mode === 'mfa' && (
            <>
              <p className={styles.resetIntro}>
                Enter the 6-digit code from your authenticator app to finish signing in.
              </p>

              {mfaError && (
                <div className={styles.errorBanner} role="alert">
                  <span className={styles.errorIcon} aria-hidden="true">⚠</span>
                  {mfaError}
                </div>
              )}

              <form onSubmit={handleMfaSubmit} noValidate className={styles.form}>
                <Input
                  id="mfaCode"
                  label="Verification code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={mfaLoading}
                  disabled={mfaLoading}
                >
                  {mfaLoading ? 'Verifying…' : 'Verify'}
                </Button>

                <button type="button" className={styles.forgotLink} onClick={cancelMfa}>
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}

          {mode === 'reset' && (
            <>
              <p className={styles.resetIntro}>
                Enter the email address linked to your account and we'll send you a link to reset your password.
              </p>

              {/* ── Error message ── */}
              {resetError && (
                <div className={styles.errorBanner} role="alert">
                  <span className={styles.errorIcon} aria-hidden="true">⚠</span>
                  {resetError}
                </div>
              )}

              {/* ── Success message ── */}
              {resetSent && (
                <div className={styles.successBanner} role="status">
                  <span className={styles.successIcon} aria-hidden="true">✓</span>
                  If an account exists for that email, a reset link has been sent. Check your inbox.
                </div>
              )}

              {/* ── Reset form ── */}
              <form onSubmit={handleResetSubmit} noValidate className={styles.form}>
                <Input
                  id="resetEmail"
                  label="Email Address"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={resetLoading}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Sending…' : 'Send Reset Link'}
                </Button>

                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={backToLogin}
                >
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}

          {/* ── Footer ── */}
          <p className={styles.copyright}>© 2026 SENTRI</p>
        </Card>
      </div>
    </div>
  )
}
