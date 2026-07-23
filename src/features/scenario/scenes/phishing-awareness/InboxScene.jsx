import React, { useState } from 'react'
import BrowserChrome from '../../frames/BrowserChrome'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './InboxScene.module.css'

const REAL_LINK_DESTINATION = 'tip-edu-verify.net/login'
const FAKE_SENDER = 'registrar@tip-edu-portal.net'
const OTHER_EMAILS = [
  { from: 'Career Center', subject: 'Internship fair next week', time: '9:14 AM' },
  { from: 'Library Services', subject: 'Your hold is ready for pickup', time: 'Yesterday' },
  { from: 'Student Council', subject: 'Vote for this term’s officers', time: 'Yesterday' },
  { from: 'IT Helpdesk', subject: 'Scheduled maintenance this weekend', time: '2 days ago' },
]

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * InboxScene — Module 2, Scenario 1
 * A fake webmail inbox. Three real elements map to choices: the Submit
 * Assignment button (risky), Reply in the toolbar (risky), and the
 * sender name — which is a deliberate two-step safe path: clicking it
 * only expands the sender's details and reveals a Report button; only
 * that final Report click resolves the scenario. Hovering the Submit
 * Assignment button (not clicking it) reveals its real destination in a
 * status bar, free information that costs nothing.
 */
export default function InboxScene({ scenario, interactive, phase, onResolve }) {
  const [senderExpanded, setSenderExpanded] = useState(false)
  const [hoveringSubmit, setHoveringSubmit] = useState(false)
  const showCallouts = phase === 'feedback'

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleSenderActivate() {
    if (!interactive) return
    setSenderExpanded(true)
  }

  function handleReport() {
    if (!interactive) return
    handleChoice('sender-chip')
  }

  return (
    <div className={styles.scene}>
      <BrowserChrome url="campus-mail.edu.ph/inbox">
        <div className={styles.mailApp}>
          <aside className={`${styles.sidebar} ${styles.decorative}`}>
            <div className={styles.composeBtn}>+ Compose</div>
            <ul className={styles.folderList}>
              <li className={styles.folderActive}>Inbox</li>
              <li className={styles.folder}>Starred</li>
              <li className={styles.folder}>Sent</li>
              <li className={styles.folder}>Drafts</li>
              <li className={styles.folder}>Trash</li>
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

              {senderExpanded && (
                <InteractiveTarget
                  targetId="report-phishing-btn"
                  label="Report this email as phishing"
                  onActivate={handleReport}
                  disabled={!interactive}
                >
                  <span className={styles.reportBtn}>🚩 Report phishing</span>
                </InteractiveTarget>
              )}
            </div>

            <div className={styles.emailHeader}>
              <div className={styles.senderRow}>
                <span className={`${styles.avatar} ${styles.decorative}`} aria-hidden="true">R</span>
                <div className={styles.senderMeta}>
                  <InteractiveTarget
                    targetId="sender-chip"
                    label="Expand sender details"
                    onActivate={handleSenderActivate}
                    disabled={!interactive}
                  >
                    <span className={styles.senderName}>Prof. R. Delgado</span>
                  </InteractiveTarget>
                  {senderExpanded && <span className={styles.senderFullAddress}>{FAKE_SENDER}</span>}
                  {showCallouts && (
                    <span className={styles.callout} data-pos="sender">
                      This domain isn't the university's real domain
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`${styles.subject} ${styles.decorative}`}>ASSIGNMENT — Submission for the Activity</h3>
            </div>

            <div className={`${styles.emailBody} ${styles.decorative}`}>
              <p>Dear Student,
                {showCallouts && (
                  <span className={styles.callout} data-pos="greeting">
                    A generic greeting — a real professor would use your name
                  </span>
                )}
              </p>
              <p>
                Our records show you have not submitted the required activity. Your submission is{' '}
                <strong>due today</strong> and late work will not be accepted.
                {showCallouts && (
                  <span className={styles.callout} data-pos="urgency">
                    A same-day deadline pressures you into acting without checking
                  </span>
                )}
              </p>
              <p>Please submit using the button below.</p>
            </div>

            <div className={styles.submitRow}>
              <div
                onMouseEnter={() => setHoveringSubmit(true)}
                onMouseLeave={() => setHoveringSubmit(false)}
                className={styles.submitHoverWrap}
              >
                <InteractiveTarget
                  targetId="submit-link"
                  label="Submit Assignment"
                  onActivate={() => handleChoice('submit-link')}
                  disabled={!interactive}
                >
                  <span className={styles.submitBtn}>Submit Assignment</span>
                </InteractiveTarget>
              </div>
              {showCallouts && (
                <span className={styles.callout} data-pos="link">
                  Says "Submit Assignment" but actually links to {REAL_LINK_DESTINATION}
                </span>
              )}
            </div>

            <ul className={`${styles.otherEmails} ${styles.decorative}`}>
              {OTHER_EMAILS.map((email) => (
                <li key={email.subject} className={styles.otherEmailRow}>
                  <span className={styles.otherEmailFrom}>{email.from}</span>
                  <span className={styles.otherEmailSubject}>{email.subject}</span>
                  <span className={styles.otherEmailTime}>{email.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {hoveringSubmit && (
          <div className={styles.statusBar}>{REAL_LINK_DESTINATION}</div>
        )}
      </BrowserChrome>
    </div>
  )
}
