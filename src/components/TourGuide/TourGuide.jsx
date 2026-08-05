import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import Icon from '../Icon/Icon'
import styles from './TourGuide.module.css'

const CARD_WIDTH = 320
const GAP = 14
const EDGE = 12

/**
 * TourGuide
 * A short, skippable walkthrough that dims the app and spotlights one
 * real element at a time.
 *
 * It points at the actual interface rather than at screenshots of it, so
 * it cannot drift out of date the way a static "how to use this" page
 * would. Targets are found by `data-tour` attributes, chosen over CSS
 * class names because class names here are hashed by CSS modules at
 * build time and would silently stop matching.
 *
 * ── Behaviour worth knowing ──────────────────────────────────────────
 * A step whose target is not on the page (an element that only exists
 * once a student has progress, say) is skipped automatically rather than
 * pointing at nothing. That means the step count shown is the count of
 * steps that will actually run, not the count in the source.
 *
 * Escape and the Skip button both end it. There is no way to enter a
 * state where the dimmer is up and the student cannot get out.
 *
 * @param {{ steps: Array<{ target?: string, title: string, body: string }>,
 *   onFinish: () => void }} props
 */
export default function TourGuide({ steps, onFinish }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)

  // Only steps whose anchor actually exists. Recomputed on mount rather
  // than per render so the total can't change under the student.
  const [liveSteps] = useState(() =>
    steps.filter((step) => !step.target || document.querySelector(`[data-tour="${step.target}"]`)),
  )

  const step = liveSteps[index]
  const total = liveSteps.length
  const isLast = index === total - 1

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null)
      return
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (!el) {
      setRect(null)
      return
    }
    const box = el.getBoundingClientRect()

    // A target taller than about half the viewport (the module grid is
    // ~1100px) leaves nowhere for the card: it doesn't fit below, and
    // "above" puts it on top of the thing being pointed at. Clamping the
    // spotlight to the element's top portion highlights the part the
    // student can actually see and gives the card somewhere to go.
    const maxHeight = window.innerHeight * 0.5
    const top = Math.max(EDGE, box.top)
    const height = Math.min(box.height - (top - box.top), maxHeight)

    setRect({ top, left: box.left, width: box.width, height })
  }, [step])

  // Bring the target into view first, then measure — measuring before the
  // scroll settles puts the spotlight where the element used to be.
  useEffect(() => {
    if (!step?.target) return undefined
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const timer = setTimeout(measure, 320)
    return () => clearTimeout(timer)
  }, [step, measure])

  useLayoutEffect(measure, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [measure])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onFinish()
      if (e.key === 'ArrowRight' && !isLast) setIndex((i) => i + 1)
      if (e.key === 'ArrowLeft' && index > 0) setIndex((i) => i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFinish, isLast, index])

  if (!step || total === 0) return null

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Getting started tour" data-print-hide>
      {/* The dimmer. When a step has an anchor this is a small transparent
          box with an enormous spread shadow, which darkens everything
          around it — cheaper and sharper than an SVG mask, and it
          animates its position between steps for free. */}
      {rect ? (
        <div
          className={styles.spotlight}
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      ) : (
        <div className={styles.fullDim} />
      )}

      <div className={styles.card} style={cardPosition(rect)}>
        <div className={styles.cardHead}>
          <span className={styles.counter}>
            {index + 1} <span className={styles.counterTotal}>/ {total}</span>
          </span>
          <button type="button" className={styles.skip} onClick={onFinish}>
            Skip tour
          </button>
        </div>

        <h2 className={styles.title}>{step.title}</h2>
        <p className={styles.body}>{step.body}</p>

        <div className={styles.dots} aria-hidden="true">
          {liveSteps.map((s, i) => (
            <span key={s.title} className={styles.dot} data-state={i === index ? 'current' : i < index ? 'done' : undefined} />
          ))}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
          >
            Back
          </button>
          <button
            type="button"
            className={styles.nextBtn}
            onClick={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
          >
            {isLast ? 'Get started' : 'Next'}
            <Icon name="arrowRight" size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Puts the card below its target, or above when there isn't room below,
 * and centres it when a step has no anchor at all. Kept clamped inside
 * the viewport so a target near an edge can't push it off screen.
 */
function cardPosition(rect) {
  if (!rect) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const CARD_HEIGHT = 230
  const below = rect.top + rect.height + GAP
  const fitsBelow = below + CARD_HEIGHT < window.innerHeight
  const above = rect.top - CARD_HEIGHT - GAP
  // Below if it fits, above if that fits, otherwise pinned to the bottom
  // edge — never a negative offset that would put the card off screen.
  const top = fitsBelow ? below : above >= EDGE ? above : window.innerHeight - CARD_HEIGHT - EDGE

  const wanted = rect.left + rect.width / 2 - CARD_WIDTH / 2
  const left = Math.min(Math.max(EDGE, wanted), window.innerWidth - CARD_WIDTH - EDGE)

  return { top, left }
}
