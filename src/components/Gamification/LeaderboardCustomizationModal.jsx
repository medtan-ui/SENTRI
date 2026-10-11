import React, { useMemo, useState } from 'react'
import Modal from '../Modal/Modal'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import {
  MAX_SHOWCASE_BADGES,
  getDefaultShowcaseBadges,
  resolveBadge,
  saveLeaderboardCustomization,
} from '../../services/showcaseBadgeService'
import styles from './LeaderboardCustomizationModal.module.css'

const MOTTO_SUGGESTIONS = [
  'Cyber Defender',
  'Threat Hunter',
  'Phishing Specialist',
  'Zero-Day Scout',
  'Shield Vanguard',
]

/**
 * LeaderboardCustomizationModal
 * Allows a student to customize their presence on the leaderboard:
 * 1. Badge Display Showcase (3 slots): Select up to 3 unlocked badges to showcase.
 * 2. Trainee Motto / Title: An optional personal flair line displayed next to their name.
 */
export default function LeaderboardCustomizationModal({
  open,
  onClose,
  userId,
  earnedBadgeIds = [],
  catalog = [],
  initialCustomization = { badgeIds: [], title: '' },
  onSave,
}) {
  const [selectedBadgeIds, setSelectedBadgeIds] = useState(
    initialCustomization?.badgeIds ? [...initialCustomization.badgeIds].slice(0, MAX_SHOWCASE_BADGES) : [],
  )
  const [motto, setMotto] = useState(initialCustomization?.title || '')
  const [searchQuery, setSearchQuery] = useState('')

  // Earned badge objects
  const earnedBadges = useMemo(() => {
    return earnedBadgeIds.map((id) => resolveBadge(id, catalog))
  }, [earnedBadgeIds, catalog])

  // Filtered earned badges for the catalog list
  const filteredBadges = useMemo(() => {
    if (!searchQuery.trim()) return earnedBadges
    const q = searchQuery.toLowerCase().trim()
    return earnedBadges.filter(
      (b) => b.name.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q),
    )
  }, [earnedBadges, searchQuery])

  // Toggle or assign badge into slots
  const handleToggleBadge = (badgeId) => {
    if (selectedBadgeIds.includes(badgeId)) {
      // Remove badge
      setSelectedBadgeIds(selectedBadgeIds.filter((id) => id !== badgeId))
    } else {
      // Add badge if room
      if (selectedBadgeIds.length < MAX_SHOWCASE_BADGES) {
        setSelectedBadgeIds([...selectedBadgeIds, badgeId])
      } else {
        // If 3 already filled, replace the last slot
        setSelectedBadgeIds([...selectedBadgeIds.slice(0, MAX_SHOWCASE_BADGES - 1), badgeId])
      }
    }
  }

  const handleRemoveSlot = (index) => {
    setSelectedBadgeIds(selectedBadgeIds.filter((_, i) => i !== index))
  }

  const handleAutoSelectBest = () => {
    const best = getDefaultShowcaseBadges(earnedBadgeIds, catalog)
    setSelectedBadgeIds(best)
  }

  const handleClear = () => {
    setSelectedBadgeIds([])
  }

  const handleSave = () => {
    const updated = {
      badgeIds: selectedBadgeIds.slice(0, MAX_SHOWCASE_BADGES),
      title: motto.trim(),
    }
    saveLeaderboardCustomization(userId, updated)
    onSave?.(updated)
    onClose?.()
  }

  // 3 fixed showcase slots
  const slots = Array.from({ length: MAX_SHOWCASE_BADGES }, (_, i) => {
    const badgeId = selectedBadgeIds[i]
    return badgeId ? resolveBadge(badgeId, catalog) : null
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize Leaderboard Profile"
      size="lg"
      footer={
        <div className={styles.footerWrap}>
          <div className={styles.footerLeft}>
            <Button variant="ghost" size="sm" onClick={handleAutoSelectBest} disabled={earnedBadgeIds.length === 0}>
              Auto-Pick Best
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={selectedBadgeIds.length === 0}>
              Clear
            </Button>
          </div>
          <div className={styles.footerRight}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.container}>
        {/* ── Active Showcase (3 Slots) ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <Icon name="star" size={16} /> Featured Badges Showcase
            </span>
            <span className={styles.counterPill}>
              {selectedBadgeIds.length} of {MAX_SHOWCASE_BADGES} equipped
            </span>
          </div>
          <p className={styles.sectionDesc}>
            Select up to 3 badges from your achievements to feature on your leaderboard card and standing row.
          </p>

          <div className={styles.slotsGrid}>
            {slots.map((badge, idx) => {
              if (badge) {
                return (
                  <div
                    key={badge.id}
                    className={`${styles.slotCard} ${styles.slotCardFilled}`}
                    data-tier={badge.tier}
                  >
                    <span className={styles.slotBadgeNumber}>Slot {idx + 1}</span>
                    <button
                      type="button"
                      className={styles.slotRemoveBtn}
                      onClick={() => handleRemoveSlot(idx)}
                      aria-label={`Remove ${badge.name} from slot ${idx + 1}`}
                      title="Remove from showcase"
                    >
                      ✕
                    </button>
                    <span className={styles.disc} data-tier={badge.tier} aria-hidden="true">
                      <Icon name={badge.icon} size={20} />
                    </span>
                    <span className={styles.slotBadgeName}>{badge.name}</span>
                    <span className={styles.tierPill} data-tier={badge.tier}>
                      {badge.tier}
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={`empty-${idx}`}
                  className={`${styles.slotCard} ${styles.slotCardEmpty}`}
                  onClick={() => {
                    // Quick focus/hint
                  }}
                >
                  <span className={styles.slotBadgeNumber}>Slot {idx + 1}</span>
                  <div className={styles.slotEmptyIcon}>+</div>
                  <span className={styles.slotEmptyLabel}>Empty Slot</span>
                  <span className={styles.slotEmptyHint}>Click an earned badge below</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Custom Motto / Flair ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <Icon name="target" size={16} /> Trainee Title / Motto
            </span>
            <span className={styles.counterPill}>{motto.length}/40</span>
          </div>
          <p className={styles.sectionDesc}>
            Display a personalized cybersecurity title alongside your name on the leaderboard.
          </p>
          <div className={styles.mottoBox}>
            <div className={styles.mottoInputWrap}>
              <input
                type="text"
                className={styles.mottoInput}
                placeholder="e.g. Cyber Defender, Bug Bounty Hunter..."
                value={motto}
                maxLength={40}
                onChange={(e) => setMotto(e.target.value)}
              />
              <span className={styles.mottoCharCount}>{40 - motto.length}</span>
            </div>
            <div className={styles.quickPillsRow}>
              <span className={styles.quickPillsLabel}>Quick suggestions:</span>
              {MOTTO_SUGGESTIONS.map((text) => (
                <button
                  key={text}
                  type="button"
                  className={styles.quickPillBtn}
                  onClick={() => setMotto(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Earned Badges Selection ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <Icon name="trophy" size={16} /> Choose From Your Badges ({earnedBadgeIds.length})
            </span>
          </div>

          {earnedBadges.length > 5 && (
            <div className={styles.searchRow}>
              <span className={styles.searchIcon}>
                <Icon name="eye" size={15} />
              </span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search your unlocked badges…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {earnedBadges.length === 0 ? (
            <div className={styles.emptyBadgesMsg}>
              <p>You haven't unlocked any badges yet.</p>
              <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                Complete lessons, simulations, and quizzes in your training modules to earn achievement badges.
              </p>
            </div>
          ) : filteredBadges.length === 0 ? (
            <div className={styles.emptyBadgesMsg}>
              <p>No badges matched "{searchQuery}".</p>
            </div>
          ) : (
            <div className={styles.badgeCatalogGrid}>
              {filteredBadges.map((badge) => {
                const isSelected = selectedBadgeIds.includes(badge.id)
                const slotIndex = selectedBadgeIds.indexOf(badge.id)

                return (
                  <div
                    key={badge.id}
                    className={styles.badgeSelectCard}
                    data-selected={isSelected}
                    onClick={() => handleToggleBadge(badge.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleToggleBadge(badge.id)
                      }
                    }}
                  >
                    <span className={styles.disc} data-tier={badge.tier} aria-hidden="true">
                      <Icon name={badge.icon} size={18} />
                    </span>
                    <div className={styles.badgeCardInfo}>
                      <p className={styles.badgeCardTitle}>{badge.name}</p>
                      <p className={styles.badgeCardDesc}>{badge.description}</p>
                    </div>
                    {isSelected && (
                      <span className={styles.badgeEquippedTag}>Slot {slotIndex + 1} ✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
