import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/**
 * test/setup.js
 * Runs before every test file.
 *
 * The single most important thing here is the firebase mock. Importing
 * almost anything under src/services pulls in src/services/firebase.js,
 * which calls initializeApp() against real env config and would either
 * blow up (no .env in CI) or, worse, reach a live project from a test
 * run. Mocking that one module at the boundary keeps every service
 * importable without a single test needing to know Firebase exists.
 *
 * Individual tests still mock the Firestore *functions* they care about
 * (getDoc, setDoc, …) — this only neutralizes app initialization.
 */
vi.mock('../src/services/firebase.js', () => ({
  auth: {},
  db: {},
  functions: {},
  appCheck: null,
  default: {},
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
