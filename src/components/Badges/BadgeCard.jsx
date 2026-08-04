import React from 'react'
import './BadgeCard.css'

export const ALL_BADGE_CATALOG = [
  {
    id: 'FIRST_DEFENDER',
    title: 'First Defender',
    description: 'Completed a simulation scenario without making any risky choices.',
    category: 'Scenario',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    id: 'PHISHING_SENTINEL',
    title: 'Phishing Sentinel',
    description: 'Achieved a perfect 100% score on the Phishing Awareness Quiz.',
    category: 'Quiz',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
        <polyline points="16,19 19,16" />
      </svg>
    ),
  },
  {
    id: 'PERFECT_GAIN',
    title: 'Perfect Gain',
    description: 'Closed 100% of the knowledge gap (g = 1.0) on a module post-test.',
    category: 'Post-Test',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    id: 'STREAK_HERO',
    title: 'Streak Hero',
    description: 'Successfully completed 3 cybersecurity training modules.',
    category: 'Milestone',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
      </svg>
    ),
  },
  {
    id: 'SENTRI_MASTER',
    title: 'SENTRI Master',
    description: 'Completed all six cybersecurity awareness modules.',
    category: 'Mastery',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
]

export default function BadgeCard({ badge, isUnlocked = false, unlockedAt = null }) {
  const catalogItem = ALL_BADGE_CATALOG.find((b) => b.id === (badge.id || badge)) || badge

  return (
    <div className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`} tabIndex={0}>
      <div className="badge-icon-wrapper">
        {catalogItem.icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
      </div>
      <div className="badge-info">
        <div className="badge-header">
          <h4 className="badge-title">{catalogItem.title || badge.title}</h4>
          <span className="badge-category-tag">{catalogItem.category || badge.category}</span>
        </div>
        <p className="badge-description">{catalogItem.description || badge.description}</p>
        {isUnlocked ? (
          <div className="badge-status unlocked-status">
            ✓ Unlocked {unlockedAt ? new Date(unlockedAt).toLocaleDateString() : ''}
          </div>
        ) : (
          <div className="badge-status locked-status">🔒 Locked</div>
        )}
      </div>
    </div>
  )
}
