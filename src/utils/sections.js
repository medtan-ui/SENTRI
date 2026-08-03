/**
 * sections.js
 * A "section" is the class group a student belongs to (e.g. "BSIT-3A") —
 * the unit an instructor reports on when SENTRI runs for more than one
 * class at a time.
 *
 * This mirrors functions/src/shared/sections.ts. The backend build can't
 * be imported into the frontend one, so this is a deliberate, narrow
 * duplication of two rules — the same kind already accepted for the fixed
 * module-id list — and not general business logic. If either side changes,
 * both must: a mismatched key here reads the wrong cohortAnalytics
 * document, which would silently show one section's numbers under
 * another's name.
 */

/** Long enough for real course-section codes, short enough to stay a label. */
export const MAX_SECTION_LENGTH = 40

/** The whole-cohort rollup — every student, section or not. */
export const ALL_SECTIONS_DOC_ID = 'current'

/**
 * Case- and separator-insensitive grouping key, so "BSIT 3A", "bsit-3a",
 * and "BSIT-3A" are one section rather than three. Returns null for
 * anything that isn't a usable section.
 * @param {unknown} section
 * @returns {string|null}
 */
export function normalizeSectionKey(section) {
  if (typeof section !== 'string') return null
  const key = section
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return key.length > 0 ? key : null
}

/**
 * Which cohortAnalytics document holds a section's rollup. A null/blank
 * section means the whole-cohort document, which is what the dashboard
 * shows by default.
 * @param {unknown} section
 * @returns {string}
 */
export function cohortDocId(section) {
  const key = normalizeSectionKey(section)
  return key === null ? ALL_SECTIONS_DOC_ID : `section__${key}`
}
