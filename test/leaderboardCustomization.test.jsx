import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import StudentLeaderboardPage from '../src/pages/Student/Leaderboard/StudentLeaderboardPage'
import LeaderboardCustomizationModal from '../src/components/Gamification/LeaderboardCustomizationModal'
import {
  getLeaderboardCustomization,
  saveLeaderboardCustomization,
  resolveBadge,
  getDefaultShowcaseBadges,
  MAX_SHOWCASE_BADGES,
} from '../src/services/showcaseBadgeService'

const mockCatalog = [
  { id: 'first-steps', name: 'First Steps', description: 'Finish your first lesson.', icon: 'book', tier: 'bronze' },
  { id: 'field-ready', name: 'Field Ready', description: 'Clear your first scenario.', icon: 'shield', tier: 'bronze' },
  { id: 'clean-sheet', name: 'Clean Sheet', description: 'Finish with 0 risky clicks.', icon: 'shield', tier: 'silver' },
  { id: 'flawless', name: 'Flawless', description: 'Get a perfect quiz score.', icon: 'star', tier: 'gold' },
  { id: 'full-sweep', name: 'Full Sweep', description: 'Complete every module.', icon: 'trophy', tier: 'gold' },
]

const mockGamification = {
  points: 600,
  level: 4,
  rankName: 'Specialist',
  rankFloor: 550,
  nextRankAt: 850,
  nextRankName: 'Sentinel',
  badges: ['first-steps', 'clean-sheet', 'flawless'],
  currentStreak: 5,
}

const mockLeaderboard = {
  totalRanked: 15,
  entries: [
    { userId: 'u1', displayName: 'Elena', points: 900, level: 5, rankName: 'Sentinel', currentStreak: 7, badgeCount: 6, rank: 1, isYou: false },
    { userId: 'student-test', displayName: 'Alex', points: 600, level: 4, rankName: 'Specialist', currentStreak: 5, badgeCount: 3, rank: 2, isYou: true },
    { userId: 'u3', displayName: 'Marcus', points: 450, level: 3, rankName: 'Analyst', currentStreak: 2, badgeCount: 2, rank: 3, isYou: false },
  ],
  you: { userId: 'student-test', displayName: 'Alex', points: 600, level: 4, rankName: 'Specialist', currentStreak: 5, badgeCount: 3, rank: 2, isYou: true },
}

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'student-test', role: 'student', nickname: 'Alex', displayName: 'Alex Cruz', emailVerified: true },
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}))

vi.mock('../src/context/GamificationContext', () => ({
  useGamificationState: () => ({
    status: 'success',
    errorMessage: '',
    gamification: mockGamification,
    catalog: mockCatalog,
    refresh: vi.fn(),
  }),
  GamificationProvider: ({ children }) => children,
}))

vi.mock('../src/hooks/useGamification', () => ({
  useGamification: () => ({
    status: 'success',
    errorMessage: '',
    gamification: mockGamification,
    catalog: mockCatalog,
    retry: vi.fn(),
  }),
}))

vi.mock('../src/services/gamificationService', () => ({
  getLeaderboard: vi.fn(async () => mockLeaderboard),
  getMyGamification: vi.fn(async () => ({ gamification: mockGamification, catalog: { badges: mockCatalog } })),
  recordDailyVisit: vi.fn(async () => mockGamification),
}))

