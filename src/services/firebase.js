/**
 * firebase.js
 * ─────────────────────────────────────────────────────────────
 * Firebase app initialization.
 *
 * Config values are read from Vite environment variables (see .env /
 * .env.example) and are never hardcoded. Firebase web config values are
 * public client identifiers, not secrets — access to data is enforced by
 * Firebase Authentication + Firestore/Storage Security Rules, not by
 * hiding these values.
 *
 * App Check (see bottom of file) is the piece that actually verifies
 * requests come from a genuine instance of this app, not a scripted
 * client using the same public config values.
 * ─────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Fails fast in development if the .env file is missing/misconfigured,
  // instead of surfacing a confusing Firebase SDK error later.
  console.error(
    'Firebase config is missing. Check that .env defines all VITE_FIREBASE_* variables.'
  )
}

// Guard against re-initialization during hot module reloads in dev.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)

// ── App Check ───────────────────────────────────────────────────────
// Requires a reCAPTCHA v3 site key (Google reCAPTCHA admin console, free)
// registered against this app in Firebase Console → App Check. Until
// VITE_RECAPTCHA_V3_SITE_KEY is set, App Check stays uninitialized rather
// than crashing the app — Auth/Firestore/Functions calls still work, they
// just aren't attested yet.
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY

if (import.meta.env.DEV) {
  // Lets App Check work on localhost without a real reCAPTCHA verdict.
  // On first run this prints a debug token to the browser console —
  // register it in Firebase Console → App Check → Manage debug tokens.
  // Never rely on this in production; it's dev-only by design.
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}

export const appCheck = recaptchaSiteKey
  ? initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  : (console.warn(
      '[firebase] VITE_RECAPTCHA_V3_SITE_KEY is not set — App Check is disabled. ' +
        'Requests are not attested until this is configured.'
    ),
    null)

export default app
