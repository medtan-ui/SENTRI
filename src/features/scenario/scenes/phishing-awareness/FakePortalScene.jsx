import React, { useState } from 'react'
import BrowserChrome from '../../frames/BrowserChrome'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './FakePortalScene.module.css'

const PREFILLED_EMAIL = 'alexgonzales2004@tip.edu.ph'
const URL_PREFIX = 'https://'
const URL_DOMAIN = 'tip-edu-verify.net'
const URL_PATH = '/login'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * FakePortalScene — Module 2, Scenario 2
 * A convincing lookalike of the student portal's login page. Three real
 * elements map to choices: the login form's Sign In button (risky),
 * "Forgot password?" (risky), and the address bar — focusing it
 * highlights the domain so the mismatch is visible, then a distinct
 * "Back to safety" control appears as the actual safe action.
 */
export default function FakePortalScene({ scenario, interactive, onResolve }) {
  const [password, setPassword] = useState('')
  const [emptyWarning, setEmptyWarning] = useState(false)
  const [addressActive, setAddressActive] = useState(false)

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleSignIn() {
    if (!interactive) return
    if (!password.trim()) {
      setEmptyWarning(true)
      return
    }
    setEmptyWarning(false)
    handleChoice('login-form')
  }

  function handleAddressBarActivate() {
    if (!interactive) return
    setAddressActive(true)
  }

  const addressBar = (
    <div className={styles.addressBarWrap}>
      <InteractiveTarget
        targetId="address-bar"
        label="Browser address bar"
        onActivate={handleAddressBarActivate}
        disabled={!interactive}
        className={styles.addressBarTarget}
      >
        <div className={styles.addressBarInner}>
          <span className={styles.lock} aria-hidden="true">🔒</span>
          <span className={styles.addressText}>
            {URL_PREFIX}
            <span className={`${styles.domainSegment} ${addressActive ? styles.domainHighlighted : ''}`}>
              {URL_DOMAIN}
            </span>
            {URL_PATH}
          </span>
        </div>
      </InteractiveTarget>

      {addressActive && (
        <div className={styles.addressCallout}>
          <span>This isn't tip.edu.ph — it's a different domain.</span>
          <InteractiveTarget
            targetId="back-to-safety"
            label="Back to safety"
            onActivate={() => handleChoice('address-bar')}
            disabled={!interactive}
          >
            <span className={styles.backToSafetyBtn}>← Back to safety</span>
          </InteractiveTarget>
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.scene}>
      <BrowserChrome url={`${URL_PREFIX}${URL_DOMAIN}${URL_PATH}`} addressBar={addressBar}>
        <div className={styles.portalPage}>
          <div className={`${styles.portalHeader} ${styles.decorative}`}>
            <span className={styles.portalLogo} aria-hidden="true">🎓</span>
            <span className={styles.portalName}>Student Portal</span>
          </div>

          <div className={styles.loginCard}>
            <h3 className={`${styles.loginTitle} ${styles.decorative}`}>Sign in to continue</h3>

            <label className={`${styles.fieldLabel} ${styles.decorative}`} htmlFor="portal-email">Email</label>
            <input
              id="portal-email"
              type="email"
              className={`${styles.emailInput} ${styles.decorative}`}
              value={PREFILLED_EMAIL}
              readOnly
              tabIndex={-1}
            />

            <label className={styles.fieldLabel} htmlFor="portal-password">Password</label>
            <InteractiveTarget targetId="login-form-password" label="Password field">
              <input
                id="portal-password"
                type="password"
                className={styles.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!interactive}
                autoComplete="off"
                placeholder="Enter your password"
              />
            </InteractiveTarget>
            {emptyWarning && <span className={styles.emptyWarning}>Enter a password first.</span>}

            <InteractiveTarget
              targetId="login-form"
              label="Sign In"
              onActivate={handleSignIn}
              disabled={!interactive}
              className={styles.signInBtnWrap}
            >
              <span className={styles.signInBtn}>Sign In</span>
            </InteractiveTarget>

            <InteractiveTarget
              targetId="forgot-password"
              label="Forgot password?"
              onActivate={() => handleChoice('forgot-password')}
              disabled={!interactive}
              className={styles.forgotWrap}
            >
              <span className={styles.forgotLink}>Forgot password?</span>
            </InteractiveTarget>
          </div>
        </div>
      </BrowserChrome>
    </div>
  )
}
