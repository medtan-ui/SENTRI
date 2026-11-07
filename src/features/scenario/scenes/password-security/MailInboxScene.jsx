import React, { useState } from 'react'
import BrowserChrome from '../../frames/BrowserChrome'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './MailInboxScene.module.css'

const FOLDERS = ['Inbox', 'Starred', 'Sent', 'Drafts', 'Trash']
const OFFICIAL_URL = 'https://portal.university.edu.ph'
const FAKE_SENDER = 'ver1f1cat1on@univ-registrar.com'
const FAKE_LINK_DESTINATION = 'univ-reg1strar.com/confirm?id=88213'

/**
 * University Scales Crest SVG matching the video's circular crest
 */
function UniversityCrest({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" fill="#8B1E1E" stroke="#E5C158" strokeWidth="3" />
      <circle cx="50" cy="50" r="40" stroke="#E5C158" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M30 35 L70 35" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 27 L50 49" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="26" r="2.5" fill="#FFF" />
      <path d="M30 35 L24 45 M30 35 L36 45" stroke="#FFF" strokeWidth="1.5" />
      <path d="M22 45 Q30 50 38 45 Z" fill="#FFF" />
      <path d="M70 35 L64 45 M70 35 L76 45" stroke="#FFF" strokeWidth="1.5" />
      <path d="M62 45 Q70 50 78 45 Z" fill="#FFF" />
      <path
        d="M40 56 V67 C40 75 44 79 50 79 C56 79 60 75 60 67 V56 H55 V67 C55 72 53 74 50 74 C47 74 45 72 45 67 V56 H40 Z"
        fill="#FFF"
      />
    </svg>
  )
}

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenarioChoiceId
}

/**
 * MailInboxScene — Scenario 2
 * A webmail client with one email matching PassSec.mp4.
 * - Address bar has a red notification dot. Clicking it toggles the dropdown to reveal the official site portal.
 * - Email body is clean and natural; only the sender email address has subtle obfuscation (ver1f1cat1on@univ-registrar.com).
 * - Hints callouts only appear after failing once when the student manually clicks "Show Hints".
 */
export default function MailInboxScene({ scenario, interactive, phase, guidedHintActive, onResolve }) {
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [hasFailedOnce, setHasFailedOnce] = useState(false)

  // Track if user has failed at least once so the hints button stays permanently
  React.useEffect(() => {
    if (phase === 'feedback' || guidedHintActive) {
      setHasFailedOnce(true)
    }
  }, [phase, guidedHintActive])

  const showCallouts = hasFailedOnce && showHints

  function handleAddressBarActivate() {
    if (!interactive) return
    setSuggestionOpen((prev) => !prev)
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
          <span className={styles.redNotificationDot} title="New notification available — click to expand" />
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

              {/* Show Hints button remains permanently available once failed at least once */}
              {hasFailedOnce && (
                <button
                  type="button"
                  className={styles.toggleHintsBtn}
                  onClick={() => setShowHints((prev) => !prev)}
                >
                  {showHints ? 'Hide Hints 🙈' : 'Show Hints 💡'}
                </button>
              )}
            </div>

            <div className={styles.emailHeader}>
              <div className={styles.senderRow}>
                <div className={styles.avatarWrap}>
                  <UniversityCrest size={36} />
                </div>
                <div className={styles.senderMeta}>
                  <span className={`${styles.senderName} ${styles.decorative}`}>
                    School Portal Administration
                  </span>
                  <span className={styles.senderEmail}>
                    {FAKE_SENDER}
                  </span>
                  {showCallouts && (
                    <span className={styles.callout} data-pos="sender">
                      Subtle domain mismatch: ver1f1cat1on@univ-registrar.com (not university.edu.ph)
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`${styles.subject} ${styles.decorative}`}>
                School Portal — Immediate Account Verification Notice
              </h3>
            </div>

            <div className={styles.alertBanner} aria-hidden="true">
              ⚠️ Official Notice: Immediate Account Verification Required for Student Access
            </div>

            <div className={`${styles.emailBody} ${styles.decorative}`}>
              <p>Dear Alex De Guzman (Portal ID: AlexDeGuzman06),</p>
              <p className={styles.urgencyLine}>
                Your school portal account requires <strong>immediate verification</strong>. Failure to confirm within{' '}
                <strong>24 hours</strong> will result in immediate suspension of your student portal access, enrollment records, and course registration.
                {showCallouts && (
                  <span className={styles.callout} data-pos="urgency">
                    Urgent deadlines pressure you into acting without checking!
                  </span>
                )}
              </p>
              <p>Please verify your account immediately using the secure portal link below.</p>
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
                  Actually links to {FAKE_LINK_DESTINATION} — fake lookalike domain!
                </span>
              )}
            </div>
          </div>
        </div>
      </BrowserChrome>
    </div>
  )
}
