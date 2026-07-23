import React, { useState } from 'react'
import PhoneFrame from '../../frames/PhoneFrame'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './FriendRequestScene.module.css'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * FriendRequestScene — Module 6, Scenario 1
 * A notifications screen with one friend request. Opening the profile
 * never resolves by itself — it's a free inspection, same as Module 4's
 * view-cert — but it leaves a mark: once it's been opened, the request
 * card's own Confirm control becomes "Confirm anyway" and resolves to a
 * different choice than confirming without ever having looked.
 */
export default function FriendRequestScene({ scenario, interactive, onResolve }) {
  const [view, setView] = useState('notifications')
  const [hasInspected, setHasInspected] = useState(false)

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleOpenProfile() {
    if (!interactive) return
    setView('profile')
  }

  function handleBack() {
    if (!interactive) return
    setHasInspected(true)
    setView('notifications')
  }

  function handleDeleteRequest() {
    handleChoice('inspect-profile')
  }

  function handleConfirm() {
    handleChoice(hasInspected ? 'confirm-anyway' : 'confirm-request')
  }

  if (view === 'profile') {
    return (
      <PhoneFrame statusLabel="ConnectHub">
        <div className={styles.profileView}>
          <InteractiveTarget targetId="profile-back" label="Back" onActivate={handleBack} disabled={!interactive}>
            <span className={styles.backBtn} aria-hidden="true">← Back</span>
          </InteractiveTarget>

          <div className={`${styles.profileHeader} ${styles.decorative}`}>
            <span className={styles.profileAvatar} aria-hidden="true">A</span>
            <span className={styles.profileName}>Angel_Reyes04</span>
          </div>

          <ul className={`${styles.profileStats} ${styles.decorative}`}>
            <li><strong>0</strong> mutual friends</li>
            <li>Account created <strong>2 weeks ago</strong></li>
            <li><strong>3</strong> posts total</li>
            <li>These photos appear on other profiles under different names</li>
          </ul>

          <InteractiveTarget
            targetId="inspect-profile"
            label="Delete request"
            onActivate={handleDeleteRequest}
            disabled={!interactive}
            className={styles.deleteBtnWrap}
          >
            <span className={styles.deleteBtn}>Delete request</span>
          </InteractiveTarget>
        </div>
      </PhoneFrame>
    )
  }

  return (
    <div className={styles.scene}>
      <PhoneFrame statusLabel="ConnectHub">
        <div className={`${styles.notifHeader} ${styles.decorative}`}>Friend Requests</div>

        <div className={styles.requestCard}>
          <span className={`${styles.avatar} ${styles.decorative}`} aria-hidden="true">A</span>
          <div className={styles.requestBody}>
            <InteractiveTarget
              targetId="open-profile"
              label="View Angel_Reyes04's profile"
              onActivate={handleOpenProfile}
              disabled={!interactive}
            >
              <span className={styles.requestName}>Angel_Reyes04</span>
            </InteractiveTarget>
            <span className={`${styles.requestMeta} ${styles.decorative}`}>wants to be friends</span>

            <InteractiveTarget
              targetId={hasInspected ? 'confirm-anyway' : 'confirm-request'}
              label={hasInspected ? 'Confirm anyway' : 'Confirm'}
              onActivate={handleConfirm}
              disabled={!interactive}
              className={styles.confirmBtnWrap}
            >
              <span className={styles.confirmBtn}>{hasInspected ? 'Confirm anyway' : 'Confirm'}</span>
            </InteractiveTarget>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
