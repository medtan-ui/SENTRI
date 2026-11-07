import React from 'react'
import PhoneFrame from '../../frames/PhoneFrame'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './ChatEscalationScene.module.css'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenarioChoiceId
}

const PRIOR_MESSAGES = [
  { from: 'them', text: "What's up dude, nice to meet you! I go to the same university you're going to." },
  { from: 'me', text: "Oh really? Nice to meet you too dude!" },
]

/**
 * ChatEscalationScene — Module 6, Scenario 2 (consequence scenario)
 * A chat thread with an online contact named Jamie. The incoming message
 * asks for a live location and suggests meeting today. Three real
 * elements: two quick-reply chips above the (decorative) keyboard, and a
 * ← back control that closes the chat without replying.
 */
export default function ChatEscalationScene({ scenario, interactive, onResolve }) {
  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  return (
    <div className={styles.scene}>
      <PhoneFrame statusLabel="Messages">
        <div className={styles.thread}>
          <div className={styles.threadHeader}>
            <InteractiveTarget targetId="leave-on-read" label="Back" onActivate={() => handleChoice('leave-on-read')} disabled={!interactive}>
              <span className={styles.backBtn} aria-hidden="true">←</span>
            </InteractiveTarget>
            <span className={`${styles.threadTitle} ${styles.decorative}`}>Jamie</span>
          </div>

          <div className={`${styles.messages} ${styles.decorative}`}>
            {PRIOR_MESSAGES.map((m, i) => (
              <div key={i} className={m.from === 'me' ? styles.bubbleRowSent : styles.bubbleRowReceived}>
                <div className={m.from === 'me' ? styles.bubbleSent : styles.bubbleReceived}>{m.text}</div>
              </div>
            ))}
            <div className={styles.bubbleRowReceived}>
              <div className={styles.bubbleReceived}>
                why don't we meet up today? send me your location so we can link up 😊
              </div>
            </div>
          </div>

          <div className={styles.quickReplies}>
            <InteractiveTarget
              targetId="agree-to-meet"
              label='Reply "Sure, here is my location — see you there"'
              onActivate={() => handleChoice('agree-to-meet')}
              disabled={!interactive}
            >
              <span className={styles.quickReplyChip}>Sure, here's my location — see you there</span>
            </InteractiveTarget>
            <InteractiveTarget
              targetId="suggest-public"
              label={`Reply "Let's meet at the student mall instead — I'll bring a friend"`}
              onActivate={() => handleChoice('suggest-public')}
              disabled={!interactive}
            >
              <span className={styles.quickReplyChip}>Let's meet at the student mall instead — I'll bring a friend</span>
            </InteractiveTarget>
          </div>

          <div className={`${styles.inputBar} ${styles.decorative}`}>
            <span className={styles.inputPlaceholder}>Message…</span>
            <span className={styles.sendIcon} aria-hidden="true">➤</span>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
