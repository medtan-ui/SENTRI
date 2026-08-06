import React, { useState } from 'react'
import InteractiveTarget from '../../engine/InteractiveTarget'
import PasswordStrengthMeter from '../../../../components/PasswordStrengthMeter/PasswordStrengthMeter'
import { passwordStrength } from '../../../../utils/passwordPolicy'
import styles from './SignupTrioScene.module.css'

/**
 * Three services that look like three services.
 *
 * They used to be three identical white cards with the same padlock
 * emoji, differing only in a name and a username — which quietly
 * undermined the whole scenario. The lesson here is "don't reuse one
 * password across unrelated accounts", and that only lands if the
 * student can see at a glance that these ARE unrelated accounts. Three
 * clones read as one form repeated three times, so reusing a password
 * across them looks reasonable rather than risky.
 *
 * Each now carries what a real signup page would: its own brand colour,
 * its own logo tile, and a line saying what the account is actually for.
 * `stakes` is the one that does the teaching — the wallet holds money,
 * and saying so is what makes reuse there feel different from reuse on a
 * timetable portal.
 */
const CARDS = [
  {
    key: 'portal',
    name: 'University Student Portal',
    // The button says "Create <shortName> account". Derived from `name`
    // it produced "Create Campus account" for Campus Mail, so each card
    // names itself explicitly.
    shortName: 'Portal',
    mark: 'U',
    brand: '#1F3A5F',
    brandSoft: '#EAF0F7',
    tagline: 'Grades, enrolment and tuition',
    stakes: 'Your academic record',
    username: 'j.delacruz.2024',
    passwordTargetId: 'signup-password-1',
    saveTargetId: 'signup-save-1',
  },
  {
    key: 'mail',
    name: 'Campus Mail',
    shortName: 'Mail',
    mark: 'M',
    brand: '#C0392B',
    brandSoft: '#FDEDEB',
    tagline: 'Your student email inbox',
    stakes: 'Password resets for everything else',
    username: 'jdelacruz@campus.edu.ph',
    passwordTargetId: 'signup-password-2',
    saveTargetId: 'signup-save-2',
  },
  {
    key: 'wallet',
    name: 'PeraSend',
    shortName: 'PeraSend',
    mark: '₱',
    brand: '#0E8F6E',
    brandSoft: '#E6F5F0',
    tagline: 'Send and receive money',
    stakes: 'Real money',
    username: '09171234567',
    passwordTargetId: 'signup-password-3',
    saveTargetId: 'signup-save-3',
  },
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
 * calls onResolve with that choice's scenarioChoiceId. No "what
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
    return scenario.choices.find((c) => c.target === targetName)?.scenarioChoiceId
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
      <div className={styles.cardRow}>
        {CARDS.map((card) => (
          <div
            key={card.key}
            className={styles.card}
            style={{ '--brand': card.brand, '--brand-soft': card.brandSoft }}
          >
            <div className={`${styles.cardHeader} ${styles.decorative}`}>
              <span className={styles.cardMark} aria-hidden="true">{card.mark}</span>
              <span className={styles.cardHeading}>
                <span className={styles.cardName}>{card.name}</span>
                <span className={styles.cardTagline}>{card.tagline}</span>
              </span>
            </div>

            <div className={`${styles.stakes} ${styles.decorative}`}>
              <span className={styles.stakesLabel}>Protects</span>
              {card.stakes}
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
              <span className={styles.saveBtn} data-saved={saved[card.key] || undefined}>
                {saved[card.key] ? 'Saved' : `Create ${card.shortName} account`}
              </span>
            </InteractiveTarget>
          </div>
        ))}
      </div>
    </div>
  )
}
