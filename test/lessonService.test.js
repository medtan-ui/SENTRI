import { describe, expect, it } from 'vitest'
import { normalizeLesson, LESSON_CONTENT_VERSION } from '../src/services/lessonService'
import { MODULE_CONTENT_REGISTRY } from '../src/data/moduleContent'

/**
 * normalizeLesson is what stands between a Firestore document and the
 * student Lesson Viewer, which indexes straight into `lesson.sections`,
 * `lesson.objectives`, and friends. Now that the viewer reads Firestore
 * rather than local files, a half-written or legacy-shaped document would
 * crash a student's lesson page — these tests pin the "degrade to
 * authored content, never throw" contract that prevents that.
 */
describe('normalizeLesson', () => {
  const moduleId = 'password-security'
  const authored = MODULE_CONTENT_REGISTRY[moduleId]

  it('returns the authored lesson when no document exists yet', () => {
    const result = normalizeLesson(null, moduleId)
    expect(result.sections).toHaveLength(authored.lesson.sections.length)
    expect(result.sections[0].title).toBe(authored.lesson.sections[0].title)
    expect(result.contentVersion).toBe(LESSON_CONTENT_VERSION)
  })

  it('returns null for a module id that is not part of the curriculum', () => {
    expect(normalizeLesson(null, 'not-a-real-module')).toBeNull()
  })

  it('falls back to authored content for a legacy document with no sections', () => {
    // The old model stored a single `lessonContent` blob. Nothing ever
    // read those documents, so there is no student-visible content to
    // preserve — serving the real authored lesson beats machine-
    // translating placeholder text into sections.
    const legacy = {
      introduction: 'Old intro',
      lessonContent: 'Old body',
      realWorldExample: 'Old example',
      objectives: ['Old objective'],
    }
    const result = normalizeLesson(legacy, moduleId)
    expect(result.sections).toHaveLength(authored.lesson.sections.length)
    expect(result.objectives).toEqual(authored.lesson.objectives)
  })

  it('uses stored sections when they exist', () => {
    const stored = {
      sections: [{ id: 's1', title: 'Custom Section', content: 'Custom body.' }],
      objectives: ['Custom objective'],
    }
    const result = normalizeLesson(stored, moduleId)
    expect(result.sections).toEqual([{ id: 's1', title: 'Custom Section', content: 'Custom body.' }])
    expect(result.objectives).toEqual(['Custom objective'])
  })

  it('backfills an id and title for a section missing them', () => {
    const stored = { sections: [{ content: 'Body with no title.' }] }
    const [section] = normalizeLesson(stored, moduleId).sections
    expect(section.id).toBeTruthy()
    expect(section.title).toBeTruthy()
    expect(section.content).toBe('Body with no title.')
  })

  it('falls back per field, not all-or-nothing', () => {
    // A document with sections but an empty objectives list should keep
    // its sections and borrow the authored objectives — a lesson page
    // with an empty "Learning Objectives" heading reads as broken.
    const stored = { sections: [{ id: 's1', title: 'T', content: 'C' }], objectives: [] }
    const result = normalizeLesson(stored, moduleId)
    expect(result.sections).toHaveLength(1)
    expect(result.objectives).toEqual(authored.lesson.objectives)
  })

  it('drops non-string entries from list fields', () => {
    const stored = {
      sections: [{ id: 's1', title: 'T', content: 'C' }],
      bestPractices: ['Real practice', null, 42],
    }
    expect(normalizeLesson(stored, moduleId).bestPractices).toEqual(['Real practice'])
  })

  it('normalizes references so every entry has the keys the viewer renders', () => {
    const stored = {
      sections: [{ id: 's1', title: 'T', content: 'C' }],
      references: [{ title: 'A source' }, 'not-an-object'],
    }
    const [reference, ...rest] = normalizeLesson(stored, moduleId).references
    expect(rest).toHaveLength(0)
    expect(reference.id).toBeTruthy()
    expect(reference.title).toBe('A source')
    expect(reference.link).toBe('')
  })

  it('keeps an empty videoId rather than treating it as missing', () => {
    // '' is a real, meaningful value here: "no video recorded yet".
    // Falling back to the authored value would be identical today but
    // would hide a deliberate clearing of the field tomorrow.
    const stored = { sections: [{ id: 's1', title: 'T', content: 'C' }], videoId: '' }
    expect(normalizeLesson(stored, moduleId).videoId).toBe('')
  })

  it('never throws on a section array full of junk', () => {
    const stored = { sections: [null, undefined, 'text', { title: 'Real', content: 'Body' }] }
    const result = normalizeLesson(stored, moduleId)
    expect(result.sections).toHaveLength(1)
    expect(result.sections[0].title).toBe('Real')
  })
})

describe('authored lesson content', () => {
  it('gives every module a complete, renderable lesson', () => {
    Object.entries(MODULE_CONTENT_REGISTRY).forEach(([moduleId, data]) => {
      const lesson = normalizeLesson(null, moduleId)
      expect(lesson, `${moduleId} has no lesson`).toBeTruthy()
      expect(lesson.sections.length, `${moduleId} has no sections`).toBeGreaterThan(0)
      lesson.sections.forEach((section) => {
        expect(section.title.trim(), `${moduleId}/${section.id} has no title`).not.toBe('')
        expect(section.content.trim(), `${moduleId}/${section.id} has no content`).not.toBe('')
      })
      expect(lesson.objectives.length, `${moduleId} has no objectives`).toBeGreaterThan(0)
      expect(data.title).toBeTruthy()
    })
  })

  it('gives every section a unique id within its module', () => {
    Object.keys(MODULE_CONTENT_REGISTRY).forEach((moduleId) => {
      const ids = normalizeLesson(null, moduleId).sections.map((s) => s.id)
      expect(new Set(ids).size, `${moduleId} has duplicate section ids`).toBe(ids.length)
    })
  })
})
