/**
 * auth/service.ts
 * Business logic for admin-only account management — behavior ported
 * unchanged from the original functions/index.js so the existing
 * src/services/adminService.js frontend keeps working without changes.
 */
import { AppError } from '../shared/errors'
import { initializeAllProgressForUser } from '../modules/progress/service'
import * as repo from './repository'
import {
  ChangeOwnPasswordInput,
  CreateUserAccountInput,
  DeleteUserAccountInput,
  ResetUserPasswordInput,
} from './models'

export async function createUserAccount(
  actor: { uid: string; email: string | null },
  input: CreateUserAccountInput,
) {
  const normalizedEmail = input.email.trim().toLowerCase()

  const userRecord = await repo.createAuthUser({
    email: normalizedEmail,
    password: input.password,
    displayName: input.displayName,
  })

  try {
    await repo.setUserProfile(userRecord.uid, {
      role: input.role,
      displayName: input.displayName,
      email: normalizedEmail,
      status: 'active',
      mustChangePassword: true,
    })
  } catch (err) {
    // The Auth user was already created above — without this cleanup it
    // would be orphaned (no Firestore profile, invisible in listUsers, yet
    // still permanently blocking this email via auth/email-already-exists).
    console.error('[createUserAccount] Firestore profile write failed, rolling back Auth user:', userRecord.uid, err)
    try {
      await repo.deleteAuthUser(userRecord.uid)
    } catch (cleanupErr) {
      console.error('[createUserAccount] rollback delete also failed — orphaned Auth user:', userRecord.uid, cleanupErr)
    }
    throw new AppError('internal', 'Unable to create the account. Please try again.')
  }

  await repo.writeAuditLog({
    action: 'create_user',
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid: userRecord.uid,
    targetEmail: normalizedEmail,
    details: { role: input.role },
  })

  if (input.role === 'student') {
    // Best-effort: seeds this student's moduleProgress docs so their first
    // dashboard load never has to lazily create them. Never blocks account
    // creation — same "log and continue" philosophy as the audit log above.
    try {
      await initializeAllProgressForUser(userRecord.uid)
    } catch (err) {
      console.error('[createUserAccount] progress seeding failed — continuing:', userRecord.uid, err)
    }
  }

  return { uid: userRecord.uid }
}

export async function deleteUserAccount(
  actor: { uid: string; email: string | null },
  callerUid: string,
  input: DeleteUserAccountInput,
) {
  if (input.uid === callerUid) {
    throw new AppError('failed-precondition', 'You cannot delete your own account.')
  }

  const target = await repo.getUserProfile(input.uid)
  const targetEmail = target?.email ?? null

  await repo.deleteAuthUser(input.uid)
  await repo.deleteUserProfile(input.uid)

  try {
    await repo.deleteStudentData(input.uid)
  } catch (err) {
    // The account is already gone — a cleanup miss here shouldn't surface
    // as a failed deletion. Same "log and continue" philosophy as the audit
    // log and progress-seeding calls in createUserAccount above.
    console.error('[deleteUserAccount] cascade data cleanup failed — continuing:', input.uid, err)
  }

  await repo.writeAuditLog({
    action: 'delete_user',
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid: input.uid,
    targetEmail,
    details: null,
  })

  return { success: true }
}

export async function resetUserPassword(
  actor: { uid: string; email: string | null },
  input: ResetUserPasswordInput,
) {
  await repo.updateAuthUserPassword(input.uid, input.newPassword)

  // An admin-set password is a new temporary password, same as at account
  // creation — the user should be prompted to choose their own on next login.
  await repo.setMustChangePassword(input.uid, true)

  const target = await repo.getUserProfile(input.uid)
  await repo.writeAuditLog({
    action: 'reset_password',
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid: input.uid,
    targetEmail: target?.email ?? null,
    details: null,
  })

  return { success: true }
}

export async function changeOwnPassword(uid: string, input: ChangeOwnPasswordInput) {
  await repo.updateAuthUserPassword(uid, input.newPassword)
  await repo.setMustChangePassword(uid, false)
  return { success: true }
}

export async function listUsers() {
  const users = await repo.listUserProfiles()
  return { users }
}

export async function getAuditLog(limit = 50) {
  const logs = await repo.getAuditLogEntries(Math.min(limit, 200))
  return { logs }
}
