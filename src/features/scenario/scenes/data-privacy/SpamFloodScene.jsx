import React, { useState } from 'react'
import PhoneFrame from '../../frames/PhoneFrame'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './SpamFloodScene.module.css'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

const NAV_ITEMS = [
  { id: 'inbox', icon: '💬', label: 'Messages' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

/**
 * SpamFloodScene — Module 5, Scenario 3
 * A messages app flooded with spam. Three real destinations: replying
 * STOP inside the spam thread (risky), blocking & reporting from the
 * thread's own more-options menu (free, local-only — narratively useful
 * but not itself required), and Settings, which holds both the safe
 * "Check accounts using this number" action and the risky "Change phone
 * number" shortcut.
 */
export default function SpamFloodScene({ scenario, interactive, onResolve }) {
  const [view, setView] = useState('inbox')
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [blockedAndReported, setBlockedAndReported] = useState(false)

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleNav(id) {
    if (!interactive) return
    setMoreMenuOpen(false)
    setView(id)
  }

  function handleOpenThread() {
    if (!interactive) return
    setMoreMenuOpen(false)
    setView('thread')
  }

  function handleMoreToggle() {
    if (!interactive) return
    setMoreMenuOpen((v) => !v)
  }

  function handleBlockAndReport() {
    if (!interactive || blockedAndReported) return
    setBlockedAndReported(true)
    setMoreMenuOpen(false)
    // Free, local-only — narratively useful, but does not resolve anything.
  }

  const navSlot = (
    <div className={styles.navRow}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === 'settings' ? view === 'settings' : view !== 'settings'
        return (
          <InteractiveTarget
            key={item.id}
            targetId={`nav-${item.id}`}
            label={item.label}
            onActivate={() => handleNav(item.id)}
            disabled={!interactive}
            className={styles.navItemWrap}
          >
            <span className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
              <span aria-hidden="true">{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </span>
          </InteractiveTarget>
        )
      })}
    </div>
  )

  return (
    <div className={styles.scene}>
      <PhoneFrame statusLabel="Messages" bottomNavSlot={navSlot}>
        {view === 'settings' && (
          <div className={styles.settings}>
            <div className={`${styles.settingsHeader} ${styles.decorative}`}>Settings</div>
            <ul className={styles.settingsList}>
              <InteractiveTarget
                targetId="check-accounts"
                label="Check accounts using this number"
                onActivate={() => handleChoice('block-and-report')}
                disabled={!interactive}
              >
                <li className={styles.settingsItem}>
                  <span className={styles.settingsItemTitle}>Check accounts using this number</span>
                  <span className={styles.settingsItemHint}>See where this number is registered</span>
                </li>
              </InteractiveTarget>
              <InteractiveTarget
                targetId="change-number"
                label="Change phone number"
                onActivate={() => handleChoice('change-number')}
                disabled={!interactive}
              >
                <li className={styles.settingsItem}>
                  <span className={styles.settingsItemTitle}>Change phone number</span>
                  <span className={styles.settingsItemHint}>Get a new number for this account</span>
                </li>
              </InteractiveTarget>
            </ul>
            {blockedAndReported && (
              <p className={`${styles.settingsNote} ${styles.decorative}`}>Spam number blocked and reported.</p>
            )}
          </div>
        )}

        {view === 'thread' && (
          <div className={styles.thread}>
            <div className={styles.threadHeader}>
              <InteractiveTarget targetId="thread-back" label="Back" onActivate={() => setView('inbox')} disabled={!interactive}>
                <span className={styles.backBtn} aria-hidden="true">←</span>
              </InteractiveTarget>
              <span className={`${styles.threadTitle} ${styles.decorative}`}>+63 917 000 1234</span>
            </div>
            <div className={styles.bubbleRow}>
              <div className={`${styles.bubble} ${styles.decorative}`}>
                🎉 You've been selected! Reply CLAIM to receive your ₱5,000 voucher, or STOP to unsubscribe.
              </div>
            </div>
            <div className={styles.quickReplies}>
              <InteractiveTarget
                targetId="reply-stop"
                label="Reply STOP"
                onActivate={() => handleChoice('reply-stop')}
                disabled={!interactive}
              >
                <span className={styles.quickReplyChip}>STOP</span>
              </InteractiveTarget>
            </div>
          </div>
        )}

        {view === 'inbox' && (
          <div className={styles.inbox}>
            <div className={`${styles.inboxHeader} ${styles.decorative}`}>Messages</div>

            <div className={styles.threadRow}>
              <InteractiveTarget
                targetId="open-thread"
                label="Open message from +63 917 000 1234"
                onActivate={handleOpenThread}
                disabled={!interactive}
                className={styles.threadRowMainWrap}
              >
                <div className={styles.threadRowMain}>
                  <span className={styles.avatar} aria-hidden="true">#</span>
                  <div className={styles.threadRowText}>
                    <span className={styles.threadRowSender}>
                      +63 917 000 1234
                      {blockedAndReported && <span className={styles.blockedTag}>Blocked</span>}
                    </span>
                    <span className={styles.threadRowPreview}>You've been selected! Reply CLAIM to receive...</span>
                  </div>
                </div>
              </InteractiveTarget>

              <InteractiveTarget
                targetId="thread-more"
                label="More options"
                onActivate={handleMoreToggle}
                disabled={!interactive}
                className={styles.moreBtnWrap}
              >
                <span className={styles.moreBtn} aria-hidden="true">⋯</span>
              </InteractiveTarget>

              {moreMenuOpen && (
                <div className={styles.moreMenu}>
                  <InteractiveTarget
                    targetId="block-and-report-action"
                    label="Block & report spam"
                    onActivate={handleBlockAndReport}
                    disabled={!interactive || blockedAndReported}
                  >
                    <span className={styles.moreMenuItem}>
                      {blockedAndReported ? 'Blocked & reported ✓' : 'Block & report spam'}
                    </span>
                  </InteractiveTarget>
                </div>
              )}
            </div>

            {['Your package could not be delivered...', 'Final notice: verify your account...'].map((preview) => (
              <div key={preview} className={`${styles.threadRow} ${styles.decorative}`}>
                <div className={styles.threadRowMain}>
                  <span className={styles.avatar} aria-hidden="true">#</span>
                  <div className={styles.threadRowText}>
                    <span className={styles.threadRowSender}>Unknown Sender</span>
                    <span className={styles.threadRowPreview}>{preview}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PhoneFrame>
    </div>
  )
}
