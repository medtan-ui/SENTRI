import React, { useEffect, useRef, useState } from 'react'
import Icon from '../../../../components/Icon/Icon'
import BrowserChrome from '../../frames/BrowserChrome'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './InboxScene.module.css'

const REAL_LINK_DESTINATION = 'classdeck-submit.net/login'
const FAKE_SENDER = 'no-reply@classdeck-submit.net'
const REAL_LMS_DOMAIN = 'classdeck.edu.ph'
const REPLY_DELAY_MS = 1500

const OTHER_EMAILS = [
  { from: 'Career Center', subject: 'Internship fair next week', time: '9:14 AM' },
  { from: 'Library Services', subject: 'Your hold is ready for pickup', time: 'Yesterday' },
  { from: 'Student Council', subject: 'Vote for this term’s officers', time: 'Yesterday' },
  { from: 'IT Helpdesk', subject: 'Scheduled maintenance this weekend', time: '2 days ago' },
]

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenarioChoiceId
}

/**
 * InboxScene — Module 2, Scenario 1
 * The storyboard beat: a ClassDeck notification lands in Campus Mail
 * saying an activity is waiting to be submitted, and the student decides
 * between the link and checking with the person it claims to be from.
 *
 * Three real elements map to choices: the Submit Activity button (risky),
 * Reply in the toolbar (risky), and Campus Chat (safe) — a deliberate
 * two-step, because verifying is two steps in life too: open the channel
 * you already trust, then actually ask. Clicking the chat tab only opens
 * the thread; sending the question is what resolves the scenario, and the
 * instructor's answer lands before the feedback panel does, so the
 * student reads the "I didn't post any activity" for themselves.
 *
 * Free information that costs nothing either way: the sender name expands
 * to its real address, and hovering the Submit button (not clicking it)
 * shows the real destination in a status bar.
 */
export default function InboxScene({ scenario, interactive, phase, onResolve }) {
  const [senderExpanded, setSenderExpanded] = useState(false)
  const [hoveringSubmit, setHoveringSubmit] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [asked, setAsked] = useState(false)
  const replyTimer = useRef(null)
  const showCallouts = phase === 'feedback'

  useEffect(() => () => clearTimeout(replyTimer.current), [])

  function handleChoice(targetName) {
    if (!interactive || asked) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleSenderActivate() {
    if (!interactive) return
    setSenderExpanded(true)
  }

  function handleChatOpen() {
    if (!interactive) return
    setChatOpen(true)
  }

  /** Send the question, let the answer land, then resolve. */
  function handleAsk() {
    if (!interactive || asked) return
    setAsked(true)
    replyTimer.current = setTimeout(() => {
      const choiceId = findChoiceId(scenario, 'ask-instructor')
      if (choiceId) onResolve(choiceId)
    }, REPLY_DELAY_MS)
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
              <span className={`${styles.toolbarIcon} ${styles.decorative}`} aria-hidden="true">
                <Icon name="book" size={14} />
              </span>
              <span className={`${styles.toolbarIcon} ${styles.decorative}`} aria-hidden="true">
                <Icon name="star" size={14} />
              </span>
              <InteractiveTarget
                targetId="reply-btn"
                label="Reply to this email"
                onActivate={() => handleChoice('reply-btn')}
                disabled={!interactive || asked}
              >
                <span className={styles.toolbarBtn}>Reply</span>
              </InteractiveTarget>

              <InteractiveTarget
                targetId="ask-instructor"
                label="Open Campus Chat"
                onActivate={handleChatOpen}
                disabled={!interactive || asked}
              >
                <span className={styles.chatTab}>
                  <Icon name="users" size={13} />
                  Campus Chat
                </span>
              </InteractiveTarget>
            </div>

            <div className={styles.emailHeader}>
              <div className={styles.senderRow}>
                <span className={`${styles.avatar} ${styles.decorative}`} aria-hidden="true">CD</span>
                <div className={styles.senderMeta}>
                  <InteractiveTarget
                    targetId="sender-chip"
                    label="Expand sender details"
                    onActivate={handleSenderActivate}
                    disabled={!interactive || asked}
                  >
                    <span className={styles.senderName}>ClassDeck</span>
                  </InteractiveTarget>
                  <span className={`${styles.onBehalf} ${styles.decorative}`}>
                    on behalf of Prof. J. Reyes
                  </span>
                  {senderExpanded && <span className={styles.senderFullAddress}>{FAKE_SENDER}</span>}
                  {showCallouts && (
                    <span className={styles.callout} data-pos="sender">
                      ClassDeck sends from {REAL_LMS_DOMAIN}, not this address
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`${styles.subject} ${styles.decorative}`}>
                ASSIGNMENT — Submission for the Activity (IT1S1)
              </h3>
            </div>

            <div className={`${styles.emailBody} ${styles.decorative}`}>
              <p>Submit your activity here.</p>
              <p className={styles.dueLine}>
                Due: No date
                {showCallouts && (
                  <span className={styles.callout} data-pos="greeting">
                    A real posting carries a real deadline
                  </span>
                )}
              </p>
            </div>

            <div className={styles.submitRow}>
              <div
                onMouseEnter={() => setHoveringSubmit(true)}
                onMouseLeave={() => setHoveringSubmit(false)}
                className={styles.submitHoverWrap}
              >
                <InteractiveTarget
                  targetId="submit-link"
                  label="Submit Activity"
                  onActivate={() => handleChoice('submit-link')}
                  disabled={!interactive || asked}
                >
                  <span className={styles.submitBtn}>Submit Activity</span>
                </InteractiveTarget>
              </div>
              {showCallouts && (
                <span className={styles.callout} data-pos="link">
                  Says Submit Activity, but the link goes to {REAL_LINK_DESTINATION}
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

          {chatOpen && (
            <div className={styles.chatPanel} role="group" aria-label="Campus Chat with Prof. J. Reyes">
              <div className={styles.chatHeader}>
                <span className={styles.chatAvatar} aria-hidden="true">JR</span>
                <span className={styles.chatName}>Prof. J. Reyes</span>
              </div>

              <div className={styles.chatThread}>
                <p className={`${styles.chatIn} ${styles.decorative}`}>
                  Reminder, the quiz is still on Friday.
                </p>

                {asked ? (
                  <>
                    <p className={styles.chatOut}>Sir, did you post an activity for us earlier?</p>
                    <p className={styles.chatIn}>No, I didn't post any activity for you guys.</p>
                  </>
                ) : (
                  <div className={styles.chatComposer}>
                    <span className={styles.chatDraft}>
                      Sir, did you post an activity for us earlier?
                    </span>
                    <InteractiveTarget
                      targetId="chat-send"
                      label="Send the question to Prof. J. Reyes"
                      onActivate={handleAsk}
                      disabled={!interactive}
                    >
                      <span className={styles.chatSend}>Send</span>
                    </InteractiveTarget>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {hoveringSubmit && <div className={styles.statusBar}>{REAL_LINK_DESTINATION}</div>}
      </BrowserChrome>
    </div>
  )
}
