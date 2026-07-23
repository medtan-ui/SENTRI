import React, { useState } from 'react'
import InteractiveTarget from '../../engine/InteractiveTarget'
import PasswordStrengthMeter from '../../../../components/PasswordStrengthMeter/PasswordStrengthMeter'
import { passwordStrength } from '../../../../utils/passwordPolicy'
import styles from './SignupTrioScene.module.css'

const CARDS = [
  { key: 'portal', name: 'University Student Portal', username: 'j.delacruz.2024', passwordTargetId: 'signup-password-1', saveTargetId: 'signup-save-1' },
  { key: 'mail', name: 'Campus Mail', username: 'jdelacruz@campus.edu.ph', passwordTargetId: 'signup-password-2', saveTargetId: 'signup-save-2' },
  { key: 'wallet', name: 'PeraSend', username: '09171234567', passwordTargetId: 'signup-password-3', saveTargetId: 'signup-save-3' },
]

function commonPrefixLength(strings) {
  let i = 0
  while (strings.every((s) => s[i] !== undefined && s[i] === strings[0][i])) i += 1
  return i
}

/**
 * SignupTrioScene — Scenario 1
 * Three real signup cards. The student types a password into each and
 * saves it; once all three are saved, this scene — not the engine —
 * decides which choice applies by comparing the three strings, then
 * calls onResolve with that choice's scenario_choice_id. No "what
 * should you do" menu: the choices ARE the password fields and Save
 * buttons.
 *
 * Beyond same/similar-stem/different, "different" itself branches once
 * more on complexity (via passwordPolicy's passwordStrength, the same
 * scale the admin account-creation form uses): three unique but weak
 * passwords resolves to a distinct, still-safe outcome rather than the
 * fully-complex one — see save-all-different-weak below.
 */
export default function SignupTrioScene({ scenario, interactive, onResolve }) {
  const [passwords, setPasswords] = useState({ portal: '', mail: '', wallet: '' })
  const [saved, setSaved] = useState({ portal: false, mail: false, wallet: false })
  const [emptyWarningKey, setEmptyWarningKey] = useState(null)

  function findChoiceId(targetName) {
    return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
  }

  function evaluate(pw) {
    const values = [pw.portal, pw.mail, pw.wallet]
    if (values[0] === values[1] && values[1] === values[2]) return findChoiceId('save-all-same')
    if (commonPrefixLength(values) >= 5) return findChoiceId('save-similar-stem')
    const weakestScore = Math.min(...values.map((v) => passwordStrength(v).score))
    if (weakestScore <= 2) return findChoiceId('save-all-different-weak')
    return findChoiceId('save-all-different')
  }

  function handlePasswordChange(key, value) {
    if (!interactive) return
    setPasswords((prev) => ({ ...prev, [key]: value }))
    setSaved((prev) => ({ ...prev, [key]: false }))
  }

  function handleSave(key) {
    if (!interactive) return
    const value = passwords[key]
    if (!value.trim()) {
      setEmptyWarningKey(key)
      return
    }
    setEmptyWarningKey(null)
    const nextSaved = { ...saved, [key]: true }
    setSaved(nextSaved)
    if (nextSaved.portal && nextSaved.mail && nextSaved.wallet) {
      const choiceId = evaluate(passwords)
      if (choiceId) onResolve(choiceId)
    }
  }

  return (
    <div className={styles.scene}>
      <p className={`${styles.instructions} ${styles.decorative}`}>
        Finish creating your accounts below. Set a password for each one and save it.
      </p>
      <p className={`${styles.funNote} ${styles.decorative}`}>
        Real talk: if you're just mashing the keyboard right now, will you actually remember any of this next week? 😅
      </p>
      <div className={styles.cardRow}>
        {CARDS.map((card) => (
          <div key={card.key} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={`${styles.cardIcon} ${styles.decorative}`} aria-hidden="true">🔐</span>
              <span className={`${styles.cardName} ${styles.decorative}`}>{card.name}</span>
            </div>

            <label className={`${styles.fieldLabel} ${styles.decorative}`}>Username</label>
            <div className={`${styles.usernameDisplay} ${styles.decorative}`}>{card.username}</div>

            <label className={styles.fieldLabel} htmlFor={card.passwordTargetId}>Password</label>
            <InteractiveTarget targetId={card.passwordTargetId} label={`Password field for ${card.name}`}>
              <input
                id={card.passwordTargetId}
                type="password"
                className={styles.passwordInput}
                value={passwords[card.key]}
                onChange={(e) => handlePasswordChange(card.key, e.target.value)}
                disabled={!interactive}
                autoComplete="new-password"
                placeholder="Enter a password"
              />
            </InteractiveTarget>
            {emptyWarningKey === card.key && (
              <span className={styles.emptyWarning}>Enter a password first.</span>
            )}
            <div className={styles.decorative}>
              <PasswordStrengthMeter password={passwords[card.key]} />
            </div>

            <InteractiveTarget
              targetId={card.saveTargetId}
              label={`Save password for ${card.name}`}
              onActivate={() => handleSave(card.key)}
              disabled={!interactive}
              className={styles.saveBtnWrap}
            >
              <span className={styles.saveBtn}>{saved[card.key] ? 'Saved ✓' : 'Save Password'}</span>
            </InteractiveTarget>
          </div>
        ))}
      </div>
    </div>
  )
}
