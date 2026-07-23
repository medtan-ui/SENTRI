import React, { useState } from 'react'
import PhoneFrame from '../../frames/PhoneFrame'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './ReportAndBlockScene.module.css'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * ReportAndBlockScene — Module 6, Scenario 3
 * The same profile, afterwards. Screenshot (a quick-actions control,
 * separate from the ⋯ menu) and Block are both free, local-only actions
 * — neither resolves anything. Only Report account resolves the safe
 * path. Blocking before screenshotting isn't prevented — the spec asks
 * that it stay reachable — but the conversation preview goes dark the
 * moment it happens, live, while the student can still see and undo
 * nothing about it. That's the "name what was lost" requirement,
 * satisfied through the scene itself rather than a second static
 * config choice, since FeedbackPanel can only ever show one.
 */
export default function ReportAndBlockScene({ scenario, interactive, onResolve }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [screenshotted, setScreenshotted] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [comment, setComment] = useState('')

  const lostAccess = blocked && !screenshotted

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  function handleScreenshot() {
    if (!interactive || lostAccess) return
    setScreenshotted(true)
  }

  function handleMenuToggle() {
    if (!interactive) return
    setMenuOpen((v) => !v)
  }

  function handleBlock() {
    if (!interactive) return
    setBlocked(true)
    setMenuOpen(false)
  }

  function handleReport() {
    setMenuOpen(false)
    handleChoice('preserve-block-report')
  }

  function handlePostComment() {
    if (!interactive) return
    handleChoice('public-callout')
  }

  return (
    <div className={styles.scene}>
      <PhoneFrame statusLabel="ConnectHub">
        <div className={styles.quickActionsBar}>
          <InteractiveTarget
            targetId="take-screenshot"
            label="Take a screenshot"
            onActivate={handleScreenshot}
            disabled={!interactive || lostAccess}
          >
            <span className={styles.screenshotPill}>
              {screenshotted ? '📸 Saved ✓' : '📸 Screenshot'}
            </span>
          </InteractiveTarget>
        </div>

        <div className={styles.header}>
          <InteractiveTarget targetId="do-nothing" label="Back" onActivate={() => handleChoice('do-nothing')} disabled={!interactive}>
            <span className={styles.backBtn} aria-hidden="true">←</span>
          </InteractiveTarget>
          <span className={`${styles.headerTitle} ${styles.decorative}`}>Angel_Reyes04</span>

          <InteractiveTarget
            targetId="profile-more"
            label="More options"
            onActivate={handleMenuToggle}
            disabled={!interactive}
            className={styles.moreBtnWrap}
          >
            <span className={styles.moreBtn} aria-hidden="true">⋯</span>
          </InteractiveTarget>

          {menuOpen && (
            <div className={styles.moreMenu}>
              <InteractiveTarget
                targetId="block-account"
                label="Block this account"
                onActivate={handleBlock}
                disabled={!interactive || blocked}
              >
                <span className={styles.moreMenuItem}>{blocked ? 'Blocked ✓' : 'Block'}</span>
              </InteractiveTarget>
              <InteractiveTarget targetId="report-account" label="Report this account" onActivate={handleReport} disabled={!interactive}>
                <span className={styles.moreMenuItem}>Report account</span>
              </InteractiveTarget>
            </div>
          )}
        </div>

        {lostAccess && (
          <p className={styles.warningBanner}>
            You blocked before saving anything — you can no longer screenshot this conversation as evidence.
          </p>
        )}

        <div className={styles.body}>
          <div className={`${styles.profileHeader} ${styles.decorative}`}>
            <span className={styles.profileAvatar} aria-hidden="true">A</span>
            <span className={styles.profileMeta}>0 mutual friends · joined 2 weeks ago</span>
          </div>

          <p className={`${styles.sectionLabel} ${styles.decorative}`}>Conversation</p>
          {lostAccess ? (
            <p className={`${styles.unavailableBox} ${styles.decorative}`}>Conversation no longer available.</p>
          ) : (
            <div className={`${styles.conversationPreview} ${styles.decorative}`}>
              "...quiet spot behind the old gym near campus, less crowded there 😊"
            </div>
          )}

          <p className={`${styles.sectionLabel} ${styles.decorative}`}>Add a public comment</p>
          <InteractiveTarget targetId="public-comment-input" label="Public comment">
            <input
              className={styles.commentInput}
              value={comment}
              onChange={(e) => (interactive ? setComment(e.target.value) : null)}
              disabled={!interactive}
              placeholder="Write a comment..."
            />
          </InteractiveTarget>
          <InteractiveTarget
            targetId="public-callout"
            label="Post public comment"
            onActivate={handlePostComment}
            disabled={!interactive}
            className={styles.postBtnWrap}
          >
            <span className={styles.postBtn}>Post</span>
          </InteractiveTarget>
        </div>
      </PhoneFrame>
    </div>
  )
}
