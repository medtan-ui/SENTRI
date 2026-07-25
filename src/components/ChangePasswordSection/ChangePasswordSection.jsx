import React, { useState } from 'react'
import Card from '../Card/Card'
import Button from '../Button/Button'
import Input from '../Input/Input'
import PasswordStrengthMeter from '../PasswordStrengthMeter/PasswordStrengthMeter'
import { useAuth } from '../../context/AuthContext'
import styles from './ChangePasswordSection.module.css'

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

/**
 * ChangePasswordSection
 * Inline-toggle "Change Password" card, shared by both Profile pages.
 * Verifies the real current password via Firebase Auth re-authentication
 * before updating (see updateOwnPassword in authService.js) — distinct
 * from the forced first-login password change (ForcedPasswordChangeGate),
 * which has no real "current password" for the user to know yet.
 */
export default function ChangePasswordSection() {
  const { updateOwnPassword } = useAuth()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleOpen() {
    setForm(EMPTY_FORM)
    setError('')
    setOpen((v) => !v)
  }

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.currentPassword) {
      setError('Please enter your current password.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await updateOwnPassword(form.currentPassword, form.newPassword)
      setNotice('Password updated.')
      setForm(EMPTY_FORM)
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const CurrentToggle = (
    <button
      type="button"
      onClick={() => setShowCurrent((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showCurrent ? 'Hide password' : 'Show password'}
    >
      {showCurrent ? '🙈' : '👁'}
    </button>
  )

  const NewToggle = (
    <button
      type="button"
      onClick={() => setShowNew((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showNew ? 'Hide password' : 'Show password'}
    >
      {showNew ? '🙈' : '👁'}
    </button>
  )

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.cardTitle}>Change Password</h2>
        <Button variant="ghost" size="sm" onClick={toggleOpen}>
          {open ? 'Cancel' : 'Change'}
        </Button>
      </div>

      {notice && !open && (
        <div className={styles.successBanner} role="status">
          <span aria-hidden="true">✓</span> {notice}
        </div>
      )}

      {!open && <p className={styles.body}>Update the password you use to sign in.</p>}

      {open && (
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              <span aria-hidden="true">⚠</span> {error}
            </div>
          )}

          <Input
            id="changePwdCurrent"
            label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={updateField('currentPassword')}
            autoComplete="current-password"
            required
            rightElement={CurrentToggle}
          />

          <Input
            id="changePwdNew"
            label="New Password"
            type={showNew ? 'text' : 'password'}
            value={form.newPassword}
            onChange={updateField('newPassword')}
            autoComplete="new-password"
            required
            rightElement={NewToggle}
          />

          <PasswordStrengthMeter password={form.newPassword} />

          <Input
            id="changePwdConfirm"
            label="Confirm New Password"
            type={showNew ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={updateField('confirmPassword')}
            autoComplete="new-password"
            required
          />

          <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={submitting}>
            Update Password
          </Button>
        </form>
      )}
    </Card>
  )
}
