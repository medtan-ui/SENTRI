import React, { useState } from 'react'
import PhoneFrame from '../../frames/PhoneFrame'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './GiveawayFormScene.module.css'

// Ranked most- to least-damaging. FeedbackPanel/ConsequenceOverlay are
// full-bleed overlays (z-index above this scene) that can only ever show
// one config-driven choice's static text — there's no scene-rendered UI
// that could stay visible through them. So "the single most damaging
// field" has to be picked here, before resolving, by choosing among three
// separate risky choice_ids (one per field) rather than one generic id
// plus a dynamic callout.
const DANGER_PRIORITY = [
  { key: 'birthday', target: 'field-birthday' },
  { key: 'address', target: 'field-address' },
  { key: 'phone', target: 'field-phone' },
]

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

const BLANK_FIELDS = { name: '', email: '', address: '', phone: '', birthday: '' }

/**
 * GiveawayFormScene — Module 5, Scenario 2 (consequence scenario)
 * A "claim your prize" sign-up form. Input-driven, like Module 1's
 * Scenario 1: the scene inspects which fields were actually filled at
 * submit time to decide the outcome, rather than mapping one target to
 * one choice. Field values live only in this component's local state —
 * never persisted, never transmitted, and gone the moment this
 * component unmounts (React discards local state automatically; there
 * is nothing here that outlives the component to explicitly clear).
 */
export default function GiveawayFormScene({ scenario, interactive, onResolve }) {
  const [fields, setFields] = useState(BLANK_FIELDS)
  const [validationWarning, setValidationWarning] = useState(false)

  function updateField(key, value) {
    if (!interactive) return
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function handleChoice(targetName) {
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleBack() {
    if (!interactive) return
    handleChoice('back-abandoned')
  }

  function handleSubmit() {
    if (!interactive) return
    if (!fields.name.trim() || !fields.email.trim()) {
      setValidationWarning(true)
      return
    }
    setValidationWarning(false)

    const triggered = DANGER_PRIORITY.find((d) => fields[d.key].trim())
    if (triggered) {
      handleChoice(triggered.target)
    } else {
      handleChoice('name-email-only')
    }
  }

  return (
    <div className={styles.scene}>
      <PhoneFrame>
        <div className={styles.header}>
          <InteractiveTarget targetId="back-control" label="Back" onActivate={handleBack} disabled={!interactive}>
            <span className={styles.backBtn} aria-hidden="true">←</span>
          </InteractiveTarget>
          <span className={`${styles.headerTitle} ${styles.decorative}`}>Claim Your Prize</span>
        </div>

        <div className={styles.form}>
          <p className={`${styles.intro} ${styles.decorative}`}>
            Congratulations! Fill out the form below to claim your ₱5,000 voucher.
          </p>

          <label className={styles.fieldLabel}>Full name</label>
          <InteractiveTarget targetId="form-name" label="Full name">
            <input
              className={styles.input}
              value={fields.name}
              onChange={(e) => updateField('name', e.target.value)}
              disabled={!interactive}
              placeholder="Juan Dela Cruz"
            />
          </InteractiveTarget>

          <label className={styles.fieldLabel}>Email</label>
          <InteractiveTarget targetId="form-email" label="Email">
            <input
              type="email"
              className={styles.input}
              value={fields.email}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={!interactive}
              placeholder="you@example.com"
            />
          </InteractiveTarget>

          <label className={styles.fieldLabel}>Home address</label>
          <InteractiveTarget targetId="form-address" label="Home address">
            <input
              className={styles.input}
              value={fields.address}
              onChange={(e) => updateField('address', e.target.value)}
              disabled={!interactive}
              placeholder="Street, Barangay, City"
            />
          </InteractiveTarget>

          <label className={styles.fieldLabel}>Phone number</label>
          <InteractiveTarget targetId="form-phone" label="Phone number">
            <input
              type="tel"
              className={styles.input}
              value={fields.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              disabled={!interactive}
              placeholder="09XX XXX XXXX"
            />
          </InteractiveTarget>

          <label className={styles.fieldLabel}>Birthday</label>
          <InteractiveTarget targetId="form-birthday" label="Birthday">
            <input
              type="text"
              className={styles.input}
              value={fields.birthday}
              onChange={(e) => updateField('birthday', e.target.value)}
              disabled={!interactive}
              placeholder="MM/DD/YYYY"
            />
          </InteractiveTarget>

          {validationWarning && (
            <span className={styles.warning}>Enter at least your name and email first.</span>
          )}

          <InteractiveTarget
            targetId="form-submit"
            label="Submit"
            onActivate={handleSubmit}
            disabled={!interactive}
            className={styles.submitBtnWrap}
          >
            <span className={styles.submitBtn}>SUBMIT</span>
          </InteractiveTarget>
        </div>
      </PhoneFrame>
    </div>
  )
}
