import React from 'react'
import { validatePassword, passwordStrength } from '../../utils/passwordPolicy'
import styles from './PasswordStrengthMeter.module.css'

const POLICY_RULES = ['At least 8 characters', 'One lowercase letter', 'One uppercase letter', 'One number']

/**
 * PasswordStrengthMeter
 * A live strength bar + rules checklist for any password input in the app —
 * shared by the admin account-creation form and the password-security
 * scenario's signup cards, built on passwordPolicy.js's validatePassword/
 * passwordStrength so both places score a password identically.
 * @param {{ password: string }} props
 */
export default function PasswordStrengthMeter({ password }) {
  const { errors } = validatePassword(password)
  const strength = passwordStrength(password)

  return (
    <div className={styles.meter}>
      {password && (
        <div className={styles.strengthRow}>
          <div className={styles.strengthTrack}>
            <div
              className={styles.strengthFill}
              data-score={strength.score}
              style={{ width: `${(strength.score / 4) * 100}%` }}
            />
          </div>
          <span className={styles.strengthLabel}>{strength.label}</span>
        </div>
      )}
      <ul className={styles.policyList}>
        {POLICY_RULES.map((rule) => (
          <li key={rule} className={errors.includes(rule) ? styles.policyPending : styles.policyMet}>
            {errors.includes(rule) ? '○' : '✓'} {rule}
          </li>
        ))}
      </ul>
    </div>
  )
}
