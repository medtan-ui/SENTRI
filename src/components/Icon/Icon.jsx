import React from 'react'

/**
 * Icon
 * One inline SVG set for the whole app's chrome and controls.
 *
 * Why this exists: the navigation, the stat cards and half the buttons
 * were labelled with emoji. Emoji are drawn by the operating system, so
 * the same "📚" is flat and orange on Windows, glossy and blue on macOS,
 * and a differently-proportioned glyph again on Android. They ignore
 * `color`, they don't align to a text baseline, they carry an unwanted
 * cartoon register, and a screen reader announces them by their Unicode
 * name ("open book") next to a label that already says Modules.
 *
 * These are a single stroke weight on a shared 24-grid, inherit
 * `currentColor` so a nav item's active state colours its icon for free,
 * and are `aria-hidden` because every one of them sits beside a real text
 * label. Nothing here is a picture worth describing; they are shape cues.
 *
 * Emoji are NOT banned from the app by this. Module identity icons (🔑,
 * 🎣, 🦠) are authored content — they are chosen per module in the admin
 * Module Configuration, they carry meaning a generic outline shape can't,
 * and they stay. This set replaces the decorative ones only.
 */

const PATHS = {
  // ── Navigation ──
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </>
  ),
  quiz: (
    <>
      <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M9.5 9h5M9.5 13h5M9.5 17h3" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21V11M11 21V5M16 21v-7M21 21v-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6.2M17.5 14.5A6 6 0 0 1 21 20" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6z" />
    </>
  ),
  // A pie chart, not a clock. The first attempt was a circle with a
  // single radius line to a point on the rim, which at 18px is exactly
  // what a clock face looks like — wrong meaning on a nav item sitting
  // two rows from "Modules".
  analytics: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9h-9z" />
      <path d="M15 3.6A9 9 0 0 1 20.4 9H15z" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),

  // ── Rewards ──
  bolt: (
    <>
      <path d="M13.5 3L5 13.5h5.5L10 21l8.5-10.5H13z" />
    </>
  ),
  flame: (
    <>
      <path d="M12 3c2.5 3.2 5.5 5 5.5 9a5.5 5.5 0 1 1-11 0c0-2 .9-3.4 2-4.6.3 1.2 1 2 2 2.2C10 7.5 10.8 5.2 12 3z" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 5.5H5.5A2.5 2.5 0 0 0 5.7 10 4 4 0 0 0 9 11.7M16 5.5h2.5A2.5 2.5 0 0 1 18.3 10 4 4 0 0 1 15 11.7" />
      <path d="M10 13h4l.6 4H9.4zM8 20h8" />
    </>
  ),
  star: (
    <>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.3l2.6 2.6 5-5.4" />
    </>
  ),

  // ── State / affordance ──
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4" />
      <path d="M6.3 7.8A17.2 17.2 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 3.9-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3.5 3.5l17 17" />
    </>
  ),
  cursor: (
    <>
      <path d="M6 3.5l12.5 7.6-5.4 1.3 3 5.6-2.5 1.3-3-5.6-3.4 4.3z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10.4 8.8l5 3.2-5 3.2z" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </>
  ),
  chevronRight: (
    <>
      <path d="M9.5 5.5l6.5 6.5-6.5 6.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 1.9" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.5l8.5 15h-17z" />
      <path d="M12 10v4M12 16.8v.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z" />
      <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
}

export const ICON_NAMES = Object.keys(PATHS)

/**
 * @param {{ name: keyof typeof PATHS, size?: number, strokeWidth?: number,
 *   filled?: boolean, className?: string, title?: string }} props
 *   `title` turns the icon into a labelled image for the rare case where
 *   it stands alone with no adjacent text; leaving it off (the default)
 *   hides the icon from assistive tech, which is correct beside a label.
 */
export default function Icon({ name, size = 20, strokeWidth = 1.75, filled = false, className = '', title }) {
  const path = PATHS[name]
  if (!path) return null

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  )
}
