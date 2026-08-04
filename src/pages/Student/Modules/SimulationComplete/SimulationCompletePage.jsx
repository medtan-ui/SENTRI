import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import Icon from '../../../../components/Icon/Icon'
import ModuleAccessGuard from '../../../../components/ModuleAccessGuard/ModuleAccessGuard'
import BadgeMedal from '../../../../components/Gamification/BadgeMedal'
import { useGamificationState } from '../../../../context/GamificationContext'
import { loadModuleConfig } from '../../../../services/moduleLoader'
import styles from './SimulationCompletePage.module.css'

/**
 * SimulationCompletePage — /student/modules/:moduleId/simulation-complete
 * Reusable "what's next" screen after a module's simulation is finished.
 * Distinct from the Scenario Engine's own internal complete screen (which
 * shows the run's scoreline right after the last scene) — this page is
 * the app-level landing spot afterward, with real next steps: the quiz or
 * returning to the dashboard. Only reachable once simulationCompleted is
 * true (ModuleAccessGuard), so the badge below can say so unconditionally
 * rather than re-deriving status.
 *
 * ── Why the reward appears here and not in the engine ────────────────
 * Points are awarded server-side by a Firestore trigger that fires on the
 * progress write the previous screen just made. That is the correct place
 * for it (see functions/src/modules/gamification), but it means the new
 * total exists a beat after the student arrives. So this page refreshes
 * the reward state on mount and reports the difference: XP gained, and
 * any badge that landed with it.
 *
 * If the refresh hasn't caught up, nothing is claimed. Showing "+0 XP"
 * because a trigger was slow would be worse than showing nothing, and the
 * real figure is one navigation away in the navbar either way.
 */
export default function SimulationCompletePage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [config, setConfig] = useState(undefined)
  const { gamification, catalog, refresh } = useGamificationState()

  // Snapshot taken before the refresh lands, so the delta is "what this
  // simulation earned" rather than "what I have".
  const beforeRef = useRef(null)
  const [earned, setEarned] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadModuleConfig(moduleId).then((result) => {
      if (!cancelled) setConfig(result)
    })
    return () => {
      cancelled = true
    }
  }, [moduleId])

  // One refresh on arrival. The trigger runs on the write the previous
  // screen made, so a short delay covers the round trip without polling.
  useEffect(() => {
    if (beforeRef.current === null && gamification) {
      beforeRef.current = { points: gamification.points, badges: gamification.badges ?? [] }
      const timer = setTimeout(refresh, 1200)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [gamification, refresh])

  useEffect(() => {
    const before = beforeRef.current
    if (!before || !gamification) return
    const pointsGained = (gamification.points ?? 0) - before.points
    const newBadges = (gamification.badges ?? []).filter((id) => !before.badges.includes(id))
    if (pointsGained > 0 || newBadges.length > 0) {
      setEarned({ pointsGained, newBadges })
    }
  }, [gamification])

  const newBadgeDetails = (earned?.newBadges ?? [])
    .map((id) => catalog.find((badge) => badge.id === id))
    .filter(Boolean)

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <ModuleAccessGuard moduleId={moduleId} require="simulation">
          <Card className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <Icon name="shield" size={30} strokeWidth={1.6} />
            </span>
            <h1 className={styles.heading}>Simulation complete</h1>
            {config ? <p className={styles.moduleTitle}>{config.title}</p> : null}

            <p className={styles.body}>
              You have completed the interactive simulation. Your quiz is now available.
            </p>

            {earned?.pointsGained > 0 && (
              <div className={styles.xpBanner}>
                <Icon name="bolt" size={18} filled />
                <span className={styles.xpValue}>+{earned.pointsGained} XP</span>
                <span className={styles.xpTotal}>{gamification.points.toLocaleString()} total</span>
              </div>
            )}

            {newBadgeDetails.length > 0 && (
              <div className={styles.newBadges}>
                <p className={styles.newBadgesTitle}>
                  {newBadgeDetails.length === 1 ? 'New badge unlocked' : 'New badges unlocked'}
                </p>
                {newBadgeDetails.map((badge) => (
                  <BadgeMedal key={badge.id} badge={badge} earned />
                ))}
              </div>
            )}

            <span className={styles.statusBadge}>Quiz available</span>

            <div className={styles.actions}>
              <Button variant="primary" size="lg" onClick={() => navigate(`/student/modules/${moduleId}/quiz`)}>
                Start Quiz
              </Button>
              <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </Card>
        </ModuleAccessGuard>
      </div>
    </DashboardLayout>
  )
}
