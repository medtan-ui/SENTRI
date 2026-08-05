import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * The badge notification's only real job is deciding what counts as
 * "new", and the two ways it can get that wrong are both invisible in a
 * screenshot: announcing every badge a student already had the moment a
 * page loads, or announcing nothing at all when one actually lands.
 */

const CATALOG = [
  { id: 'first-steps', name: 'First Steps', description: 'Finish your first lesson.', icon: 'book', tier: 'bronze' },
  { id: 'flawless', name: 'Flawless', description: 'Get a perfect score on any quiz.', icon: 'star', tier: 'gold' },
  { id: 'full-sweep', name: 'Full Sweep', description: 'Complete every module.', icon: 'trophy', tier: 'gold' },
]

let state = {
  status: 'success',
  errorMessage: '',
  gamification: { badges: ['first-steps'] },
  catalog: CATALOG,
  refresh: vi.fn(),
}

vi.mock('../src/context/GamificationContext', () => ({
  useGamificationState: () => state,
  GamificationProvider: ({ children }) => children,
}))

const { default: BadgeToaster } = await import('../src/components/Gamification/BadgeToaster')

function setBadges(badges) {
  state = { ...state, gamification: { badges } }
}

beforeEach(() => {
  state = {
    status: 'success',
    errorMessage: '',
    gamification: { badges: ['first-steps'] },
    catalog: CATALOG,
    refresh: vi.fn(),
  }
})

describe('BadgeToaster', () => {
  it('says nothing about badges the student already had', () => {
    // The failure this guards against: every page load congratulating a
    // student for badges they earned weeks ago.
    render(<BadgeToaster />)
    expect(screen.queryByText('Badge earned')).not.toBeInTheDocument()
    expect(screen.queryByText('First Steps')).not.toBeInTheDocument()
  })

  it('announces a badge that lands after the first render', async () => {
    const { rerender } = render(<BadgeToaster />)
    setBadges(['first-steps', 'flawless'])
    rerender(<BadgeToaster />)

    await waitFor(() => expect(screen.getByText('Flawless')).toBeInTheDocument())
    expect(screen.getByText('Badge earned')).toBeInTheDocument()
    // Only the new one.
    expect(screen.queryByText('First Steps')).not.toBeInTheDocument()
  })

  it('announces every badge in a burst, not just the last', async () => {
    // Completing a final module can award several at once.
    const { rerender } = render(<BadgeToaster />)
    setBadges(['first-steps', 'flawless', 'full-sweep'])
    rerender(<BadgeToaster />)

    await waitFor(() => expect(screen.getByText('Flawless')).toBeInTheDocument())
    expect(screen.getByText('Full Sweep')).toBeInTheDocument()
  })

  it('can be dismissed by hand', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<BadgeToaster />)
    setBadges(['first-steps', 'flawless'])
    rerender(<BadgeToaster />)

    await waitFor(() => expect(screen.getByText('Flawless')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Dismiss Flawless/ }))
    expect(screen.queryByText('Flawless')).not.toBeInTheDocument()
  })

  it('does not re-announce the same badge on a later render', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<BadgeToaster />)
    setBadges(['first-steps', 'flawless'])
    rerender(<BadgeToaster />)

    await waitFor(() => expect(screen.getByText('Flawless')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Dismiss Flawless/ }))

    // An unrelated state change must not bring it back.
    state = { ...state }
    rerender(<BadgeToaster />)
    expect(screen.queryByText('Flawless')).not.toBeInTheDocument()
  })

  it('stays silent while the reward state is still loading', () => {
    state = { ...state, status: 'loading', gamification: null }
    render(<BadgeToaster />)
    expect(screen.queryByText('Badge earned')).not.toBeInTheDocument()
  })

  it('ignores a badge id the catalog does not know about', async () => {
    // A server that has shipped a new badge the client bundle predates
    // should produce no toast rather than an empty one.
    const { rerender } = render(<BadgeToaster />)
    setBadges(['first-steps', 'not-in-catalog-yet'])
    rerender(<BadgeToaster />)

    await waitFor(() => expect(screen.queryByText('Badge earned')).not.toBeInTheDocument())
  })
})
