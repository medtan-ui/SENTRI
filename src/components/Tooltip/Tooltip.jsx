import React from 'react'
import styles from './Tooltip.module.css'

/**
 * Tooltip
 * A CSS-only hover/focus bubble wrapping any element — including a disabled
 * button, since it's the wrapping span (not the button) that receives the
 * hover/focus, so the message still shows up even though disabled elements
 * themselves don't reliably fire hover states. Built because a native
 * `title` on a disabled button is a weak affordance: slow to appear, easy
 * to miss, and unavailable on touch devices.
 * `fullWidth` makes the wrapper stretch to fill its parent instead of
 * shrinking to the child's size — needed when the wrapped element itself
 * relies on `width: 100%` (e.g. a full-width card button), since without
 * it the wrapper's own default sizing would otherwise cap that width.
 * @param {{ label?: string|null, fullWidth?: boolean, children: React.ReactNode }} props
 */
export default function Tooltip({ label, fullWidth = false, children }) {
  if (!label) return children
  return (
    <span className={[styles.wrap, fullWidth ? styles.fullWidth : ''].filter(Boolean).join(' ')} tabIndex={0}>
      {children}
      <span className={styles.bubble} role="tooltip">{label}</span>
    </span>
  )
}
