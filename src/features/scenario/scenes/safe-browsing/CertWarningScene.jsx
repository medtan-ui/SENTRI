import React, { useState } from 'react'
import BrowserChrome from '../../frames/BrowserChrome'
import URLInspector from '../../frames/URLInspector'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './CertWarningScene.module.css'

const BAD_URL = 'secure-paper-archive.xyz/thesis'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * CertWarningScene — Module 4, Scenario 2 (consequence scenario)
 * A full-page "connection is not private" interstitial. Two real
 * elements resolve the scenario: Back to safety (safe) and, behind a
 * collapsed Advanced section, "Continue to website (unsafe)" (risky).
 * A third — View certificate — is an inspection action: it reveals the
 * mismatched issuer and returns to the paused state without writing a
 * decision or spending an attempt. So is focusing the address bar,
 * which opens the same URLInspector this module leads with.
 */
export default function CertWarningScene({ scenario, interactive, phase, onResolve }) {
  const [addressInspectorOpen, setAddressInspectorOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [certOpen, setCertOpen] = useState(false)
  const showCallouts = phase === 'feedback'
  const inspection = scenario.inspectionAction

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleAddressBarActivate() {
    if (!interactive) return
    setAddressInspectorOpen((v) => !v)
  }

  function handleAdvancedToggle() {
    if (!interactive) return
    setAdvancedOpen((v) => !v)
  }

  function handleViewCert() {
    // Inspection only — per spec this never calls onResolve. Reveals
    // detail and returns to paused_interactive; curiosity is free.
    if (!interactive) return
    setCertOpen((v) => !v)
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
          <span className={styles.notSecure} aria-hidden="true">⚠️</span>
          <span className={styles.addressText}>{BAD_URL}</span>
        </div>
      </InteractiveTarget>
      {addressInspectorOpen && <URLInspector url={`https://${BAD_URL}`} className={styles.addressInspector} />}
    </div>
  )

  return (
    <div className={styles.scene}>
      <BrowserChrome url={BAD_URL} addressBar={addressBar}>
        <div className={styles.interstitial}>
          <span className={`${styles.warningIcon} ${styles.decorative}`} aria-hidden="true">⚠️</span>
          <h2 className={`${styles.title} ${styles.decorative}`}>Your connection is not private</h2>
          <p className={`${styles.body} ${styles.decorative}`}>
            Attackers might be trying to steal your information from <strong>secure-paper-archive.xyz</strong> (for
            example, passwords or credit cards).
            <br />
            <span className={styles.errorCode}>NET::ERR_CERT_INVALID</span>
          </p>

          <InteractiveTarget
            targetId="back-to-safety"
            label="Back to safety"
            onActivate={() => handleChoice('back-to-safety')}
            disabled={!interactive}
            className={styles.backBtnWrap}
          >
            <span className={styles.backBtn}>Back to safety</span>
          </InteractiveTarget>

          <button
            type="button"
            className={`${styles.advancedToggle} ${styles.plainToggle}`}
            onClick={handleAdvancedToggle}
          >
            Advanced {advancedOpen ? '▾' : '▸'}
          </button>

          {advancedOpen && (
            <div className={styles.advancedPanel}>
              <InteractiveTarget
                targetId="view-cert"
                label="View certificate"
                onActivate={handleViewCert}
                disabled={!interactive}
              >
                <span className={styles.advancedLink}>View certificate</span>
              </InteractiveTarget>

              {certOpen && inspection && (
                <div className={styles.certDetails}>
                  <p className={styles.certTitle}>{inspection.detail_title}</p>
                  <p className={styles.certText}>{inspection.detail_text}</p>
                </div>
              )}

              <InteractiveTarget
                targetId="proceed-anyway"
                label="Continue to secure-paper-archive.xyz (unsafe)"
                onActivate={() => handleChoice('proceed-anyway')}
                disabled={!interactive}
              >
                <span className={styles.advancedLink}>Continue to secure-paper-archive.xyz (unsafe)</span>
              </InteractiveTarget>
            </div>
          )}

          {showCallouts && (
            <div className={styles.feedbackInspector}>
              <URLInspector url={`https://${BAD_URL}`} />
            </div>
          )}
        </div>
      </BrowserChrome>
    </div>
  )
}
