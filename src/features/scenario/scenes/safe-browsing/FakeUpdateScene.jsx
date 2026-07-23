import React, { useState } from 'react'
import BrowserChrome from '../../frames/BrowserChrome'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './FakeUpdateScene.module.css'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * FakeUpdateScene — Module 4, Scenario 3
 * A legitimate-looking article page with a fake "update your browser"
 * banner rendered INSIDE the page, styled to imitate browser chrome.
 * The lesson is the boundary itself: real update prompts live in the
 * browser's own chrome (here, a genuine "browser-settings" target
 * behind BrowserChrome's own menu), never inside page content — so the
 * chrome/content seam is drawn deliberately visibly, with something for
 * the feedback callouts to point at.
 */
export default function FakeUpdateScene({ scenario, interactive, phase, onResolve }) {
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const showCallouts = phase === 'feedback'

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) {
      setMenuOpen(false)
      setSettingsOpen(false)
      onResolve(choiceId)
    }
  }

  function handleDismissBanner() {
    if (!interactive) return
    handleChoice('dismiss-and-continue')
  }

  function handleMenuToggle() {
    if (!interactive) return
    setMenuOpen((v) => !v)
    setSettingsOpen(false)
  }

  function handleSettingsToggle() {
    if (!interactive) return
    setSettingsOpen((v) => !v)
  }

  const chromeMenuSlot = (
    <div className={styles.chromeMenuWrap}>
      <InteractiveTarget targetId="browser-menu" label="Browser menu" onActivate={handleMenuToggle} disabled={!interactive}>
        <span className={styles.chromeMenuIcon} aria-hidden="true">⋮</span>
      </InteractiveTarget>

      {menuOpen && (
        <div className={styles.chromeMenu}>
          <InteractiveTarget targetId="menu-settings" label="Settings" onActivate={handleSettingsToggle} disabled={!interactive}>
            <span className={styles.menuItem}>⚙ Settings {settingsOpen ? '▾' : '▸'}</span>
          </InteractiveTarget>
          {settingsOpen && (
            <InteractiveTarget
              targetId="browser-settings"
              label="About this browser"
              onActivate={() => handleChoice('browser-settings')}
              disabled={!interactive}
            >
              <span className={styles.menuItemNested}>ℹ About</span>
            </InteractiveTarget>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.scene}>
      <BrowserChrome url="dailytech-news.com/articles/browser-security-2026" chromeMenuSlot={chromeMenuSlot}>
        <div className={styles.chromeBoundary}>
          {showCallouts && (
            <span className={styles.boundaryCallout}>
              Everything below this line is content the website controls — not your browser
            </span>
          )}
        </div>

        {!bannerDismissed && (
          <div className={styles.fakeBanner}>
            <span className={`${styles.bannerIcon} ${styles.decorative}`} aria-hidden="true">🔄</span>
            <span className={`${styles.bannerText} ${styles.decorative}`}>Your browser is outdated — click here to UPDATE</span>
            <InteractiveTarget
              targetId="update-banner"
              label="Update now"
              onActivate={() => handleChoice('update-banner')}
              disabled={!interactive}
            >
              <span className={styles.updateBtn}>UPDATE</span>
            </InteractiveTarget>
            <InteractiveTarget
              targetId="dismiss-banner"
              label="Dismiss this banner"
              onActivate={handleDismissBanner}
              disabled={!interactive}
              className={styles.dismissBtnWrap}
            >
              <span className={styles.dismissBtn} aria-hidden="true">✕</span>
            </InteractiveTarget>
          </div>
        )}
        {showCallouts && !bannerDismissed && (
          <span className={styles.bannerCallout}>
            A real update prompt appears in the browser's own chrome, above the line — not down here
          </span>
        )}

        <article className={`${styles.article} ${styles.decorative}`}>
          <h3 className={styles.articleTitle}>Staying Safe Online in 2026</h3>
          <p>
            Security researchers continue to emphasize the basics: unique passwords, cautious clicking, and keeping
            software updated through official channels.
          </p>
          <p>
            Most attacks rely on convincing a person to take one small action — not on breaking encryption or
            guessing a password directly.
          </p>
        </article>
      </BrowserChrome>
    </div>
  )
}
