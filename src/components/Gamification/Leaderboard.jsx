import React, { useCallback, useEffect, useState } from 'react'
import Icon from '../Icon/Icon'
import { getLeaderboard } from '../../services/gamificationService'
import styles from './Leaderboard.module.css'

/**
 * Leaderboard
 * Top scorers, plus the caller's own standing whether or not they made
 * the visible rows.
 *
 * That last part matters more than the ranking does. A board that only
 * shows the top ten tells the other thirty students in a class exactly
 * one thing: you are not on this. Always returning "you" — with a real
 * rank out of a real total — turns the same component from a trophy case
 * into something the median student has a reason to open.
 *
 * Names come from nicknames, and the row shows points, rank and streak.
 * Nothing about anyone's scores, attempts or module history is exposed;
 * the callable behind this returns those columns and no others.
 *
 * @param {{ scope?: 'all'|'section', limit?: number, showScopeToggle?: boolean }} props
 */
export default function Leaderboard({ scope: initialScope = 'all', limit = 5, showScopeToggle = false }) {
  const [scope, setScope] = useState(initialScope)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [board, setBoard] = useState(null)

  const load = useCallback(
    (nextScope) => {
      let cancelled = false
      setStatus('loading')
      setErrorMessage('')
      getLeaderboard({ scope: nextScope, limit })
        .then((result) => {
          if (cancelled) return
          setBoard(result)
          setStatus('success')
        })
        .catch((err) => {
          if (cancelled) return
          setErrorMessage(err?.message || 'The leaderboard could not be loaded right now.')
          setStatus('error')
        })
      return () => {
        cancelled = true
      }
    },
    [limit],
  )

  useEffect(() => load(scope), [load, scope])

  // Your own row is repeated at the bottom only when it isn't already
  // above — a duplicated row is confusing, an absent one is worse.
  const youOutsideTop = board?.you && !board.entries.some((entry) => entry.isYou)

  return (
    <div className={styles.board}>
      {showScopeToggle && (
        <div className={styles.scopeToggle} role="tablist" aria-label="Leaderboard scope">
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'all'}
            className={styles.scopeBtn}
            data-active={scope === 'all' || undefined}
            onClick={() => setScope('all')}
          >
            Everyone
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'section'}
            className={styles.scopeBtn}
            data-active={scope === 'section' || undefined}
            onClick={() => setScope('section')}
          >
            My class
          </button>
        </div>
      )}

      {status === 'loading' && <p className={styles.note}>Loading the board…</p>}

      {status === 'error' && (
        <div className={styles.note}>
          <p>{errorMessage}</p>
          <button type="button" className={styles.retryBtn} onClick={() => load(scope)}>
            Try again
          </button>
        </div>
      )}

      {status === 'success' && board.entries.length === 0 && (
        <p className={styles.note}>
          Nobody has scored here yet. Finish a lesson and you will be the one at the top.
        </p>
      )}

      {status === 'success' && board.entries.length > 0 && (
        <>
          <ol className={styles.list}>
            {board.entries.map((entry) => (
              <Row key={entry.userId} entry={entry} />
            ))}
          </ol>

          {youOutsideTop && (
            <>
              <div className={styles.gap} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <ol className={styles.list} start={board.you.rank}>
                <Row entry={board.you} />
              </ol>
            </>
          )}

          <p className={styles.footnote}>
            {board.scope === 'section' && board.section
              ? `${board.section} · ${board.totalRanked} ranked`
              : `${board.totalRanked} students ranked`}
          </p>
        </>
      )}
    </div>
  )
}

function Row({ entry }) {
  return (
    <li className={styles.row} data-you={entry.isYou || undefined}>
      <span className={styles.rank} data-medal={entry.rank <= 3 ? entry.rank : undefined}>
        {entry.rank}
      </span>
      <span className={styles.identity}>
        <span className={styles.name}>
          {entry.displayName}
          {entry.isYou && <span className={styles.youTag}>You</span>}
        </span>
        <span className={styles.subline}>{entry.rankName}</span>
      </span>
      {entry.currentStreak > 0 && (
        <span className={styles.streak} title={`${entry.currentStreak} day streak`}>
          <Icon name="flame" size={13} filled />
          {entry.currentStreak}
        </span>
      )}
      <span className={styles.points}>{entry.points.toLocaleString()}</span>
    </li>
  )
}