describe('showcaseBadgeService', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('resolves catalog and fallback badges', () => {
    const badge = resolveBadge('flawless', mockCatalog)
    expect(badge.name).toBe('Flawless')
    expect(badge.tier).toBe('gold')

    const fallback = resolveBadge('mastery', [])
    expect(fallback.name).toBe('Mastery')
    expect(fallback.tier).toBe('gold')
  })

  it('prioritizes higher tiers (gold > silver > bronze) in default showcase', () => {
    const earned = ['first-steps', 'clean-sheet', 'flawless']
    const defaults = getDefaultShowcaseBadges(earned, mockCatalog)
    expect(defaults).toEqual(['flawless', 'clean-sheet', 'first-steps'])
  })

  it('caps default showcase at MAX_SHOWCASE_BADGES (3)', () => {
    const earned = ['first-steps', 'field-ready', 'clean-sheet', 'flawless', 'full-sweep']
    const defaults = getDefaultShowcaseBadges(earned, mockCatalog)
    expect(defaults.length).toBe(MAX_SHOWCASE_BADGES)
    expect(defaults).toContain('flawless')
    expect(defaults).toContain('full-sweep')
  })

  it('persists and restores custom badges and title in localStorage', () => {
    const custom = {
      badgeIds: ['first-steps', 'flawless'],
      title: 'Shield Guardian',
    }
    saveLeaderboardCustomization('student-test', custom)

    const loaded = getLeaderboardCustomization('student-test', ['first-steps', 'flawless'], mockCatalog)
    expect(loaded.badgeIds).toEqual(['first-steps', 'flawless'])
    expect(loaded.title).toBe('Shield Guardian')
  })
})

describe('LeaderboardCustomizationModal', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders 3 showcase slots and unlocked badges', () => {
    render(
      <LeaderboardCustomizationModal
        open={true}
        onClose={vi.fn()}
        userId="student-test"
        earnedBadgeIds={['first-steps', 'flawless']}
        catalog={mockCatalog}
        initialCustomization={{ badgeIds: ['first-steps'], title: 'Cyber Defender' }}
        onSave={vi.fn()}
      />,
    )

    expect(screen.getByText('Customize Leaderboard Profile')).toBeInTheDocument()
    expect(screen.getByText('Slot 1')).toBeInTheDocument()
    expect(screen.getByText('Slot 2')).toBeInTheDocument()
    expect(screen.getByText('Slot 3')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cyber Defender')).toBeInTheDocument()
  })

  it('allows equipping badges and updating motto', async () => {
    const user = userEvent.setup()
    const handleSave = vi.fn()

    render(
      <LeaderboardCustomizationModal
        open={true}
        onClose={vi.fn()}
        userId="student-test"
        earnedBadgeIds={['first-steps', 'clean-sheet', 'flawless']}
        catalog={mockCatalog}
        initialCustomization={{ badgeIds: [], title: '' }}
        onSave={handleSave}
      />,
    )

    // Click on Flawless badge card in the earned badges shelf
    const flawlessCard = screen.getByText('Flawless').closest('[role="button"]')
    await user.click(flawlessCard)

    // Check that Slot 1 now has Flawless
    expect(screen.getByText('Slot 1 ✓')).toBeInTheDocument()

    // Type a motto
    const input = screen.getByPlaceholderText(/e\.g\. Cyber Defender/)
    await user.type(input, 'Threat Hunter')

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(saveBtn)

    expect(handleSave).toHaveBeenCalledWith({
      badgeIds: ['flawless'],
      title: 'Threat Hunter',
    })
  })
})

describe('StudentLeaderboardPage self-customization', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the Featured Badges showcase on the personal card with 3 slots', async () => {
    render(
      <MemoryRouter>
        <StudentLeaderboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Featured Badges')).toBeInTheDocument()
    })

    // "Customize Badges" button is displayed
    const customizeBtn = screen.getByRole('button', { name: /Customize badge showcase/i })
    expect(customizeBtn).toBeInTheDocument()

    // Standings table shows the signed-in user Alex with showcase badges
    expect(screen.getAllByText('Alex').length).toBeGreaterThan(0)
    expect(screen.getAllByText('You').length).toBeGreaterThan(0)
  })

  it('opens the customization modal when clicking Customize Badges', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <StudentLeaderboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Featured Badges')).toBeInTheDocument()
    })

    const customizeBtn = screen.getByRole('button', { name: /Customize badge showcase/i })
    await user.click(customizeBtn)

    expect(screen.getByText('Customize Leaderboard Profile')).toBeInTheDocument()
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
  })
})
