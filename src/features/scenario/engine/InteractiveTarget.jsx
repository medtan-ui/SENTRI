import React, { useEffect, useRef } from 'react'
import { useScenarioInteraction } from './ScenarioInteractionContext'
import styles from './InteractiveTarget.module.css'

/**
 * InteractiveTarget
 * Layer 1 of the affordance system. Wraps one real element inside a
 * cloned interface (a button, a toggle, a suggestion row — or, in
 * "decorate" mode, a real form control like a password input) and marks
 * it as the thing students can act on: a breathing accent ring, hover
 * lift, press feedback, a real focusable/keyboard-activatable control,
 * and registration so <AffordanceCoach> can find it by id.
 *
 * Two modes:
 *   - Trigger (pass onActivate): the wrapper itself is the control —
 *     role="button", click/Enter/Space fire onActivate. Used for
 *     buttons, links, toggles, suggestion rows.
 *   - Decorate (omit onActivate): the wrapper only adds the visual
 *     affordance around a real child control (e.g. <input>) and reports
 *     the student's first interaction on focus/click, without hijacking
 *     the child's own native behavior.
 *
 * Every element NOT wrapped in this component should be inert — see
 * the .decorative utility in the scene stylesheets, which sets
 * pointer-events: none so clicking scenery does nothing at all.
 */
export default function InteractiveTarget({
  targetId,
  label,
  onActivate,
  disabled = false,
  highlighted = false,
  className = '',
  children,
}) {
  const { registerTarget, unregisterTarget, notifyInteraction, pulseIdleActive } = useScenarioInteraction()
  const nodeRef = useRef(null)
  const isTrigger = Boolean(onActivate)

  useEffect(() => {
    registerTarget(targetId, nodeRef.current)
    return () => unregisterTarget(targetId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId])

  function handleClick(e) {
    if (disabled) return
    notifyInteraction()
    if (isTrigger) onActivate(e)
  }

  function handleKeyDown(e) {
    if (!isTrigger || disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      notifyInteraction()
      onActivate(e)
    }
  }

  function handleFocus() {
    if (!isTrigger) notifyInteraction()
  }

  return (
    <div
      ref={nodeRef}
      className={[
        styles.wrap,
        isTrigger ? styles.trigger : '',
        highlighted ? styles.highlighted : '',
        !highlighted && pulseIdleActive ? styles.idlePulse : '',
        disabled ? styles.disabled : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-interactive="true"
      data-target-id={targetId}
      role={isTrigger ? 'button' : undefined}
      tabIndex={isTrigger ? (disabled ? -1 : 0) : undefined}
      aria-label={isTrigger ? label : undefined}
      aria-disabled={isTrigger ? disabled : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {children}
    </div>
  )
}
