import React, { useState } from 'react'
import PhoneFrame from '../../frames/PhoneFrame'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './GiveawayPostScene.module.css'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * GiveawayPostScene — Module 5, Scenario 1
 * A social feed with one giveaway post. Three real elements: the JOIN
 * NOW link (risky), the account name — which opens a real profile view
 * showing how new/unverified the account is, itself the safe "checked
 * first" action — and the post's ⋯ menu, where "Not interested" is a
 * second, differently-reasoned safe path (ignoring without checking).
 */
export default function GiveawayPostScene({ scenario, interactive, onResolve }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleOpenProfile() {
    if (!interactive) return
    setProfileOpen(true)
    // Viewing the profile IS the "checked first" action itself.
    handleChoice('account-name')
  }

  function handleMoreToggle() {
    if (!interactive) return
    setMoreMenuOpen((v) => !v)
  }

  if (profileOpen) {
    return (
      <PhoneFrame>
        <div className={styles.profileView}>
          <button type="button" className={styles.backBtn} onClick={() => setProfileOpen(false)}>
            ← Back
          </button>
          <div className={`${styles.profileHeader} ${styles.decorative}`}>
            <span className={styles.profileAvatar} aria-hidden="true">R</span>
            <span className={styles.profileName}>Reminder-78</span>
            <span className={styles.noBadge}>No verification badge</span>
          </div>
          <ul className={`${styles.profileStats} ${styles.decorative}`}>
            <li>Account created <strong>6 days ago</strong></li>
            <li><strong>2</strong> posts total</li>
            <li>Comments <strong>disabled</strong> on all posts</li>
          </ul>
        </div>
      </PhoneFrame>
    )
  }

  return (
    <div className={styles.scene}>
      <PhoneFrame>
        <div className={`${styles.feedHeader} ${styles.decorative}`}>ConnectHub</div>

        <div className={styles.post}>
          <div className={styles.postHeader}>
            <span className={`${styles.avatar} ${styles.decorative}`} aria-hidden="true">R</span>
            <InteractiveTarget
              targetId="account-name"
              label="View Reminder-78's profile"
              onActivate={handleOpenProfile}
              disabled={!interactive}
            >
              <span className={styles.accountName}>Reminder-78</span>
            </InteractiveTarget>
            <span className={`${styles.postTime} ${styles.decorative}`}>2h</span>

            <InteractiveTarget
              targetId="post-more"
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
                  targetId="dismiss-post"
                  label="Not interested"
                  onActivate={() => handleChoice('dismiss-post')}
                  disabled={!interactive}
                >
                  <span className={styles.moreMenuItem}>Not interested</span>
                </InteractiveTarget>
              </div>
            )}
          </div>

          <p className={`${styles.postText} ${styles.decorative}`}>
            🎉 <strong>GIVEAWAY — ₱5,000 voucher!</strong> Join now, winners announced this week.
          </p>

          <div className={`${styles.postBanner} ${styles.decorative}`}>₱5,000</div>

          <InteractiveTarget
            targetId="join-link"
            label="Join Now"
            onActivate={() => handleChoice('join-link')}
            disabled={!interactive}
            className={styles.joinBtnWrap}
          >
            <span className={styles.joinBtn}>JOIN NOW</span>
          </InteractiveTarget>

          <div className={`${styles.reactionRow} ${styles.decorative}`}>
            <span>👍 Like</span>
            <span>💬 Comment</span>
            <span>↗ Share</span>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
