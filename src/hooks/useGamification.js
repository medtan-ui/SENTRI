import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyGamification, recordDailyVisit } from '../services/gamificationService'

const VISIT_KEY = 'sentri:lastVisitPing'

/**
 * useGamification
 * The signed-in student's points, rank, badges and streak, shared by the
 * dashboard, the navbar chip and the Progress page's Achievements tab.
 *
 * `pingVisit` exists because a streak has to mean "showed up", not
 * "finished something" — a student who spends an evening reading a lesson
 * without completing it has still trained that day. The dashboard passes
 * it; every other consumer reads only.
 *
 * The ping is fired at most once per Manila day per browser (sessionStorage
 * would re-fire on every new tab, and the server is idempotent within a
 * day anyway, so this is purely about not making a redundant call). The
 * server remains the authority on what day it is; this is a cheap local
 * guard, not the rule.
 *
 * @param {{ pingVisit?: boolean }} [options]
 */
export function useGamification({ pingVisit = false } = {}) {
  const { user } = useAuth()
  const userId = user?.uid ?? null

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('')
  const [gamification, setGamification] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [retryToken, setRetryToken] = useState(0)
  const pingedRef = useRef(false)

  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false
    setStatus('loading')
    setErrorMessage('')

    async function load() {
      // A visit ping returns the same refreshed document a plain read
      // would, so on the day's first load one round trip does both jobs.
      let fromPing = null
      if (pingVisit && !pingedRef.current && shouldPing(userId)) {
        pingedRef.current = true
        fromPing = await recordDailyVisit()
        if (fromPing) markPinged(userId)
      }

      if (fromPing) {
        if (cancelled) return
        setGamification(fromPing)
        // The catalog isn't in the ping response, so fetch the pair anyway
        // when it's still missing. Cheap, and only on the first load.
        const full = await getMyGamification()
        if (cancelled) return
        setCatalog(full?.catalog?.badges ?? [])
        setGamification(full?.gamification ?? fromPing)
        setStatus('success')
        return
      }

      const data = await getMyGamification()
      if (cancelled) return
      setGamification(data?.gamification ?? null)
      setCatalog(data?.catalog?.badges ?? [])
      setStatus('success')
    }

    load().catch((err) => {
      if (cancelled) return
      setErrorMessage(err?.message || 'Something went wrong loading your rewards. Please try again.')
      setStatus('error')
    })

    return () => {
      cancelled = true
    }
  }, [userId, pingVisit, retryToken])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  return { status, errorMessage, retry, gamification, catalog }
}

/** Manila day key, matching the server's own day boundary. */
function manilaToday() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function shouldPing(userId) {
  try {
    return window.localStorage.getItem(`${VISIT_KEY}:${userId}`) !== manilaToday()
  } catch {
    // Private mode, storage disabled — ping every load rather than never.
    return true
  }
}

function markPinged(userId) {
  try {
    window.localStorage.setItem(`${VISIT_KEY}:${userId}`, manilaToday())
  } catch {
    // Nothing to do; the server-side idempotency still holds.
  }
}
