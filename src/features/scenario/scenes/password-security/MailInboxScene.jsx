import React, { useState } from 'react'
import BrowserChrome from '../../frames/BrowserChrome'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './MailInboxScene.module.css'

const FOLDERS = ['Inbox', 'Starred', 'Sent', 'Drafts', 'Trash']
const OFFICIAL_URL = 'https://portal.university.edu.ph'
const FAKE_SENDER = 'verification@univ-registrar-secure.com'
const FAKE_LINK_DESTINATION = 'univ-registrar-secure.com/confirm?id=88213'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * MailInboxScene — Scenario 2
 * A fake webmail client with one open email. The three real elements
 * that map to choices: the email's Verify Account button (risky), the
 * Reply button in the mail toolbar (risky), and the browser's address
 * bar — focusing it reveals a suggestion for the real portal, clicking
 * that suggestion is the safe path. No option ever describes itself in
 * a sentence; the student acts on the interface directly.
 */
export default function MailInboxScene({ scenario, interactive, phase, onResolve }) {
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const showCallouts = phase === 'feedback'

  function handleAddressBarActivate() {
    if (!interactive) return
    setSuggestionOpen(true)
  }

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
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
          <span className={styles.addressText}>campus-mail.edu.ph/inbox</span>
        </div>
      </InteractiveTarget>

      {suggestionOpen && (
        <div className={styles.suggestionDropdown}>
          <InteractiveTarget
            targetId="address-bar-suggestion"
            label={`Go to ${OFFICIAL_URL}`}
            onActivate={() => handleChoice('address-bar')}
            disabled={!interactive}
          >
            <div className={styles.suggestionRow}>
              <span aria-hidden="true">🌐</span>
              <span className={styles.suggestionUrl}>{OFFICIAL_URL}</span>
              <span className={styles.suggestionTag}>Official site</span>
            </div>
          </InteractiveTarget>
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.scene}>
      <BrowserChrome url="campus-mail.edu.ph/inbox" addressBar={addressBar}>
        <div className={styles.mailApp}>
          <aside className={`${styles.sidebar} ${styles.decorative}`}>
            <div className={styles.composeBtn}>+ Compose</div>
            <ul className={styles.folderList}>
              {FOLDERS.map((f) => (
                <li key={f} className={f === 'Inbox' ? styles.folderActive : styles.folder}>{f}</li>
              ))}
            </ul>
          </aside>

          <div className={styles.mailMain}>
            <div className={styles.toolbar}>
              <span className={`${styles.toolbarIcon} ${styles.decorative}`} aria-hidden="true">🗄</span>
              <span className={`${styles.toolbarIcon} ${styles.decorative}`} aria-hidden="true">🏷</span>
              <InteractiveTarget
                targetId="reply-btn"
                label="Reply to this email"
                onActivate={() => handleChoice('reply-btn')}
                disabled={!interactive}
              >
                <span className={styles.toolbarBtn}>↩ Reply</span>
              </InteractiveTarget>
            </div>

            <div className={styles.emailHeader}>
              <div className={styles.senderRow}>
                <span className={`${styles.avatar} ${styles.decorative}`} aria-hidden="true">U</span>
                <div className={styles.senderMeta}>
                  <span className={`${styles.senderName} ${styles.decorative}`}>University Registrar</span>
                  <span className={styles.senderEmail}>{FAKE_SENDER}</span>
                  {showCallouts && (
                    <span className={styles.callout} data-pos="sender">
                      This domain isn't the university's real domain
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`${styles.subject} ${styles.decorative}`}>University — Verification of Application</h3>
            </div>

            <div className={`${styles.emailBody} ${styles.decorative}`}>
              <p>Dear Student,</p>
              <p className={styles.urgencyLine}>
                Your application record requires <strong>immediate verification</strong>. Failure to confirm within{' '}
                <strong>24 hours</strong> will result in suspension of your student portal access.
                {showCallouts && (
                  <span className={styles.callout} data-pos="urgency">
                    Urgent deadlines pressure you into acting without checking
                  </span>
                )}
              </p>
              <p>Please verify your account immediately using the button below.</p>
            </div>

            <div className={styles.verifyRow}>
              <InteractiveTarget
                targetId="email-verify-btn"
                label="Verify Account"
                onActivate={() => handleChoice('email-verify-btn')}
                disabled={!interactive}
              >
                <span className={styles.verifyBtn}>Verify Account</span>
              </InteractiveTarget>
              {showCallouts && (
                <span className={styles.callout} data-pos="link">
                  Actually links to {FAKE_LINK_DESTINATION} — not the university
                </span>
              )}
            </div>
          </div>
        </div>
      </BrowserChrome>
    </div>
  )
}
