import React, { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { useGamification } from '../hooks/useGamification'

/**
 * GamificationContext
 * ─────────────────────────────────────────────────────────────
 * One fetch of the signed-in student's points, rank, badges and streak,
 * shared by everything that shows them: the navbar chip, the dashboard
 * hero, the Progress page's Achievements tab, and the simulation
 * completion screen.
 *
 * It is a context rather than a hook called in each of those places for a
 * plain reason — the navbar renders on every authenticated page, so a
 * per-component hook would fire a callable on every navigation, four
 * times over on the dashboard alone. Fetching once at the top and reading
 * from context turns that into one call per session.
 *
 * Only students are fetched for. Admins have no gamification document,
 * and asking for one would create it.
 *
 * Consumers get `status`, so a page can show its skeleton rather than
 * flashing a zero and then correcting itself a moment later.
 * ─────────────────────────────────────────────────────────────
 */
const GamificationContext = createContext(undefined)

const EMPTY = {
  status: 'idle',
  errorMessage: '',
  gamification: null,
  catalog: [],
  refresh: () => {},
}

export function GamificationProvider({ children }) {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'

  return isStudent ? (
    <StudentGamificationProvider>{children}</StudentGamificationProvider>
  ) : (
    <GamificationContext.Provider value={EMPTY}>{children}</GamificationContext.Provider>
  )
}

/**
 * Split out so the hook (and therefore the network call) only ever mounts
 * for a signed-in student — a conditional hook inside one component would
 * not be legal, and gating inside the hook would still run its effects.
 */
function StudentGamificationProvider({ children }) {
  const { status, errorMessage, gamification, catalog, retry } = useGamification({ pingVisit: true })

  const value = useMemo(
    () => ({ status, errorMessage, gamification, catalog, refresh: retry }),
    [status, errorMessage, gamification, catalog, retry],
  )

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
}

/**
 * @returns {{ status: 'idle'|'loading'|'error'|'success', errorMessage: string,
 *   gamification: object|null, catalog: object[], refresh: () => void }}
 *   `status: 'idle'` means nobody is signed in as a student, which is a
 *   normal state (login page, admin session), not a failure.
 */
export function useGamificationState() {
  const ctx = useContext(GamificationContext)
  return ctx ?? EMPTY
}
