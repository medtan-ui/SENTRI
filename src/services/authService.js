/**
 * authService.js
 * ─────────────────────────────────────────────────────────────
 * Firebase Authentication + Firestore role resolution.
 *
 * Login flow: Firebase Authentication → email verification check → read
 * the learner's Firestore "users/{uid}" profile doc → determine role
 * ('student' | 'admin').
 *
 * Firestore schema expected at users/{uid}:
 *   { role: 'student' | 'admin', displayName: string, email: string }
 *
 * SECURITY NOTES
 *  • Credentials are sent directly to Firebase over HTTPS; this file
 *    never logs or stores raw passwords.
 *  • A Firebase Auth account with no matching Firestore profile is
 *    signed back out immediately — authentication alone is not enough
 *    to reach a dashboard, the role must be verified server-side data.
 *  • Login failures return a generic message so we never reveal
 *    whether a given email is registered.
 *  • Unverified emails are surfaced as a typed signal (not a generic
 *    error) so the UI can route to the right screen instead of just
 *    showing a failure banner.
 * ─────────────────────────────────────────────────────────────
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyPasswordResetCode,
  confirmPasswordReset,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from './firebase'
import { validatePassword } from '../utils/passwordPolicy'
import { friendlyCallableError } from './callableErrors'

const USERS_COLLECTION = 'users'
const VALID_ROLES = ['student', 'admin']

// Where password-reset emails link back to (see sendResetEmail below).
const RESET_PASSWORD_URL = `${window.location.origin}/reset-password`

// Firebase Auth/Firestore error codes → user-friendly copy.
const ERROR_MESSAGES = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact your administrator.',
  'auth/user-not-found': 'Incorrect email or password. Please try again.',
  'auth/wrong-password': 'Incorrect email or password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/missing-password': 'Please enter your password.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/requires-recent-login': 'Please sign out and sign back in, then try again.',
  // Firestore error codes (no "auth/" prefix) — surfaced during role lookup.
  'permission-denied': 'Unable to verify your account permissions. Please contact your administrator.',
  unavailable: 'Network error. Please check your connection and try again.',
}

function _friendlyError(err) {
  return ERROR_MESSAGES[err?.code] || 'Unable to sign in. Please try again.'
}

/**
 * Reads the learner's Firestore profile and merges it with Firebase Auth
 * fields into the app-level user shape consumed by the UI.
 * @returns {Promise<{ uid, email, role, displayName, emailVerified } | null>}
 *   null when no valid profile/role exists for this account.
 */
async function _resolveUserProfile(firebaseUser) {
  const profileSnap = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid))

  if (!profileSnap.exists()) return null

  const data = profileSnap.data()
  if (!VALID_ROLES.includes(data.role)) return null
  // A fresh sign-in for a disabled account never reaches here — Firebase
  // Auth itself rejects it with auth/user-disabled first (see
  // ERROR_MESSAGES below). This covers the other case: an already-open
  // session whose account gets deactivated mid-session. Treating it the
  // same as "no profile" signs it out on the next auth-state refresh.
  if (data.status === 'disabled') return null

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    role: data.role,
    displayName: data.displayName || firebaseUser.displayName || firebaseUser.email,
    nickname: data.nickname || data.displayName || firebaseUser.displayName || firebaseUser.email,
    emailVerified: firebaseUser.emailVerified,
    mustChangePassword: !!data.mustChangePassword,
  }
}

/** Shared finish-up once we have a real, authenticated Firebase user. */
async function _finishLogin(firebaseUser) {
  const profile = await _resolveUserProfile(firebaseUser)
  if (!profile) {
    await signOut(auth)
    throw new Error('No account record found for this user. Please contact your administrator.')
  }
  return profile
}

/**
 * Sign in with email/password, then resolve the account's role from Firestore.
 *
 * @param {string} email
 * @param {string} password
 * @param {boolean} [rememberMe=false]  true persists the session across
 *   browser restarts; false keeps it scoped to the current tab session.
 * @returns {Promise<{ uid, email, role, displayName, emailVerified }>}
 * @throws {Error} user-friendly message on failure
 */
