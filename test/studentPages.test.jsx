import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/**
 * Render coverage for the two student pages the reward layer changed
 * most: the dashboard and the progress page.
 *
 * These pages can't be reached in a browser without a real Firebase
 * session, so a render test in jsdom is the only place the whole tree
 * they pull in — DashboardLayout, Navbar, Sidebar, the icon set, the
 * rank meter, the streak track, the badge shelf, the leaderboard, the
 * module grid — is actually mounted together.
 *
 * The failures worth catching here are the boring, total ones: a bad
 * import path, a component handed a prop shape it doesn't expect, or a
 * read straight through an absent field on a gamification document that
 * hasn't been built yet. Each of those renders as a blank page in
 * production and as a green build in CI, which is exactly the gap this
 * file exists to close.
 */

const modules = [
  {
    moduleId: 'password-security',
    title: 'Password Security',
    description: 'Strong credentials and MFA.',
    icon: '\u{1F511}',
    color: '#B8860B',
    moduleOrder: 1,
    status: 'COMPLETED',
    progress: {
      lessonStarted: true,
      lessonCompleted: true,
      simulationCompleted: true,
      quizCompleted: true,
      moduleCompleted: true,
      score: 90,
      postTestCompleted: true,
    },
  },
  {
    moduleId: 'phishing-awareness',
    title: 'Phishing Awareness',
    description: 'Spotting deceptive messages.',
    icon: '\u{1F3A3}',
    color: '#C0392B',
    moduleOrder: 2,
    status: 'IN_PROGRESS',
    progress: {
      lessonStarted: true,
      lessonCompleted: false,
      simulationCompleted: false,
      quizCompleted: false,
      moduleCompleted: false,
      score: null,
    },
  },
  {
    moduleId: 'malware-awareness',
    title: 'Malware Awareness',
    description: 'How infections spread.',
    icon: '\u{1F9A0}',
    color: '#16697A',
    moduleOrder: 3,
    status: 'LOCKED',
    progress: { moduleCompleted: false, score: null },
  },
]

const gamification = {
  userId: 'student-1',
  displayName: 'Ana',
  points: 400,
  level: 3,
  rankName: 'Analyst',
  rankFloor: 300,
  nextRankAt: 550,
  nextRankName: 'Specialist',
  badges: ['first-steps', 'field-ready'],
  badgeLog: [],
  currentStreak: 4,
  longestStreak: 9,
  lastActiveDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10),
  totals: {},
}

const catalog = [
  { id: 'first-steps', name: 'First Steps', description: 'Finish your first lesson.', icon: 'book', tier: 'bronze' },
  { id: 'field-ready', name: 'Field Ready', description: 'Clear your first scenario.', icon: 'shield', tier: 'bronze' },
  { id: 'flawless', name: 'Flawless', description: 'Get a perfect quiz score.', icon: 'star', tier: 'gold' },
  { id: 'full-sweep', name: 'Full Sweep', description: 'Complete every module.', icon: 'trophy', tier: 'gold' },
]

const leaderboard = {
  totalRanked: 24,
  entries: [
    { userId: 'a', displayName: 'Bea', points: 700, level: 4, rankName: 'Specialist', currentStreak: 6, badgeCount: 5, rank: 1, isYou: false },
    { userId: 'student-1', displayName: 'Ana', points: 400, level: 3, rankName: 'Analyst', currentStreak: 4, badgeCount: 2, rank: 2, isYou: true },
  ],
  you: { userId: 'student-1', displayName: 'Ana', points: 400, level: 3, rankName: 'Analyst', currentStreak: 4, badgeCount: 2, rank: 2, isYou: true },
}

let modulesState = { status: 'success', errorMessage: '', retry: vi.fn(), modules }
let rewardState = { status: 'success', errorMessage: '', gamification, catalog, refresh: vi.fn() }

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'student-1', role: 'student', nickname: 'Ana', displayName: 'Ana Reyes', emailVerified: true },
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}))

vi.mock('../src/context/GamificationContext', () => ({
  useGamificationState: () => rewardState,
  GamificationProvider: ({ children }) => children,
}))

vi.mock('../src/hooks/useStudentModules', () => ({
  useStudentModules: () => modulesState,
}))

vi.mock('../src/services/gamificationService', () => ({
  getLeaderboard: vi.fn(async () => leaderboard),
  getMyGamification: vi.fn(async () => ({ gamification, catalog: { badges: catalog, total: catalog.length } })),
  recordDailyVisit: vi.fn(async () => gamification),
}))

vi.mock('../src/services/analyticsService', () => ({
  getStudentAnalytics: vi.fn(async () => null),
  aggregateStudentAnalytics: vi.fn(async () => null),
}))

// The dashboard reads the end-of-curriculum final assessment to decide
// whether to show its callout. Stubbed at the service boundary (rather
// than the hook) so the hook's own unlock logic still runs against the
// mocked module list above — the interesting part is that the callout
// stays hidden while modules are outstanding.
vi.mock('../src/services/finalAssessmentService', () => ({
  getFinalAssessment: vi.fn(async () => ({
    title: 'SENTRI Final Assessment',
    settings: { passingScore: 75, timeLimitMinutes: 30, instructions: '', available: true, attemptsAllowed: 2 },
    questions: [],
  })),
  getFinalAssessmentProgress: vi.fn(async () => null),
  submitFinalAssessment: vi.fn(),
  saveFinalAssessment: vi.fn(),
  getDefaultFinalAssessmentConfig: vi.fn(() => ({})),
}))

const { default: StudentDashboard } = await import('../src/pages/Student/Dashboard/StudentDashboard')
const { default: StudentProgressPage } = await import('../src/pages/Student/Progress/StudentProgressPage')

