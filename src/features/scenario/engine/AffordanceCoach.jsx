import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useScenarioInteraction } from './ScenarioInteractionContext'
import styles from './AffordanceCoach.module.css'

const REST_OFFSET = 80 // px, down-right from target center
const TRAVEL_MS = 700
const REST_FADE_MS = 250
const PRESS_MS = 150
const HOLD_MS = 300
const FADEOUT_MS = 250
const PAUSE_MS = 900
const MAX_LOOPS = 3

function MouseCursorGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 2l14 8.4-6.2 1.4L15 18.6l-2.6 1.3-3.6-6.6L4 17.6V2z"
        fill="#1A1A2E"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ThumbGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 21c-1.2 0-2-.9-2.3-2L5 12.7c-.2-.9.4-1.7 1.3-1.7.5 0 .9.3 1.1.7L9 15V5.5C9 4.7 9.7 4 10.5 4S12 4.7 12 5.5V13h1V4.8c0-.8.7-1.5 1.5-1.5S16 4 16 4.8V13h1V6.3c0-.8.7-1.4 1.5-1.4S20 5.5 20 6.3V15c0 3.3-2.7 6-6 6H9z"
        fill="#1A1A2E"
        stroke="#fff"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * AffordanceCoach
 * Layer 2 of the affordance system. Animates a mouse cursor (fine
 * pointer) or a thumb (coarse pointer) traveling to whichever target the
 * current scenario names, pressing it, and looping up to 3 times before
 * resting. Purely a visual demonstration — it never calls onActivate
 * itself; the student still has to act.
 *
 * `active` is fully owned by useScenarioEngine (initial delay, the 12s
 * re-arm after each finished run, and permanent retirement after the
 * student's first real interaction all live there, not here).
 */
export default function AffordanceCoach({ active, targetId, containerRef, onFinished }) {
  const { getTargetNode } = useScenarioInteraction()
  const [phase, setPhase] = useState('idle')
  const [pos, setPos] = useState(null)
  const [restPos, setRestPos] = useState(null)
  const loopCountRef = useRef(0)

  const isCoarsePointer = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    [],
  )
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  // Locate the target and compute rest/travel coordinates whenever the
  // coach is (re)activated or its target changes.
  useEffect(() => {
    if (!active) {
      setPhase('idle')
      loopCountRef.current = 0
      return
    }
    const targetNode = getTargetNode(targetId)
    const containerNode = containerRef.current
    if (!targetNode || !containerNode) return
    const targetRect = targetNode.getBoundingClientRect()
    const containerRect = containerNode.getBoundingClientRect()
    const centerX = targetRect.left - containerRect.left + targetRect.width / 2
    const centerY = targetRect.top - containerRect.top + targetRect.height / 2
    setPos({ x: centerX, y: centerY })
    setRestPos({ x: centerX + REST_OFFSET, y: centerY + REST_OFFSET })
    loopCountRef.current = 0
    setPhase('rest')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, targetId])

  // The rest -> travel -> press -> hold -> fadeout -> pause -> rest loop.
  useEffect(() => {
    if (prefersReducedMotion || !active || phase === 'idle' || !pos || !restPos) return undefined

    const durations = {
      rest: REST_FADE_MS + 150,
      travel: TRAVEL_MS,
      press: PRESS_MS,
      hold: HOLD_MS,
      fadeout: FADEOUT_MS,
      pause: PAUSE_MS,
    }

    const timer = setTimeout(() => {
      if (phase === 'fadeout') {
        loopCountRef.current += 1
        if (loopCountRef.current >= MAX_LOOPS) {
          setPhase('idle')
          onFinished?.()
        } else {
          setPhase('pause')
        }
        return
      }
      const nextPhase = { rest: 'travel', travel: 'press', press: 'hold', hold: 'fadeout', pause: 'rest' }[phase]
      setPhase(nextPhase)
    }, durations[phase])

    return () => clearTimeout(timer)
  }, [phase, active, pos, restPos, prefersReducedMotion, onFinished])

  if (!active || !pos) return null

  if (prefersReducedMotion) {
    return (
      <div className={styles.staticHint} style={{ left: pos.x, top: pos.y }}>
        <span className={styles.staticRing} />
        <span className={styles.staticLabel}>{isCoarsePointer ? 'Tap here' : 'Click here'}</span>
      </div>
    )
  }

  const atTarget = phase !== 'rest' && phase !== 'pause' && phase !== 'idle'
  const currentPos = atTarget ? pos : restPos
  const pressed = phase === 'press' || phase === 'hold'
  const visible = phase !== 'idle' && phase !== 'pause'

  const style = {
    transform: `translate(${currentPos.x}px, ${currentPos.y}px) translate(-50%, -50%) scale(${pressed ? 0.85 : 1})`,
    opacity: visible && phase !== 'fadeout' ? 1 : 0,
    transitionProperty: phase === 'travel' ? 'transform' : 'opacity, transform',
    transitionDuration:
      phase === 'travel'
        ? `${TRAVEL_MS}ms`
        : phase === 'press'
          ? `${PRESS_MS}ms`
          : phase === 'fadeout'
            ? `${FADEOUT_MS}ms`
            : `${REST_FADE_MS}ms`,
    transitionTimingFunction: phase === 'travel' ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'ease',
  }

  return (
    <div className={styles.coach} style={style} aria-hidden="true">
      {phase === 'press' && <span className={styles.ripple} key={loopCountRef.current} />}
      {isCoarsePointer ? <ThumbGlyph /> : <MouseCursorGlyph />}
    </div>
  )
}
