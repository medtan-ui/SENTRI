import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/authService'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()

  // ── Form state ──
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')

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

  // ── Submit ──
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setIsLoading(true)
    try {
      const { user } = await login(email, password)
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/student/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
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

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <Card className={styles.card}>

          {/* ── Branding ── */}
          <div className={styles.branding}>
            <div className={styles.logoPlaceholder} aria-label="Logo placeholder">
              LOGO
            </div>
            <h1 className={styles.appName}>SENTRI</h1>
            <p className={styles.tagline}>Cybersecurity Awareness Training System</p>
          </div>

          {/* ── Divider ── */}
          <div className={styles.divider} />

          {/* ── Error message ── */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.errorIcon} aria-hidden="true">⚠</span>
              {error}
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
                onClick={() => alert('Forgot password is not yet available. Please contact your administrator.')}
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
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {/* ── Footer ── */}
          <p className={styles.copyright}>© 2026 SENTRI</p>
        </Card>
      </div>
    </div>
  )
}
