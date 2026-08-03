/**
 * Unit tests for section grouping — the rules that decide which students
 * a cohort report covers and which document it is written to.
 *
 * These have a counterpart in the frontend suite (test/reporting.test.js),
 * written against the same inputs on purpose: src/utils/sections.js is a
 * deliberate duplication of this module, and the failure mode of a drift
 * between them is silent rather than loud — the dashboard would read one
 * section's rollup and label it with another's name.
 */
import { ALL_SECTIONS_DOC_ID, cohortDocId, normalizeSectionKey } from '../../src/shared/sections'
import { sectionSchema } from '../../src/auth/validators'

describe('normalizeSectionKey', () => {
  it('treats case and separator variations as one section', () => {
    const variants = ['BSIT-3A', 'bsit 3a', 'BSIT_3A', '  bsit-3a  ', 'BSIT--3A']
    const keys = new Set(variants.map((v) => normalizeSectionKey(v)))
    expect(keys).toEqual(new Set(['bsit-3a']))
  })

  it('collapses every flavour of "no section" to null', () => {
    expect(normalizeSectionKey(null)).toBeNull()
    expect(normalizeSectionKey(undefined)).toBeNull()
    expect(normalizeSectionKey('')).toBeNull()
    expect(normalizeSectionKey('   ')).toBeNull()
    // Punctuation alone carries no identity — without this it would key a
    // section on the empty string, which is the "everyone" bucket.
    expect(normalizeSectionKey('---')).toBeNull()
    expect(normalizeSectionKey(42)).toBeNull()
  })
})

describe('cohortDocId', () => {
  it('sends an absent section to the whole-cohort document', () => {
    expect(cohortDocId(null)).toBe(ALL_SECTIONS_DOC_ID)
    expect(cohortDocId('')).toBe(ALL_SECTIONS_DOC_ID)
    expect(cohortDocId(undefined)).toBe(ALL_SECTIONS_DOC_ID)
  })

  it('gives a section its own document, stable across how it was typed', () => {
    expect(cohortDocId('BSIT-3A')).toBe('section__bsit-3a')
    expect(cohortDocId('bsit 3a')).toBe(cohortDocId('BSIT-3A'))
  })

  it('never produces a document id containing a path separator', () => {
    // A '/' here would address a subcollection rather than a document.
    expect(cohortDocId('BSIT-3A / evening')).not.toContain('/')
  })
})

describe('sectionSchema', () => {
  it('accepts real section codes', () => {
    ;['BSIT-3A', 'BSIT 3A', 'CS_101', 'IT-3.1', 'BSIT-3A/evening'].forEach((value) => {
      expect(sectionSchema.safeParse(value).success).toBe(true)
    })
  })

  it('accepts the empty string, which is how an admin clears an assignment', () => {
    expect(sectionSchema.safeParse('').success).toBe(true)
    expect(sectionSchema.safeParse(null).success).toBe(true)
    expect(sectionSchema.safeParse(undefined).success).toBe(true)
  })

  it('rejects a label long enough to threaten the derived document id', () => {
    expect(sectionSchema.safeParse('A'.repeat(41)).success).toBe(false)
  })

  it('rejects characters that have no business in a class code', () => {
    ;['<script>', 'BSIT#3A', '-leading-dash'].forEach((value) => {
      expect(sectionSchema.safeParse(value).success).toBe(false)
    })
  })
})
