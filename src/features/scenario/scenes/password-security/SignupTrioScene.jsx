import React, { useState } from 'react'
import InteractiveTarget from '../../engine/InteractiveTarget'
import { passwordStrength } from '../../../../utils/passwordPolicy'
import styles from './SignupTrioScene.module.css'

export const FAKE_HINT_PASSWORD = 'AlexDeGuzman#2026!'

/**
 * University Scales Crest SVG matching the video's hand-drawn circular crest
 */
function UniversityCrest({ size = 56 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer circle — sketch-style with slight imperfection */}
      <circle cx="50" cy="50" r="46" fill="#9B3B3B" stroke="#c26b6b" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="40" stroke="#d4a0a0" strokeWidth="1" strokeDasharray="4 3" />

      {/* Balance beam */}
      <path d="M28 36 L72 36" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 27 L50 50" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="26" r="2.5" fill="#fff" />

      {/* Left pan strings + bowl */}
      <path d="M28 36 L22 46 M28 36 L34 46" stroke="#fff" strokeWidth="1.5" />
      <path d="M20 46 Q28 51 36 46 Z" fill="#fff" />

      {/* Right pan strings + bowl */}
      <path d="M72 36 L66 46 M72 36 L78 46" stroke="#fff" strokeWidth="1.5" />
      <path d="M64 46 Q72 51 80 46 Z" fill="#fff" />

      {/* Letter U */}
      <path
        d="M38 57 V69 C38 77 43 81 50 81 C57 81 62 77 62 69 V57 H57 V69 C57 74 55 76 50 76 C45 76 43 74 43 69 V57 H38 Z"
        fill="#fff"
      />
    </svg>
  )
}

/**
 * EBP E-Wallet card icon
 */
function EBPIcon() {
  return (
    <svg width="44" height="28" viewBox="0 0 72 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="72" height="44" rx="6" fill="#1E3A5F" stroke="#38BDF8" strokeWidth="2" />
      <text
        x="36" y="29"
        fill="#FFFFFF"
        fontSize="18"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
        letterSpacing="2"
      >EBP</text>
    </svg>
  )
}

/**
 * SignupTrioScene — Module 1, Scenario 1
 *
 * Single school portal sign-up form matching the PassSec.mp4 video.
 * A floating EBP E-Wallet password box in the top-right tempts the student
 * to reuse that password.
 *
 * Choice logic:
 *  - Password matches FAKE_HINT_PASSWORD → save-all-same (unsafe, fail)
 *  - Password is empty                   → warn only (no resolve)
 *  - Password is weak (score ≤ 2)        → save-all-different-weak (unsafe, fail)
 *  - Password is unique & strong         → save-all-different (safe)
 */
export default function SignupTrioScene({ scenario, interactive, onResolve }) {
  const [password, setPassword] = useState('')
  const [emptyWarning, setEmptyWarning] = useState(false)
  const [hintCopied, setHintCopied] = useState(false)

  function findChoiceId(target) {
    return scenario.choices.find((c) => c.target === target)?.scenarioChoiceId
  }

  function handleUseHintPassword() {
    if (!interactive) return
    setPassword(FAKE_HINT_PASSWORD)
    setEmptyWarning(false)
    setHintCopied(true)
  }

  function handlePasswordChange(e) {
    if (!interactive) return
    setPassword(e.target.value)
    setEmptyWarning(false)
    setHintCopied(false)
  }

  function handleEnter() {
    if (!interactive) return

    if (!password || !password.trim()) {
      setEmptyWarning(true)
      return
    }

    setEmptyWarning(false)

    // Using the e-wallet password → password reuse → unsafe
    if (password === FAKE_HINT_PASSWORD) {
      const choiceId = findChoiceId('save-all-same')
      if (choiceId) onResolve(choiceId)
      return
    }

    // Weak password → also fail (bad habit)
    const { score } = passwordStrength(password)
    if (score <= 2) {
      const choiceId = findChoiceId('save-all-different-weak')
      if (choiceId) onResolve(choiceId)
      return
    }

    // Unique + strong → safe
    const choiceId = findChoiceId('save-all-different')
    if (choiceId) onResolve(choiceId)
  }

  return (
    <div className={styles.scene}>
      {/* ── Laptop Mockup Shell ── */}
      <div className={styles.laptopFrame}>
        <div className={styles.laptopBezelTop}>
          <span className={styles.webcamDot} aria-hidden="true" />
        </div>

        {/* ── Laptop Screen ── */}
        <div className={styles.laptopScreen}>
          {/* Browser chrome */}
          <div className={styles.browserHeader}>
            <div className={styles.browserTabs}>
              <div className={styles.browserTab}>
                <span className={styles.tabTitle}>University Portal – Sign Up</span>
              </div>
            </div>
            <div className={styles.browserControls} aria-hidden="true">
              <span className={styles.winBtn}>···</span>
              <span className={styles.winBtn}>–</span>
              <span className={styles.winBtn}>□</span>
              <span className={styles.winBtn}>✕</span>
            </div>
          </div>

          {/* Browser body — dark brown page */}
          <div className={styles.browserContent}>

            {/* ── EBP E-Wallet Hint Box (top-right floating card) ── */}
            <div className={styles.walletHintBox}>
              <div className={styles.walletHintHeader}>
                <EBPIcon />
                <span className={styles.walletHintTitle}>EBP E-Wallet</span>
              </div>
              <div className={styles.walletHintBody}>
                <span className={styles.walletHintLabel}>Saved Password</span>
                <code className={styles.walletHintPw}>{FAKE_HINT_PASSWORD}</code>
                <span className={styles.walletHintNote}>Alex's saved login info</span>
              </div>
              <InteractiveTarget
                targetId="wallet-hint-use"
                label="Use EBP E-Wallet password"
                onActivate={handleUseHintPassword}
                disabled={!interactive}
                className={styles.walletHintBtnWrap}
              >
                <span className={`${styles.walletHintBtn} ${hintCopied ? styles.walletHintBtnUsed : ''}`}>
                  {hintCopied ? '✓ Filled in!' : '📋 Use this password'}
                </span>
              </InteractiveTarget>
            </div>

            {/* ── Sign-Up Form ── */}
            <div className={styles.formCard}>
              <div className={styles.crestRow}>
                <UniversityCrest size={62} />
              </div>
              <h2 className={styles.signupHeading}>SIGN UP</h2>

              {/* Portal ID (read-only) */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Portal ID</label>
                <div className={styles.idDisplay}>AlexDeGuzman06</div>
              </div>

              {/* Password input */}
              <div className={styles.fieldGroup}>
                <InteractiveTarget
                  targetId="signup-password-1"
                  label="Password field"
                >
                  <input
                    id="signup-password-1"
                    type="password"
                    className={styles.passwordInput}
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={!interactive}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </InteractiveTarget>
                {emptyWarning && (
                  <span className={styles.emptyWarning}>Please enter a password.</span>
                )}
              </div>

              {/* Enter button */}
              <InteractiveTarget
                targetId="signup-save-1"
                label="Enter — submit password"
                onActivate={handleEnter}
                disabled={!interactive}
                className={styles.enterBtnWrap}
              >
                <span className={styles.enterBtn}>Enter</span>
              </InteractiveTarget>
            </div>

          </div>
        </div>

        {/* Laptop bottom edge */}
        <div className={styles.laptopDeckBottom} aria-hidden="true">
          <div className={styles.laptopHinge} />
        </div>
      </div>
    </div>
  )
}
