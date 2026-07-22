/**
 * functions/index.js
 * ─────────────────────────────────────────────────────────────
 * Admin-only account management Cloud Functions.
 *
 * These exist because the client-side Firebase SDK can only ever manage
 * the currently signed-in user — creating, deleting, or resetting the
 * password of a *different* user requires the Admin SDK, which only
 * runs in a trusted server environment (here: Cloud Functions).
 *
 * Every function re-verifies on the server that the caller is signed in
 * AND has role: 'admin' in Firestore before doing anything privileged.
 * Never trust a role claim sent from the client — always look it up.
 *
 * Every privileged action also writes an entry to the `auditLogs`
 * collection (who did what, to which account, when). Clients — including
 * admins — cannot read or write that collection directly (see
 * firestore.rules); it's exposed read-only via getAuditLog below.
 * ─────────────────────────────────────────────────────────────
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2')
const admin = require('firebase-admin')

admin.initializeApp()
setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

const db = admin.firestore()
const USERS_COLLECTION = 'users'
const AUDIT_LOG_COLLECTION = 'auditLogs'
const VALID_ROLES = ['student', 'admin']
const MIN_PASSWORD_LENGTH = 8

/**
 * Throws unless the caller is signed in and their Firestore profile has
 * role: 'admin'. Returns the caller's identity for audit logging so
 * callers don't have to re-fetch it.
 * @returns {Promise<{ uid: string, email: string }>}
 */
async function assertIsAdmin(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.')
  }
  const callerSnap = await db.collection(USERS_COLLECTION).doc(request.auth.uid).get()
  if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can perform this action.')
  }
  return { uid: request.auth.uid, email: callerSnap.data().email || request.auth.token.email || null }
}

function assertValidRole(role) {
  if (!VALID_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', `role must be one of: ${VALID_ROLES.join(', ')}`)
  }
}

/** Same complexity rule enforced client-side in src/utils/passwordPolicy.js. */
function assertValidPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpsError('invalid-argument', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new HttpsError(
      'invalid-argument',
      'Password must include an uppercase letter, a lowercase letter, and a number.'
    )
  }
}

/**
 * Records an admin action. Failures here are logged but never block the
 * action itself — a missed audit entry shouldn't stop an admin from,
 * say, disabling a compromised account.
 */
async function writeAuditLog({ action, actor, targetUid, targetEmail, details }) {
  try {
    await db.collection(AUDIT_LOG_COLLECTION).add({
      action,
      actorUid: actor.uid,
      actorEmail: actor.email,
      targetUid: targetUid || null,
      targetEmail: targetEmail || null,
      details: details || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error('[auditLog] failed to write entry:', action, err)
  }
}

/**
 * createUserAccount — admin-only.
 * data: { email, password, displayName, role }
 * Creates the Firebase Auth user, then its matching Firestore profile.
 */
exports.createUserAccount = onCall(async (request) => {
  const actor = await assertIsAdmin(request)

  const { email, password, displayName, role } = request.data || {}
  if (!email || !displayName) {
    throw new HttpsError('invalid-argument', 'email and displayName are required.')
  }
  assertValidRole(role)
  assertValidPassword(password)

  const normalizedEmail = String(email).trim().toLowerCase()

  let userRecord
  try {
    userRecord = await admin.auth().createUser({
      email: normalizedEmail,
      password,
      displayName,
    })
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists.')
    }
    if (err.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Please provide a valid email address.')
    }
    throw new HttpsError('internal', 'Unable to create the account.')
  }

  await db.collection(USERS_COLLECTION).doc(userRecord.uid).set({
    role,
    displayName,
    email: normalizedEmail,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  await writeAuditLog({
    action: 'create_user',
    actor,
    targetUid: userRecord.uid,
    targetEmail: normalizedEmail,
    details: { role },
  })

  return { uid: userRecord.uid }
})

/**
 * deleteUserAccount — admin-only.
 * data: { uid }
 * Removes both the Firebase Auth user and their Firestore profile.
 */
exports.deleteUserAccount = onCall(async (request) => {
  const actor = await assertIsAdmin(request)

  const { uid } = request.data || {}
  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid is required.')
  }
  if (uid === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'You cannot delete your own account.')
  }

  const targetSnap = await db.collection(USERS_COLLECTION).doc(uid).get()
  const targetEmail = targetSnap.exists ? targetSnap.data().email : null

  try {
    await admin.auth().deleteUser(uid)
  } catch (err) {
    // Auth record already gone is fine — still clean up the Firestore profile below.
    if (err.code !== 'auth/user-not-found') {
      throw new HttpsError('internal', 'Unable to delete the account.')
    }
  }

  await db.collection(USERS_COLLECTION).doc(uid).delete()

  await writeAuditLog({ action: 'delete_user', actor, targetUid: uid, targetEmail })

  return { success: true }
})

/**
 * resetUserPassword — admin-only.
 * data: { uid, newPassword }
 * Directly sets a new password for another user's account. This is
 * distinct from the self-service "forgot password" email flow in
 * src/services/authService.js, which the user triggers for themselves.
 */
exports.resetUserPassword = onCall(async (request) => {
  const actor = await assertIsAdmin(request)

  const { uid, newPassword } = request.data || {}
  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid is required.')
  }
  assertValidPassword(newPassword)

  try {
    await admin.auth().updateUser(uid, { password: newPassword })
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'No account found for this user.')
    }
    throw new HttpsError('internal', 'Unable to reset the password.')
  }

  const targetSnap = await db.collection(USERS_COLLECTION).doc(uid).get()
  const targetEmail = targetSnap.exists ? targetSnap.data().email : null
  await writeAuditLog({ action: 'reset_password', actor, targetUid: uid, targetEmail })

  return { success: true }
})

/**
 * listUsers — admin-only.
 * Returns all Firestore user profiles for an account management screen.
 * Client-side Firestore rules deny reading other users' docs directly
 * (see firestore.rules), so this function is the only way to list them —
 * and it verifies the caller is an admin before doing so.
 */
exports.listUsers = onCall(async (request) => {
  await assertIsAdmin(request)

  const snap = await db.collection(USERS_COLLECTION).get()

  return {
    users: snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        uid: docSnap.id,
        role: data.role,
        displayName: data.displayName,
        email: data.email,
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      }
    }),
  }
})

/**
 * getAuditLog — admin-only.
 * data: { limit? }  defaults to 50, capped at 200.
 * Returns the most recent admin account-management actions.
 */
exports.getAuditLog = onCall(async (request) => {
  await assertIsAdmin(request)

  const limit = Math.min(Number(request.data?.limit) || 50, 200)
  const snap = await db.collection(AUDIT_LOG_COLLECTION).orderBy('createdAt', 'desc').limit(limit).get()

  return {
    logs: snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        action: data.action,
        actorUid: data.actorUid,
        actorEmail: data.actorEmail,
        targetUid: data.targetUid,
        targetEmail: data.targetEmail,
        details: data.details,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      }
    }),
  }
})