export async function loginWithEmail(email, password, rememberMe = false) {
  const trimmedEmail = (email || '').trim().toLowerCase()

  try {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    )

    const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password)
    return await _finishLogin(credential.user)
  } catch (err) {
    // Logged for local debugging only — the thrown message stays generic.
    // Check the browser console for the real Firebase/Firestore error code
    // (e.g. "permission-denied" usually means Firestore rules aren't
    // deployed yet, or the users/{uid} doc doesn't exist/match the UID).
    console.error('[authService] login failed:', err)
    if (err?.code) {
      throw new Error(_friendlyError(err))
    }
    // Re-throw errors we raised ourselves above (already user-friendly).
    throw err
  }
}

/**
 * Register a new student account — public self-service, no admin required.
 * Creates the Firebase Auth user and Firestore profile server-side via the
 * registerStudentAccount Cloud Function (which only ever creates a
 * student, regardless of what's sent — role is hardcoded server-side).
 * Does not sign the caller in; see AuthContext's register(), which signs
 * in immediately after this succeeds so the new student doesn't have to
 * retype what they just entered.
 * @param {{ displayName: string, nickname: string, email: string, password: string }} input
 * @returns {Promise<void>}
 * @throws {Error} user-friendly message on failure
 */
export async function registerStudentAccount(input) {
  const { valid, errors } = validatePassword(input?.password)
  if (!valid) {
    throw new Error(`Password requirements not met: ${errors.join(', ')}.`)
  }
  try {
    const call = httpsCallable(functions, 'registerStudentAccount')
    await call({
      displayName: input.displayName,
      nickname: input.nickname,
      email: input.email,
      password: input.password,
    })
  } catch (err) {
    throw new Error(friendlyCallableError(err))
  }
}

/**
 * Sign the current user out of Firebase.
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  await signOut(auth)
}

/**
 * Subscribe to Firebase auth state changes (login, logout, restored
 * session on page load). Resolves the Firestore role profile on every
 * change so a refreshed/persisted session restores the correct role too.
 *
 * @param {(user: { uid, email, role, displayName, emailVerified } | null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }
    try {
      const profile = await _resolveUserProfile(firebaseUser)
      callback(profile)
    } catch (err) {
      console.error('[authService] session restore failed:', err)
      callback(null)
    }
  })
}

/**
 * Reload the current Firebase user and re-resolve their profile — used
 * after they claim to have clicked an email verification link, so the
 * app can pick up emailVerified: true without a full logout/login.
 * @returns {Promise<{ uid, email, role, displayName, emailVerified } | null>}
 */
export async function refreshCurrentUser() {
  if (!auth.currentUser) return null
  await auth.currentUser.reload()
  return _resolveUserProfile(auth.currentUser)
}

/**
 * Send a verification email to the currently signed-in user.
 * @returns {Promise<void>}
 */
export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error('You must be signed in to request a verification email.')
  }
  try {
    await sendEmailVerification(auth.currentUser)
  } catch (err) {
    if (err?.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait a moment and try again.')
    }
    throw new Error('Unable to send the verification email right now. Please try again later.')
  }
}

/**
 * Send a Firebase password reset email that links back into this app's
 * own /reset-password page (instead of Firebase's default hosted page),
 * so the reset form can apply our password policy and UI.
 *
 * Deliberately does not reveal whether the address is registered:
 * "auth/user-not-found" resolves silently, same as a real send, so the
 * UI can always show the same generic confirmation message. Only
 * input/network/rate-limit problems are surfaced as errors.
 *
 * @param {string} email
 * @returns {Promise<void>}
 * @throws {Error} user-friendly message for genuine failures only
 */
export async function sendResetEmail(email) {
  const trimmedEmail = (email || '').trim().toLowerCase()

  try {
    await sendPasswordResetEmail(auth, trimmedEmail, {
      url: RESET_PASSWORD_URL,
      handleCodeInApp: true,
    })
  } catch (err) {
    if (err?.code === 'auth/user-not-found') return
    if (err?.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.')
    }
    if (err?.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait a moment and try again.')
    }
    if (err?.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.')
    }
    throw new Error('Unable to send the reset email right now. Please try again later.')
  }
}

/**
 * Verify a password-reset link's oobCode and return the account email it
 * belongs to, for display on the reset-password confirmation page.
 * @param {string} oobCode
 * @returns {Promise<string>} the account email
 * @throws {Error} user-friendly message if the code is invalid/expired
 */
