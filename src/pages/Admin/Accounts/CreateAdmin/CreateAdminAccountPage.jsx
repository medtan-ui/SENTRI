import React, { useState } from 'react'
import Icon from '../../../../components/Icon/Icon'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import Input from '../../../../components/Input/Input'
import PasswordStrengthMeter from '../../../../components/PasswordStrengthMeter/PasswordStrengthMeter'
import { createUserAccount } from '../../../../services/adminService'
import { validatePassword } from '../../../../utils/passwordPolicy'
import logo from '../../../../assets/images/logo.png'
import styles from './CreateAdminAccountPage.module.css'

const SCHOOL_EMAIL_REGEX = /^[^\s@]+@tip\.edu\.ph$/i

const EMPTY_FORM = { displayName: '', nickname: '', email: '', password: '', confirmPassword: '' }

/**
 * CreateAdminAccountPage — /admin/accounts/create-admin
 * Admin-only, admin-only account creation — the counterpart to the public
 * student self-registration at /register. Always creates role: 'admin'
 * (never a field the caller picks) via the existing admin-gated
 * createUserAccount Cloud Function, same one used before self-registration
 * existed. The new admin gets a temporary password (mustChangePassword:
 * true) and sets their own real one on first login, same as any
 * admin-created account always has.
 */
export default function CreateAdminAccountPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    if (!form.displayName.trim()) return "Please enter the new admin's full name."
    if (!form.nickname.trim()) return 'Please enter a nickname.'
    if (!SCHOOL_EMAIL_REGEX.test(form.email.trim())) return 'Please enter a valid @tip.edu.ph email address.'
    const { valid, errors } = validatePassword(form.password)
    if (!valid) return `Password requirements not met: ${errors.join(', ')}.`
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setNotice('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await createUserAccount({
        displayName: form.displayName.trim(),
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'admin',
      })
      setNotice(`Admin account created for ${form.email.trim()}. They'll set their own password on first login.`)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const PwdToggle = (
    <button
      type="button"
      onClick={() => setShowPwd((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showPwd ? 'Hide password' : 'Show password'}
    >
      {showPwd ? <Icon name="eyeOff" size={17} /> : <Icon name="eye" size={17} />}
    </button>
  )

  const ConfirmPwdToggle = (
    <button
      type="button"
      onClick={() => setShowConfirmPwd((v) => !v)}
      className={styles.toggleBtn}
      aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
    >
      {showConfirmPwd ? <Icon name="eyeOff" size={17} /> : <Icon name="eye" size={17} />}
    </button>
  )

  return (
    <DashboardLayout role="admin">
      <div className={styles.page}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/admin/accounts')}>
          ← Back to Accounts
        </button>

        <div className={styles.center}>
          <Card className={styles.card}>
            <div className={styles.branding}>
              <img src={logo} alt="SENTRI logo" className={styles.logo} />
              <h1 className={styles.title}>Create Admin Account</h1>
              <p className={styles.tagline}>
                Creates a new administrator account with a temporary password. Student accounts are created by
                students themselves at the public registration page, not here.
              </p>
            </div>

            <div className={styles.divider} />

            {error && (
              <div className={styles.errorBanner} role="alert">
                <span className={styles.errorIcon} aria-hidden="true">⚠</span>
                {error}
              </div>
            )}

            {notice && (
              <div className={styles.successBanner} role="status">
                <span className={styles.successIcon} aria-hidden="true">✓</span>
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <Input
                id="newAdminFullName"
                label="Full Name"
                value={form.displayName}
                onChange={updateField('displayName')}
                placeholder="Maria Santos"
                autoComplete="off"
                required
              />

              <Input
                id="newAdminNickname"
                label="What would you like the system to call them?"
                value={form.nickname}
                onChange={updateField('nickname')}
                placeholder="Maria"
                autoComplete="off"
                required
              />

              <Input
                id="newAdminEmail"
                label="School Email Address"
                type="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="maria.santos@tip.edu.ph"
                autoComplete="off"
                required
              />

              <Input
                id="newAdminPassword"
                label="Temporary Password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={updateField('password')}
                placeholder="Create a temporary password"
                autoComplete="new-password"
                required
                rightElement={PwdToggle}
              />

              <PasswordStrengthMeter password={form.password} />

              <Input
                id="newAdminConfirmPassword"
                label="Confirm Temporary Password"
                type={showConfirmPwd ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                placeholder="Re-enter the password"
                autoComplete="new-password"
                required
                rightElement={ConfirmPwdToggle}
              />

              <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Admin Account'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
