/**
 * auth/repository.ts
 * All direct Admin SDK (Auth + Firestore) calls for account management.
 * Firebase Auth error codes are translated to AppError here so the service
 * layer never has to know about `err.code === 'auth/...'` strings.
 */
import { admin, authAdmin, db } from '../shared/admin'
import { COLLECTIONS, REAL_MODULE_IDS } from '../shared/constants'
import { AppError } from '../shared/errors'
import { AuditLogEntry, UserProfile } from './models'

export async function createAuthUser(params: {
  email: string
  password: string
  displayName: string
}): Promise<admin.auth.UserRecord> {
  try {
    return await authAdmin.createUser(params)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'auth/email-already-exists') {
      throw new AppError('already-exists', 'An account with this email already exists.')
    }
    if (code === 'auth/invalid-email') {
      throw new AppError('invalid-argument', 'Please provide a valid email address.')
    }
    throw new AppError('internal', 'Unable to create the account.')
  }
}

export async function deleteAuthUser(uid: string): Promise<void> {
  try {
    await authAdmin.deleteUser(uid)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code !== 'auth/user-not-found') {
      throw new AppError('internal', 'Unable to delete the account.')
    }
  }
}

export async function updateAuthUserPassword(uid: string, newPassword: string): Promise<void> {
  try {
    await authAdmin.updateUser(uid, { password: newPassword })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'auth/user-not-found') {
      throw new AppError('not-found', 'No account found for this user.')
    }
    throw new AppError('internal', 'Unable to update the password.')
  }
}

export async function setUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await db.collection(COLLECTIONS.USERS).doc(uid).set(profile)
}

export async function getUserProfile(uid: string): Promise<(UserProfile & { email?: string }) | null> {
  const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get()
  return snap.exists ? (snap.data() as UserProfile) : null
}

export async function deleteUserProfile(uid: string): Promise<void> {
  await db.collection(COLLECTIONS.USERS).doc(uid).delete()
}

/**
 * Removes every other collection that accumulates data against a student's
 * uid, so deleting an account doesn't leave orphaned progress/analytics rows
 * behind forever. moduleProgress/learningAnalytics use a `${uid}_${moduleId}`
 * doc id (no query needed — delete on a non-existent doc is a harmless
 * no-op); quizAttempts/scenario_decision_records/analyticsEvents are queried
 * by their owning-uid field first. Deliberately NOT touched: moduleAssignments
 * (curriculum config, not per-student) and auditLogs (the record that this
 * deletion happened should outlive the deletion itself).
 */
export async function deleteStudentData(uid: string): Promise<void> {
  const directDocDeletes = REAL_MODULE_IDS.flatMap((moduleId) => [
    db.collection(COLLECTIONS.MODULE_PROGRESS).doc(`${uid}_${moduleId}`).delete(),
    db.collection(COLLECTIONS.LEARNING_ANALYTICS).doc(`${uid}_${moduleId}`).delete(),
  ])

  const queriedCollections: Array<[string, string]> = [
    [COLLECTIONS.QUIZ_ATTEMPTS, 'userId'],
    [COLLECTIONS.SCENARIO_DECISION_RECORDS, 'user_id'],
    [COLLECTIONS.ANALYTICS_EVENTS, 'userId'],
  ]
  const queriedDeletes = queriedCollections.map(async ([collectionName, field]) => {
    const snap = await db.collection(collectionName).where(field, '==', uid).get()
    await Promise.all(snap.docs.map((docSnap) => docSnap.ref.delete()))
  })

  await Promise.all([
    ...directDocDeletes,
    db.collection(COLLECTIONS.STUDENT_ANALYTICS).doc(uid).delete(),
    ...queriedDeletes,
  ])
}

export async function setMustChangePassword(uid: string, mustChangePassword: boolean): Promise<void> {
  await db.collection(COLLECTIONS.USERS).doc(uid).set({ mustChangePassword }, { merge: true })
}

export interface ListedUser {
  uid: string
  role: string
  displayName: string
  email: string
  status: string
  createdAt: string | null
}

export async function listUserProfiles(): Promise<ListedUser[]> {
  const snap = await db.collection(COLLECTIONS.USERS).get()
  return snap.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      uid: docSnap.id,
      role: data.role,
      displayName: data.displayName,
      email: data.email,
      status: data.status || 'active',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    }
  })
}

/**
 * Records an admin action. Failures here are logged but never block the
 * action itself — a missed audit entry shouldn't stop an admin from, say,
 * disabling a compromised account.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.collection(COLLECTIONS.AUDIT_LOGS).add({
      ...entry,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error('[auditLog] failed to write entry:', entry.action, err)
  }
}

export interface AuditLogRecord {
  id: string
  action: string
  actorUid: string
  actorEmail: string | null
  targetUid: string | null
  targetEmail: string | null
  details: unknown
  createdAt: string | null
}

export async function getAuditLogEntries(limit: number): Promise<AuditLogRecord[]> {
  const snap = await db.collection(COLLECTIONS.AUDIT_LOGS).orderBy('createdAt', 'desc').limit(limit).get()
  return snap.docs.map((docSnap) => {
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
  })
}
