import React, { useState } from 'react'
import Card from '../Card/Card'
import Button from '../Button/Button'
import Input from '../Input/Input'
import { useAuth } from '../../context/AuthContext'
import styles from './EditNicknameSection.module.css'

/**
 * EditNicknameSection
 * Inline-toggle "Edit Profile" card, shared by both Profile pages — the
 * one field of users/{uid} a signed-in user may change themself (via the
 * updateOwnNickname Cloud Function; direct client writes stay disallowed
 * per firestore.rules). Also how an account created before the nickname
 * feature existed sets one for the first time.
 */
export default function EditNicknameSection() {
  const { user, updateNickname } = useAuth()
  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleOpen() {
    if (!open) {
      setNickname(user?.nickname || '')
      setError('')
    }
    setOpen((v) => !v)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!nickname.trim()) {
      setError('Please enter a nickname.')
      return
    }
    setSubmitting(true)
    try {
      await updateNickname(nickname.trim())
      setNotice('Nickname updated.')
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.cardTitle}>Edit Profile</h2>
        <Button variant="ghost" size="sm" onClick={toggleOpen}>
          {open ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {notice && !open && (
        <div className={styles.successBanner} role="status">
          <span aria-hidden="true">✓</span> {notice}
        </div>
      )}

      {!open && (
        <p className={styles.body}>Update the nickname shown throughout SENTRI instead of your full name.</p>
      )}

      {open && (
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              <span aria-hidden="true">⚠</span> {error}
            </div>
          )}
          <Input
            id="editNickname"
            label="What would you like the system to call you?"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="off"
            required
          />
          <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={submitting}>
            Save
          </Button>
        </form>
      )}
    </Card>
  )
}
