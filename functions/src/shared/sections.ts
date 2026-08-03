/**
 * shared/sections.ts
 * A "section" is the class group a student belongs to (e.g. "BSIT-3A") —
 * the unit an instructor actually reports on when SENTRI is run for more
 * than one class at a time. It is free text rather than a fixed list,
 * because section codes change every term and hardcoding them would mean a
 * deploy per term.
 *
 * Free text needs exactly two rules to stay useful, and both live here so
 * the auth module (which writes it) and the analytics module (which
 * buckets on it) can never disagree:
 *
 *   normalizeSectionKey — the case/spacing-insensitive identity, so
 *     "BSIT 3A", "bsit-3a", and "BSIT-3A" are one section and not three.
 *   cohortDocId — the cohortAnalytics document a section's rollup is
 *     stored at, derived from that same key so the id is stable no matter
 *     how the label was typed.
 *
 * The user profile keeps the label exactly as it was typed; only grouping
 * and document ids go through the normalized key.
 */

/** Long enough for real course-section codes, short enough to stay a label. */
export const MAX_SECTION_LENGTH = 40

/** The whole-cohort rollup — every student, section or not. */
export const ALL_SECTIONS_DOC_ID = 'current'

/**
 * Case- and separator-insensitive grouping key. Returns null for anything
 * that isn't a usable section, so "no section" is one explicit value
 * rather than a mix of null, '', and '   '.
 */
export function normalizeSectionKey(section: unknown): string | null {
  if (typeof section !== 'string') return null
  const key = section
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return key.length > 0 ? key : null
}

/**
 * Where a section's rollup is stored. A null/blank section means the
 * whole-cohort document, which is what the dashboard shows by default.
 */
export function cohortDocId(section: unknown): string {
  const key = normalizeSectionKey(section)
  return key === null ? ALL_SECTIONS_DOC_ID : `section__${key}`
}
