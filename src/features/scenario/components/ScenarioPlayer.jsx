import React, { useEffect, useRef, useState } from 'react'
import { SCENARIO_STATES } from '../types/scenario.types'
import styles from './ScenarioPlayer.module.css'

const SIM_TICK_MS = 250

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

/**
 * ScenarioPlayer
 * Renders a scenario's video (or, when `video.videoAvailable` is false, a
 * placeholder frame with a simulated timeline so the pause/decision flow
 * can still be developed and tested without real footage).
 *
 * Knows nothing about scenario content — only plays `video` and reports
 * two events upward: reaching `pauseTimestamp`, and playback ending.
 * The engine decides what those events mean.
 */
export default function ScenarioPlayer({
  scenarioKey,
  video,
  pauseTimestamp,
  engineState,
  onReachedPauseTimestamp,
  onVideoEnded,
}) {
  const videoRef = useRef(null)
  const engineStateRef = useRef(engineState)
  const hasFiredPauseRef = useRef(false)
  const simTimeRef = useRef(0)
  const simIntervalRef = useRef(null)
  const [simTime, setSimTime] = useState(0)

  useEffect(() => {
    engineStateRef.current = engineState
  }, [engineState])

  // New scenario -> reset local playback bookkeeping.
  useEffect(() => {
    hasFiredPauseRef.current = false
    simTimeRef.current = 0
    setSimTime(0)
  }, [scenarioKey])

  const isPlaying = engineState === SCENARIO_STATES.PLAYING

  // ── Real video path ──
  useEffect(() => {
    if (!video.videoAvailable) return
    const el = videoRef.current
    if (!el) return
    if (isPlaying) {
      el.play().catch(() => {
        // Autoplay can be blocked before user interaction — the student
        // still sees the frame and can retry via the (disabled-look) UI.
      })
    } else {
      el.pause()
    }
  }, [isPlaying, video.videoAvailable])

  function handleTimeUpdate(e) {
    if (engineStateRef.current !== SCENARIO_STATES.PLAYING) return
    if (!hasFiredPauseRef.current && e.target.currentTime >= pauseTimestamp) {
      hasFiredPauseRef.current = true
      e.target.pause()
      onReachedPauseTimestamp()
    }
  }

  // ── Placeholder / simulated path (no real video file yet) ──
  useEffect(() => {
    if (video.videoAvailable) return undefined
    if (!isPlaying) return undefined

    simIntervalRef.current = setInterval(() => {
      simTimeRef.current += SIM_TICK_MS / 1000
      setSimTime(simTimeRef.current)

      if (!hasFiredPauseRef.current && simTimeRef.current >= pauseTimestamp) {
        hasFiredPauseRef.current = true
        clearInterval(simIntervalRef.current)
        onReachedPauseTimestamp()
        return
      }
      if (hasFiredPauseRef.current && simTimeRef.current >= video.duration) {
        clearInterval(simIntervalRef.current)
        onVideoEnded()
      }
    }, SIM_TICK_MS)

    return () => clearInterval(simIntervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, video.videoAvailable])

  if (video.videoAvailable) {
    return (
      <video
        key={scenarioKey}
        ref={videoRef}
        className={styles.video}
        src={video.videoUrl}
        poster={video.thumbnail}
        muted
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={onVideoEnded}
      />
    )
  }

  const simPct = video.duration > 0 ? Math.min(100, (simTime / video.duration) * 100) : 0
  // Once a decision/feedback/consequence overlay is showing, it owns the
  // centered visual space — rendering our own centered "coming soon" label
  // and Play button underneath it at the same time just doubles up and
  // reads as broken. Drop back to a plain dark frame during those states.
  const showIdleContent =
    engineState === SCENARIO_STATES.PLAYING || engineState === SCENARIO_STATES.PAUSED

  return (
    <div
      className={styles.placeholder}
      style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
    >
      {showIdleContent && (
        <div className={styles.placeholderScrim}>
          <span className={styles.placeholderIcon} aria-hidden="true">🎬</span>
          <p className={styles.placeholderLabel}>Video coming soon</p>
          <button type="button" className={styles.placeholderPlayBtn} disabled>
            ▶ Play
          </button>
          <div className={styles.simRow}>
            <div className={styles.simTrack}>
              <div className={styles.simFill} style={{ width: `${simPct}%` }} />
            </div>
            <span className={styles.simTime}>
              {formatTime(simTime)} / {formatTime(video.duration)} · simulated for dev preview
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
