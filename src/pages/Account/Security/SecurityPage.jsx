import React, { useState } from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'
import Input from '../../../components/Input/Input'
import { useAuth } from '../../../context/AuthContext'
import styles from './SecurityPage.module.css'

/**
 * SecurityPage
 * Self-service two-factor authentication (TOTP) enrollment, available to
 * both roles at /account/security. Requires Multi-Factor Authentication
 * to be enabled for this Firebase project (Console → Authentication).
 */
export default function SecurityPage() {
  const { user, startTotpEnrollment, confirmTotpEnrollment, getEnrolledFactors, unenrollFactor } = useAuth()

  const [factors, setFactors] = useState(() => getEnrolledFactors())
  // 'idle' | 'starting' | 'awaiting-code' | 'confirming'
  const [stage, setStage] = useState('idle')
  const [pendingSecret, setPendingSecret] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyUid, setBusyUid] = useState('')

  function refreshFactors() {
    setFactors(getEnrolledFactors())
  }

  async function handleStartEnroll() {
    setError('')
    setNotice('')
    setStage('starting')
    try {
      const result = await startTotpEnrollment()
      setPendingSecret(result)
      setStage('awaiting-code')
    } catch (err) {
      setError(err.message)
      setStage('idle')
    }
  }

  async function handleConfirmEnroll(e) {
    e.preventDefault()
    setError('')
    if (!code.trim()) {
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setStage('confirming')
    try {
      await confirmTotpEnrollment(pendingSecret.totpSecret, code.trim())
      setNotice('Two-factor authentication is now enabled.')
      setPendingSecret(null)
      setCode('')
      setStage('idle')
      refreshFactors()
    } catch (err) {
      setError(err.message)
      setStage('awaiting-code')
    }
  }

  function handleCancelEnroll() {
    setPendingSecret(null)
    setCode('')
    setError('')
    setStage('idle')
  }

  async function handleUnenroll(factorUid) {
    setError('')
    setNotice('')
    setBusyUid(factorUid)
    try {
      await unenrollFactor(factorUid)
      setNotice('Two-factor authentication has been turned off for that method.')
      refreshFactors()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyUid('')
    }
  }

  return (
    <DashboardLayout role={user?.role}>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Account Security</h1>
          <p className={styles.subtitle}>
            Manage two-factor authentication for <strong>{user?.email}</strong>.
          </p>
        </div>

        {notice && (
          <div className={styles.successBanner} role="status">
            <span aria-hidden="true">✓</span> {notice}
          </div>
        )}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <span aria-hidden="true">⚠</span> {error}
          </div>
        )}

        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>Authenticator App (TOTP)</h2>

          {factors.length > 0 && (
            <ul className={styles.factorList}>
              {factors.map((f) => (
                <li key={f.uid} className={styles.factorItem}>
                  <div>
                    <p className={styles.factorName}>{f.displayName || 'Authenticator app'}</p>
                    <p className={styles.factorMeta}>Enrolled — TOTP</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleUnenroll(f.uid)}
                    loading={busyUid === f.uid}
                    disabled={busyUid === f.uid}
                  >
                    Turn off
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {stage === 'idle' && (
            <>
              <p className={styles.body}>
                {factors.length > 0
                  ? 'You can add another authenticator, or turn off an existing one above.'
                  : 'Two-factor authentication is currently off. Enable it to require a 6-digit code from an authenticator app (Google Authenticator, Authy, Microsoft Authenticator) at sign-in.'}
              </p>
              <Button variant="primary" onClick={handleStartEnroll}>
                {factors.length > 0 ? 'Add another authenticator' : 'Enable two-factor authentication'}
              </Button>
            </>
          )}

          {stage === 'starting' && <p className={styles.body}>Setting up…</p>}

          {(stage === 'awaiting-code' || stage === 'confirming') && pendingSecret && (
            <div className={styles.enrollBox}>
              <p className={styles.body}>
                1. Open your authenticator app and add a new account manually.
                <br />
                2. Enter this key when prompted:
              </p>
              <code className={styles.secretKey}>{pendingSecret.secretKey}</code>
              <p className={styles.body}>3. Enter the 6-digit code it generates below.</p>

              <form onSubmit={handleConfirmEnroll} className={styles.form}>
                <Input
                  id="totpCode"
                  label="6-digit code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                />
                <div className={styles.enrollActions}>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={stage === 'confirming'}
                    disabled={stage === 'confirming'}
                  >
                    Confirm
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleCancelEnroll}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
