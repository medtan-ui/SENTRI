import React, { useState } from 'react'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './AccountSecurityScene.module.css'

const ACCOUNTS = [
  { key: 'portal', name: 'University Student Portal', changeTargetId: 'account-change-1' },
  { key: 'mail', name: 'Campus Mail', changeTargetId: 'account-change-2' },
  { key: 'wallet', name: 'PeraSend', changeTargetId: 'account-change-3' },
]

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * AccountSecurityScene — Scenario 3
 * An account security panel. The student marks which accounts they've
 * changed the password on, optionally enables two-step verification,
 * then confirms — or takes the "Remind me later" exit at any time.
 * Confirming with all three changed and two-step on is the only safe
 * outcome; anything less resolves as the risky "you didn't fully
 * secure this" path.
 */
export default function AccountSecurityScene({ scenario, interactive, guidedHintActive, onResolve }) {
  const [changed, setChanged] = useState({ portal: false, mail: false, wallet: false })
  const [twoStepEnabled, setTwoStepEnabled] = useState(false)

  const allChanged = changed.portal && changed.mail && changed.wallet
  const safeChoiceId = findChoiceId(scenario, 'change-all-and-enable-2fa')
  const partialChoiceId = findChoiceId(scenario, 'change-portal-only')
  const remindChoiceId = findChoiceId(scenario, 'remind-later')

  function toggleChanged(key) {
    if (!interactive) return
    setChanged((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleTwoStep() {
    if (!interactive) return
    setTwoStepEnabled((v) => !v)
  }

  function handleConfirm() {
    if (!interactive) return
    const choiceId = allChanged && twoStepEnabled ? safeChoiceId : partialChoiceId
    if (choiceId) onResolve(choiceId)
  }

  function handleRemindLater() {
    if (!interactive) return
    if (remindChoiceId) onResolve(remindChoiceId)
  }

  return (
    <div className={styles.scene}>
      <div className={styles.panel}>
        <div className={`${styles.panelHeader} ${styles.decorative}`}>
          <h3 className={styles.panelTitle}>Account Security</h3>
          <p className={styles.panelSubtitle}>
            We noticed one of your passwords may have been exposed. Review your accounts below.
          </p>
        </div>

        <ul className={styles.accountList}>
          {ACCOUNTS.map((account) => (
            <li key={account.key} className={styles.accountRow}>
              <div className={styles.accountInfo}>
                <span className={`${styles.accountIcon} ${styles.decorative}`} aria-hidden="true">🔐</span>
                <span className={`${styles.accountName} ${styles.decorative}`}>{account.name}</span>
              </div>
              <InteractiveTarget
                targetId={account.changeTargetId}
                label={`Change password for ${account.name}`}
                onActivate={() => toggleChanged(account.key)}
                disabled={!interactive}
                highlighted={guidedHintActive}
              >
                <span className={`${styles.changeBtn} ${changed[account.key] ? styles.changeBtnDone : ''}`}>
                  {changed[account.key] ? 'Password changed ✓' : 'Change password'}
                </span>
              </InteractiveTarget>
            </li>
          ))}
        </ul>

        <div className={styles.twoStepRow}>
          <div className={`${styles.twoStepInfo} ${styles.decorative}`}>
            <span className={styles.twoStepTitle}>Two-step verification</span>
            <span className={styles.twoStepSubtitle}>Require a code from your phone when signing in.</span>
          </div>
          <InteractiveTarget
            targetId="two-step-toggle"
            label="Toggle two-step verification"
            onActivate={toggleTwoStep}
            disabled={!interactive}
            highlighted={guidedHintActive}
          >
            <span className={styles.toggleSwitch} data-on={twoStepEnabled}>
              <span className={styles.toggleKnob} />
            </span>
          </InteractiveTarget>
        </div>

        <div className={styles.footerRow}>
          <InteractiveTarget
            targetId="remind-later"
            label="Remind me later"
            onActivate={handleRemindLater}
            disabled={!interactive}
          >
            <span className={styles.remindLink}>Remind me later</span>
          </InteractiveTarget>

          <InteractiveTarget
            targetId="confirm-changes"
            label="Save security changes"
            onActivate={handleConfirm}
            disabled={!interactive}
          >
            <span className={styles.confirmBtn}>Save Changes</span>
          </InteractiveTarget>
        </div>
      </div>
    </div>
  )
}
