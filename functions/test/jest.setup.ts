/**
 * Runs before any test file is required (see jest.config.js's
 * setupFiles) — guarantees these env vars are in place before
 * shared/admin.ts calls admin.initializeApp(). Unit tests never make a
 * real network call, so pointing them at "an emulator" that isn't
 * running is harmless; integration tests rely on this being a real
 * emulator, started via `firebase emulators:exec`.
 */
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'demo-sentri-test'
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
