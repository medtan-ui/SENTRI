import React, { useState } from 'react'
import Icon from '../../components/Icon/Icon'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter'
import { useAuth } from '../../context/AuthContext'
import { validatePassword } from '../../utils/passwordPolicy'
import { MAX_SECTION_LENGTH } from '../../utils/sections'
import logo from '../../assets/images/logo.png'
import styles from './RegisterAccountPage.module.css'

const SCHOOL_EMAIL_REGEX = /^[^\s@]+@tip\.edu\.ph$/i

// Mirrors the sectionSchema regex in functions/src/auth/validators.ts —
// the server is authoritative; this is only so a typo is caught before the
// round trip.
const SECTION_REGEX = /^[A-Za-z0-9][A-Za-z0-9 ._/-]*$/

const EMPTY_FORM = {
  displayName: '',
  nickname: '',
  email: '',
  section: '',
  password: '',
  confirmPassword: '',
}

/**
 * RegisterAccountPage — /register
 * Public, unauthenticated self-registration — no login required to reach
 * or use this page. Always creates a student account (no role field;
 * admin accounts are bootstrapped out-of-band, same as the first admin
 * was). Follows LoginPage's exact visual language since the two are now
 * peers: the public front door to the app, signed-out either way.
 */
export default function RegisterAccountPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    if (!form.displayName.trim()) return 'Please enter your full name.'
    if (!form.nickname.trim()) return 'Please enter a nickname.'
    if (!SCHOOL_EMAIL_REGEX.test(form.email.trim())) return 'Please enter a valid @tip.edu.ph email address.'
    const section = form.section.trim()
    if (section) {
      if (section.length > MAX_SECTION_LENGTH) return `Section must be ${MAX_SECTION_LENGTH} characters or fewer.`
      if (!SECTION_REGEX.test(section)) {
        return 'Section may only contain letters, numbers, spaces, and - _ . /'
      }
    }
    const { valid, errors } = validatePassword(form.password)
    if (!valid) return `Password requirements not met: ${errors.join(', ')}.`
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const user = await register({
        displayName: form.displayName.trim(),
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        section: form.section.trim(),
        password: form.password,
      })
      // Freshly registered + signed in, emailVerified is false — land on
      // the student dashboard route; ProtectedRoute renders
      // EmailVerificationGate in its place automatically from here.
      navigate(`/${user.role}/dashboard`, { replace: true })
    } catch (err) {
      setError(err.message)
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
    <div className={styles.page}>
      <div className={styles.center}>
        <Card className={styles.card}>
          <div className={styles.branding}>
            <img src={logo} alt="SENTRI logo" className={styles.logo} />
            <h1 className={styles.title}>Register Student Account</h1>
            <p className={styles.tagline}>
              Creates a new student account. You'll verify your school email with Firebase before signing in.
            </p>
          </div>

          <div className={styles.divider} />

          {error && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.errorIcon} aria-hidden="true">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <Input
              id="regFullName"
              label="Full Name"
              value={form.displayName}
              onChange={updateField('displayName')}
              placeholder="Juan Dela Cruz"
              autoComplete="name"
              required
            />

            <Input
              id="regNickname"
              label="What would you like the system to call you?"
              value={form.nickname}
              onChange={updateField('nickname')}
              placeholder="Juan"
              autoComplete="off"
              required
            />

            <Input
              id="regEmail"
              label="School Email Address"
              type="email"
              value={form.email}
              onChange={updateField('email')}
              placeholder="juan.delacruz@tip.edu.ph"
              autoComplete="email"
              required
            />

            <Input
              id="regSection"
              label="Section (optional)"
              value={form.section}
              onChange={updateField('section')}
              placeholder="BSIT-3A"
              autoComplete="off"
              maxLength={MAX_SECTION_LENGTH}
              helperText="Lets your instructor see your class group's results together. You can leave this blank."
            />

            <Input
              id="regPassword"
              label="Password"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={updateField('password')}
              placeholder="Create a password"
              autoComplete="new-password"
              required
              rightElement={PwdToggle}
            />

            <PasswordStrengthMeter password={form.password} />

            <Input
              id="regConfirmPassword"
              label="Confirm Password"
              type={showConfirmPwd ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              placeholder="Re-enter the password"
              autoComplete="new-password"
              required
              rightElement={ConfirmPwdToggle}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting} disabled={submitting}>
              {submitting ? 'Registering…' : 'Register Account'}
            </Button>

            <button type="button" className={styles.backLink} onClick={() => navigate('/')}>
              ← Back to Sign In
            </button>
          </form>

          <p className={styles.copyright}>© 2026 SENTRI</p>
        </Card>
      </div>
    </div>
  )
}
