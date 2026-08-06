import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * loadModuleConfig is the single seam between "a module id" and
 * everything a student-facing page renders. It went from returning local
 * mock data to layering three Firestore documents over that data, which
 * makes it the one place a Firestore outage could blank out a lesson
 * mid-session.
 *
 * These tests are about that failure surface: every read is mocked, so
 * the behaviour under a missing document, a permission error, and a
 * partial document is asserted directly rather than hoped for.
 */
const getDocMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: (_db, collection, id) => ({ collection, id }),
  getDoc: (...args) => getDocMock(...args),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}))

const { loadModuleConfig } = await import('../src/services/moduleLoader')
const { MODULE_CONTENT_REGISTRY } = await import('../src/data/moduleContent')

const moduleId = 'password-security'
const authored = MODULE_CONTENT_REGISTRY[moduleId]

/** Resolves each of the three reads by the collection being queried. */
function mockReads({ modules, moduleLessons, moduleScenarios }) {
  getDocMock.mockImplementation((ref) => {
    const data = { modules, moduleLessons, moduleScenarios }[ref.collection]
    if (data instanceof Error) return Promise.reject(data)
    return Promise.resolve({ exists: () => Boolean(data), data: () => data })
  })
}

beforeEach(() => {
  getDocMock.mockReset()
})

describe('loadModuleConfig', () => {
  it('returns null for a module that is not part of the curriculum', async () => {
    mockReads({})
    expect(await loadModuleConfig('not-a-real-module')).toBeNull()
  })

  it('serves fully authored content when no documents exist yet', async () => {
    mockReads({})
    const config = await loadModuleConfig(moduleId)
    expect(config.title).toBe(authored.title)
    expect(config.lesson.sections).toHaveLength(authored.lesson.sections.length)
    expect(config.scenario.scenarios).toHaveLength(authored.scenario.scenarios.length)
  })

  it('layers admin edits over the authored content', async () => {
    mockReads({
      modules: { title: 'Admin-Renamed Module', description: 'Admin description.', difficulty: 'Hard' },
      moduleLessons: {
        sections: [{ id: 's1', title: 'Admin Section', content: 'Admin body.' }],
        videoId: 'dQw4w9WgXcQ',
      },
      moduleScenarios: {
        scenarios: [
          {
            scenarioId: authored.scenario.scenarios[0].scenarioId,
            scenarioTitle: 'Admin Scenario Title',
          },
        ],
      },
    })

    const config = await loadModuleConfig(moduleId)
    expect(config.title).toBe('Admin-Renamed Module')
    expect(config.description).toBe('Admin description.')
    expect(config.lesson.sections[0].title).toBe('Admin Section')
    expect(config.videoId).toBe('dQw4w9WgXcQ')
    expect(config.scenario.scenarios[0].scenarioTitle).toBe('Admin Scenario Title')
  })

  it("translates the admin's Easy/Medium/Hard scale to the student badge scale", async () => {
    // The Overview tab persists Easy/Medium/Hard; the Lesson Viewer's
    // badge is styled per Beginner/Intermediate/Advanced. Without this
    // the badge silently loses its colour.
    mockReads({ modules: { difficulty: 'Medium' } })
    expect((await loadModuleConfig(moduleId)).difficulty).toBe('Intermediate')
  })

  it('passes through a difficulty already on the student scale', async () => {
    mockReads({ modules: { difficulty: 'Advanced' } })
    expect((await loadModuleConfig(moduleId)).difficulty).toBe('Advanced')
  })

  it('falls back to authored content when Firestore rejects the read', async () => {
    // The important case: a student mid-module during a network blip or a
    // rules misconfiguration must still get a readable lesson, not a
    // blank page or a thrown error.
    mockReads({
      modules: new Error('permission-denied'),
      moduleLessons: new Error('unavailable'),
      moduleScenarios: new Error('unavailable'),
    })

    const config = await loadModuleConfig(moduleId)
    expect(config.title).toBe(authored.title)
    expect(config.lesson.sections).toHaveLength(authored.lesson.sections.length)
    expect(config.scenario.scenarios).toHaveLength(authored.scenario.scenarios.length)
  })

  it('keeps authored metadata when the module document has empty fields', async () => {
    mockReads({ modules: { title: '', description: '', difficulty: '' } })
    const config = await loadModuleConfig(moduleId)
    expect(config.title).toBe(authored.title)
    expect(config.description).toBe(authored.description)
    expect(config.difficulty).toBe(authored.difficulty)
  })

  it('preserves the curriculum ordering that only code knows', async () => {
    mockReads({ modules: { title: 'Anything' } })
    const config = await loadModuleConfig(moduleId)
    expect(config.previousModuleId).toBe(authored.previousModuleId)
    expect(config.moduleId).toBe(moduleId)
  })
})
