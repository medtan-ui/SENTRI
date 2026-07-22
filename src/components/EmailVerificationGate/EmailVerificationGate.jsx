import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../Card/Card'
import Button from '../Button/Button'
import styles from './EmailVerificationGate.module.css'

const RESEND_COOLDOWN_S = 60

/**
 * EmailVerificationGate
 * Blocks access to the dashboards until the signed-in user's email is
 * verified. Rendered by ProtectedRoute in place of the requested page.
 */
export default function EmailVerificationGate() {
  const { user, resendVerification, refreshUser, logout } = useAuth()
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'sent' | 'error'
  const [message, setMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [checking, setChecking] = useState(false)

  React.useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleSend() {
    setStatus('sending')
    setMessage('')
    try {
      await resendVerification()
      setStatus('sent')
      setMessage(`Verification email sent to ${user?.email}.`)
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  async function handleCheckAgain() {
    setChecking(true)
    setMessage('')
    try {
      const refreshed = await refreshUser()
      if (refreshed && !refreshed.emailVerified) {
        setMessage("Still not verified — click the link in your email first, then try again.")
      }
    } catch {
      setMessage('Unable to check right now. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <Card className={styles.card}>
          <div className={styles.icon} aria-hidden="true">✉</div>
          <h1 className={styles.title}>Verify your email</h1>
          <p className={styles.body}>
            Before you can continue, confirm this is really you. Send a verification link to{' '}
            <strong>{user?.email}</strong> and click it, then come back here.
          </p>

          {message && (
            <div
              className={status === 'error' ? styles.errorBanner : styles.infoBanner}
              role={status === 'error' ? 'alert' : 'status'}
            >
              {message}
            </div>
          )}

          <div className={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSend}
              disabled={status === 'sending' || cooldown > 0}
              loading={status === 'sending'}
            >
              {cooldown > 0
                ? `Resend email (${cooldown}s)`
                : status === 'sent'
                ? 'Resend email'
                : 'Send verification email'}
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={handleCheckAgain}
              disabled={checking}
              loading={checking}
            >
              {checking ? 'Checking…' : "I've verified — check again"}
            </Button>

            <button type="button" className={styles.signOutLink} onClick={logout}>
              Sign out
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