function renderPage(Page) {
  return render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  modulesState = { status: 'success', errorMessage: '', retry: vi.fn(), modules }
  rewardState = { status: 'success', errorMessage: '', gamification, catalog, refresh: vi.fn() }
})

describe('StudentDashboard', () => {
  it('greets the student and names the module the hero resumes', async () => {
    renderPage(StudentDashboard)

    expect(screen.getByText(/Hey, Ana/)).toBeInTheDocument()
    // The hero calls out the next module by name and carries the button
    // that goes to it. The module grid below also has a Continue button
    // for the same card, which is fine — that one is reached by reading
    // the card, this one by reading the greeting.
    expect(screen.getByText(/Pick up where you left off/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Continue/ }).length).toBeGreaterThan(0)
  })

  it('shows the rank, XP and streak in the hero', async () => {
    renderPage(StudentDashboard)

    expect(screen.getByText('Analyst')).toBeInTheDocument()
    expect(screen.getByText('Lv 3')).toBeInTheDocument()
    // Twice on this page by design: the navbar chip is persistent across
    // every page, and the hero meter is the dashboard's own display.
    expect(screen.getAllByText('400 XP').length).toBe(2)
    // 550 - 400
    expect(screen.getByText(/150 XP to Specialist/)).toBeInTheDocument()
    expect(screen.getByText(/Best run so far: 9 days/)).toBeInTheDocument()
  })

  it('reports curriculum figures without duplicating them in a second panel', () => {
    renderPage(StudentDashboard)

    expect(screen.getByText('Modules completed')).toBeInTheDocument()
    expect(screen.getByText('Badges earned')).toBeInTheDocument()
    // The old "What's Next" and "Module Progress" panels said the same
    // thing the module grid already says; they are deliberately gone.
    expect(screen.queryByText("What's Next")).not.toBeInTheDocument()
    expect(screen.queryByText('Module Progress')).not.toBeInTheDocument()
  })

  it('renders every module card, with the locked one disabled', () => {
    renderPage(StudentDashboard)

    for (const m of modules) {
      // "Phishing Awareness" is also named in the hero as the module
      // being resumed, so at least one occurrence is what matters.
      expect(screen.getAllByText(m.title).length).toBeGreaterThan(0)
    }
    expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled()
  })

  it('renders the leaderboard and marks the signed-in student', async () => {
    renderPage(StudentDashboard)

    await waitFor(() => expect(screen.getByText('Bea')).toBeInTheDocument())
    // "Ana" is also the navbar's user badge and "You" is a sidebar group
    // heading, so find the student's own row through the board itself.
    const myRow = screen.getByText('Bea').closest('ol').querySelectorAll('li')[1]
    expect(myRow).toHaveTextContent('Ana')
    expect(myRow).toHaveTextContent('You')
    expect(screen.getByText(/24 students ranked/)).toBeInTheDocument()
  })

  it('renders without rewards when the reward fetch has not resolved', () => {
    rewardState = { status: 'loading', errorMessage: '', gamification: null, catalog: [], refresh: vi.fn() }
    renderPage(StudentDashboard)

    // The page still works — the reward block is simply absent rather
    // than rendering a zeroed rank the student never had.
    expect(screen.getByText(/Hey, Ana/)).toBeInTheDocument()
    expect(screen.queryByText('Analyst')).not.toBeInTheDocument()
  })

  it('survives a gamification document missing its rank fields', () => {
    rewardState = {
      status: 'success',
      errorMessage: '',
      gamification: { points: 0, level: 1, rankName: 'Trainee', badges: [], currentStreak: 0, longestStreak: 0 },
      catalog,
      refresh: vi.fn(),
    }
    renderPage(StudentDashboard)

    expect(screen.getByText('Trainee')).toBeInTheDocument()
    // No rankFloor / nextRankAt on the document: the meter falls back to
    // a full bar and the top-rank caption instead of throwing.
    expect(screen.getAllByText('0 XP').length).toBe(2)
    expect(screen.getByText(/Top rank reached/)).toBeInTheDocument()
  })
})

describe('StudentProgressPage', () => {
  it('opens on the overview tab with the standing above it', () => {
    renderPage(StudentProgressPage)

    expect(screen.getByRole('heading', { name: 'Progress' })).toBeInTheDocument()
    expect(screen.getByText('Analyst')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Module progress')).toBeInTheDocument()
  })

  it('switches to achievements and shows earned and locked badges together', async () => {
    const user = userEvent.setup()
    renderPage(StudentProgressPage)

    await user.click(screen.getByRole('tab', { name: 'Achievements' }))

    expect(screen.getByText('2 of 4 earned')).toBeInTheDocument()
    expect(screen.getByText('First Steps')).toBeInTheDocument()
    // A locked badge stays visible with its criteria, so it can act as a
    // prompt rather than a surprise.
    expect(screen.getByText('Flawless')).toBeInTheDocument()
    expect(screen.getAllByText('Locked').length).toBe(2)
  })

  it('explains how XP is earned on the achievements tab', async () => {
    const user = userEvent.setup()
    renderPage(StudentProgressPage)

    await user.click(screen.getByRole('tab', { name: 'Achievements' }))
    expect(screen.getByText('How XP works')).toBeInTheDocument()
    expect(screen.getByText('Scenario cleared')).toBeInTheDocument()
  })

  it('switches to the leaderboard tab and loads the board', async () => {
    const user = userEvent.setup()
    renderPage(StudentProgressPage)

    await user.click(screen.getByRole('tab', { name: 'Leaderboard' }))

    await waitFor(() => expect(screen.getByText('Bea')).toBeInTheDocument())
    // The total is what makes a rank mean anything — "2nd" alone doesn't
    // say whether that is out of three students or thirty.
    expect(screen.getByText('24 students ranked')).toBeInTheDocument()
  })
})