export async function verifyResetCode(oobCode) {
  try {
    return await verifyPasswordResetCode(auth, oobCode)
  } catch (err) {
    if (err?.code === 'auth/expired-action-code') {
      throw new Error('This reset link has expired. Please request a new one.')
    }
    throw new Error('This reset link is invalid. Please request a new one.')
  }
}

/**
 * Complete a password reset with a new password, enforcing the same
 * policy used everywhere else in the app (see utils/passwordPolicy.js).
 * @param {string} oobCode
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function confirmReset(oobCode, newPassword) {
  const { valid, errors } = validatePassword(newPassword)
  if (!valid) {
    throw new Error(`Password requirements not met: ${errors.join(', ')}.`)
  }
  try {
    await confirmPasswordReset(auth, oobCode, newPassword)
  } catch (err) {
    if (err?.code === 'auth/expired-action-code') {
      throw new Error('This reset link has expired. Please request a new one.')
    }
    if (err?.code === 'auth/weak-password') {
      throw new Error('Please choose a stronger password.')
    }
    throw new Error('Unable to reset your password right now. Please try again.')
  }
}

/**
 * Change the signed-in user's own password (self-service). Used by the
 * forced first-login flow when an account still has mustChangePassword
 * set — goes through the changeOwnPassword Cloud Function rather than
 * the client SDK's updatePassword() because clearing mustChangePassword
 * on the Firestore profile requires the Admin SDK (see firestore.rules).
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function changeOwnPassword(newPassword) {
  const { valid, errors } = validatePassword(newPassword)
  if (!valid) {
    throw new Error(`Password requirements not met: ${errors.join(', ')}.`)
  }
  try {
    const call = httpsCallable(functions, 'changeOwnPassword')
    await call({ newPassword })
  } catch (err) {
    if (err?.code === 'functions/unauthenticated') {
      throw new Error('Your session has expired. Please sign in again.')
    }
    if (err?.code === 'functions/invalid-argument') {
      throw new Error(err.message || 'Please check your new password.')
    }
    throw new Error('Unable to update your password right now. Please try again.')
  }
}

/**
 * Update the signed-in user's own nickname (self-service, from Profile) —
 * goes through the updateOwnNickname Cloud Function rather than a direct
 * Firestore write, since users/{uid} is Admin-SDK-only (see firestore.rules).
 * Lets an account created before the nickname feature existed set one for
 * the first time.
 * @param {string} nickname
 * @returns {Promise<void>}
 */
export async function updateOwnNickname(nickname) {
  const trimmed = (nickname || '').trim()
  if (!trimmed) {
    throw new Error('Please enter a nickname.')
  }
  try {
    const call = httpsCallable(functions, 'updateOwnNickname')
    await call({ nickname: trimmed })
  } catch (err) {
    if (err?.code === 'functions/unauthenticated') {
      throw new Error('Your session has expired. Please sign in again.')
    }
    if (err?.code === 'functions/invalid-argument') {
      throw new Error(err.message || 'Please check your nickname.')
    }
    throw new Error('Unable to update your nickname right now. Please try again.')
  }
}

/**
 * Change the signed-in user's own password (self-service, from Profile),
 * verifying their actual current password first via Firebase Auth's
 * re-authentication flow before calling the client SDK's own updatePassword
 * — this is "Firebase Authentication's password update flow" proper,
 * distinct from changeOwnPassword() above (that one is Admin-SDK-based,
 * with no current-password check, and exists only for the forced
 * temporary-password flow where the user doesn't know a "current"
 * password yet).
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function updateOwnPassword(currentPassword, newPassword) {
  const { valid, errors } = validatePassword(newPassword)
  if (!valid) {
    throw new Error(`Password requirements not met: ${errors.join(', ')}.`)
  }
  if (!auth.currentUser?.email) {
    throw new Error('You must be signed in.')
  }
  try {
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, credential)
  } catch (err) {
    if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
      throw new Error('Your current password is incorrect.')
    }
    if (err?.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please wait a moment and try again.')
    }
    if (err?.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.')
    }
    throw new Error('Unable to verify your current password right now. Please try again.')
  }
  try {
    await updatePassword(auth.currentUser, newPassword)
  } catch (err) {
    if (err?.code === 'auth/weak-password') {
      throw new Error('Please choose a stronger password.')
    }
    if (err?.code === 'auth/requires-recent-login') {
      throw new Error('Please sign out and sign back in, then try again.')
    }
    throw new Error('Unable to update your password right now. Please try again.')
  }
}
