/**
 * auth/service.ts
 * Business logic for admin-only account management — behavior ported
 * unchanged from the original functions/index.js so the existing
 * src/services/adminService.js frontend keeps working without changes.
 */
import { AppError } from '../shared/errors'
import { REAL_MODULE_IDS } from '../shared/constants'
import { initializeAllProgressForUser } from '../modules/progress/service'
import { aggregateCohortAnalytics, aggregateModuleAnalytics } from '../modules/analytics/service'
import * as repo from './repository'
import {
  ChangeOwnPasswordInput,
  CreateUserAccountInput,
  DeleteUserAccountInput,
  RegisterStudentAccountInput,
  ResetUserPasswordInput,
  SetUserAccountStatusInput,
  UpdateOwnNicknameInput,
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
      nickname: (input.nickname || input.displayName).trim(),
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

/**
 * Public self-registration — no actor, since nobody is authenticated yet.
 * Always creates a student account (role is hardcoded here, never taken
 * from client input) with mustChangePassword: false, since the student
 * chose their own real password just now — unlike admin-created accounts,
 * there's no temporary password to replace. Verification happens the same
 * way as any other account: EmailVerificationGate, driven by Firebase's
 * own emailVerified flag, once the frontend signs the new user in.
 */
export async function registerStudentAccount(input: RegisterStudentAccountInput) {
  const normalizedEmail = input.email.trim().toLowerCase()

  const userRecord = await repo.createAuthUser({
    email: normalizedEmail,
    password: input.password,
    displayName: input.displayName,
  })

  try {
    await repo.setUserProfile(userRecord.uid, {
      role: 'student',
      displayName: input.displayName,
      nickname: input.nickname.trim(),
      email: normalizedEmail,
      status: 'active',
      mustChangePassword: false,
    })
  } catch (err) {
    console.error(
      '[registerStudentAccount] Firestore profile write failed, rolling back Auth user:',
      userRecord.uid,
      err,
    )
    try {
      await repo.deleteAuthUser(userRecord.uid)
    } catch (cleanupErr) {
      console.error(
        '[registerStudentAccount] rollback delete also failed — orphaned Auth user:',
        userRecord.uid,
        cleanupErr,
      )
    }
    throw new AppError('internal', 'Unable to create the account. Please try again.')
  }

  await repo.writeAuditLog({
    action: 'self_register',
    actorUid: userRecord.uid,
    actorEmail: normalizedEmail,
    targetUid: userRecord.uid,
    targetEmail: normalizedEmail,
    details: null,
  })

  try {
    await initializeAllProgressForUser(userRecord.uid)
  } catch (err) {
    console.error('[registerStudentAccount] progress seeding failed — continuing:', userRecord.uid, err)
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

  // moduleAnalytics is a cached singleton per module, not per-student —
  // deleteStudentData above removes this student's raw progress/quiz/
  // decision docs, but the last-computed aggregate would otherwise keep
  // showing this student's numbers baked in until an admin happens to
  // click Refresh. Recomputing all six now against the now-clean raw data
  // is what actually removes the deleted student from the admin analytics
  // dashboard. allSettled (not all) so one module failing — e.g. it was
  // never configured — doesn't stop the other five from recomputing.
  const analyticsResults = await Promise.allSettled(
    REAL_MODULE_IDS.map((moduleId) => aggregateModuleAnalytics(moduleId)),
  )
  analyticsResults.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(
        `[deleteUserAccount] moduleAnalytics recompute failed for ${REAL_MODULE_IDS[i]} — continuing:`,
        input.uid,
        result.reason,
      )
    }
  })

  // The cohort rollup is a cached singleton for the same reason the
  // module ones are, so it needs the same treatment: without this, the
  // dashboard's headline student counts and learning gain would keep
  // including a deleted student until the nightly job caught up. Failures
  // are logged and swallowed — the account is already gone, and the next
  // scheduled run recomputes from the (now clean) raw data anyway.
  try {
    await aggregateCohortAnalytics()
  } catch (err) {
    console.error('[deleteUserAccount] cohort recompute failed — continuing:', input.uid, err)
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

export async function setUserAccountStatus(
  actor: { uid: string; email: string | null },
  callerUid: string,
  input: SetUserAccountStatusInput,
) {
  if (input.uid === callerUid) {
    throw new AppError('failed-precondition', 'You cannot deactivate your own account.')
  }

  await repo.setAuthUserDisabled(input.uid, input.status === 'disabled')
  await repo.setUserStatus(input.uid, input.status)

  const target = await repo.getUserProfile(input.uid)
  await repo.writeAuditLog({
    action: input.status === 'disabled' ? 'deactivate_user' : 'activate_user',
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

// Self-service, any authenticated user, no admin required — lets an
// account created before the nickname feature existed set one for the
// first time. No audit log entry: the audit log tracks admin actions on
// other accounts, not a user editing their own profile.
export async function updateOwnNickname(uid: string, input: UpdateOwnNicknameInput) {
  await repo.setUserNickname(uid, input.nickname)
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
