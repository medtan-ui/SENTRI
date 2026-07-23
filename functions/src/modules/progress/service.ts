/**
 * modules/progress/service.ts
 * The single authoritative place a student's moduleProgress is read or
 * mutated. Every write that touches more than one concern (completing a
 * module AND unlocking the next one, recording a quiz attempt AND
 * completing a module) runs inside one Firestore transaction — Firestore
 * requires every `transaction.get` to happen before any
 * `transaction.set/update`, so each operation below gathers its reads
 * first and only then decides what to write.
 */
import { admin, db } from '../../shared/admin'
import { AppError } from '../../shared/errors'
import { getModuleOrThrow, getNextModule, ModuleDoc } from '../../shared/moduleGuards'
import { REAL_MODULE_IDS } from '../../shared/constants'
import { defaultProgress, progressRef } from './repository'
import { ModuleProgressDoc } from './models'

interface UnlockPlan {
  ref: FirebaseFirestore.DocumentReference
  data: Partial<ModuleProgressDoc>
  mode: 'create' | 'update' | 'noop'
}

/** Pure decision — takes an already-fetched snapshot, does no IO itself. */
function planUnlock(
  nextModuleDoc: ModuleDoc,
  nextProgressSnap: FirebaseFirestore.DocumentSnapshot,
  userId: string,
): UnlockPlan {
  const ref = progressRef(userId, nextModuleDoc.moduleId)
  if (!nextProgressSnap.exists) {
    return {
      ref,
      data: defaultProgress(userId, nextModuleDoc.moduleId, nextModuleDoc.moduleOrder, true),
      mode: 'create',
    }
  }
  const data = nextProgressSnap.data() as ModuleProgressDoc
  if (data.isUnlocked) return { ref, data: {}, mode: 'noop' }
  return { ref, data: { isUnlocked: true, lastAccessed: admin.firestore.FieldValue.serverTimestamp() }, mode: 'update' }
}

function applyUnlockPlan(txn: FirebaseFirestore.Transaction, plan: UnlockPlan): void {
  if (plan.mode === 'create') txn.set(plan.ref, plan.data)
  else if (plan.mode === 'update') txn.update(plan.ref, plan.data)
}

/**
 * Seeds every one-of-six module's progress doc for a brand new student,
 * skipping any module that hasn't been configured yet (no modules/{id} doc
 * — best-effort, never throws past what's already configured).
 */
export async function initializeAllProgressForUser(userId: string): Promise<void> {
  await Promise.all(
    REAL_MODULE_IDS.map(async (moduleId) => {
      let moduleDoc: ModuleDoc
      try {
        moduleDoc = await getModuleOrThrow(moduleId)
      } catch {
        return
      }
      const ref = progressRef(userId, moduleId)
      const snap = await ref.get()
      if (!snap.exists) {
        await ref.set(defaultProgress(userId, moduleId, moduleDoc.moduleOrder, moduleDoc.moduleOrder === 1))
      }
    }),
  )
}

export async function initializeStudentProgress(userId: string, moduleId?: string): Promise<ModuleProgressDoc[]> {
  // A specific moduleId is an explicit request — an unconfigured module is
  // a real error. Omitting it means "initialize whatever curriculum exists
  // today," so a module the admin hasn't configured yet is skipped rather
  // than blocking every other module (same best-effort shape as
  // initializeAllProgressForUser, used at account-creation time).
  const moduleIds = moduleId ? [moduleId] : [...REAL_MODULE_IDS]
  const results: ModuleProgressDoc[] = []
  for (const id of moduleIds) {
    let moduleDoc
    try {
      moduleDoc = await getModuleOrThrow(id)
    } catch (err) {
      if (moduleId) throw err
      continue
    }
    const ref = progressRef(userId, id)
    const snap = await ref.get()
    if (snap.exists) {
      results.push(snap.data() as ModuleProgressDoc)
    } else {
      const seed = defaultProgress(userId, id, moduleDoc.moduleOrder, moduleDoc.moduleOrder === 1)
      await ref.set(seed)
      results.push(seed)
    }
  }
  return results
}

async function assertUnlockedForStudent(userId: string, moduleId: string): Promise<ModuleProgressDoc> {
  const snap = await progressRef(userId, moduleId).get()
  if (!snap.exists || !(snap.data() as ModuleProgressDoc).isUnlocked) {
    throw new AppError('failed-precondition', `Module "${moduleId}" is not unlocked for this student yet.`)
  }
  return snap.data() as ModuleProgressDoc
}

export async function completeLesson(userId: string, moduleId: string): Promise<void> {
  await getModuleOrThrow(moduleId)
  await assertUnlockedForStudent(userId, moduleId)
  await progressRef(userId, moduleId).set(
    { lessonStarted: true, lessonCompleted: true, lastAccessed: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  )
}

export async function completeSimulation(userId: string, moduleId: string): Promise<void> {
  await getModuleOrThrow(moduleId)
  await assertUnlockedForStudent(userId, moduleId)
  await progressRef(userId, moduleId).set(
    { simulationCompleted: true, lastAccessed: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  )
}

/**
 * Unlocks the module immediately after `completedModuleOrder`, in its own
 * transaction. A no-op past the last module. Reused (inline, not by
 * calling this directly) by completeModuleForUser / quiz submission so
 * "complete + unlock" can commit as a single transaction instead of two.
 */
export async function unlockNextModuleForUser(
  userId: string,
  completedModuleOrder: number,
): Promise<{ unlocked: boolean; moduleId: string | null }> {
  const nextModuleDoc = await getNextModule(completedModuleOrder)
  if (!nextModuleDoc) return { unlocked: false, moduleId: null }

  return db.runTransaction(async (txn) => {
    const ref = progressRef(userId, nextModuleDoc.moduleId)
    const snap = await txn.get(ref)
    const plan = planUnlock(nextModuleDoc, snap, userId)
    applyUnlockPlan(txn, plan)
    return { unlocked: plan.mode !== 'noop', moduleId: nextModuleDoc.moduleId }
  })
}

export async function completeModuleForUser(userId: string, moduleId: string): Promise<void> {
  const moduleDoc = await getModuleOrThrow(moduleId)
  await assertUnlockedForStudent(userId, moduleId)
  const nextModuleDoc = await getNextModule(moduleDoc.moduleOrder)

  await db.runTransaction(async (txn) => {
    const currentRef = progressRef(userId, moduleId)
    const currentSnap = await txn.get(currentRef)

    let nextSnap: FirebaseFirestore.DocumentSnapshot | null = null
    if (nextModuleDoc) {
      nextSnap = await txn.get(progressRef(userId, nextModuleDoc.moduleId))
    }

    const current = currentSnap.exists
      ? (currentSnap.data() as ModuleProgressDoc)
      : defaultProgress(userId, moduleId, moduleDoc.moduleOrder, true)

    txn.set(
      currentRef,
      {
        ...current,
        moduleCompleted: true,
        completionDate: admin.firestore.FieldValue.serverTimestamp(),
        lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    if (nextModuleDoc && nextSnap) {
      applyUnlockPlan(txn, planUnlock(nextModuleDoc, nextSnap, userId))
    }
  })
}

export async function resetModuleProgress(userId: string, moduleId: string): Promise<void> {
  const moduleDoc = await getModuleOrThrow(moduleId)
  await db.runTransaction(async (txn) => {
    const ref = progressRef(userId, moduleId)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await txn.get(ref) // keep the read-before-write invariant explicit even though we fully overwrite
    txn.set(ref, defaultProgress(userId, moduleId, moduleDoc.moduleOrder, moduleDoc.moduleOrder === 1))
  })
}

/** Exposed for the quiz module so a passing attempt can unlock the next
 * module as part of its own single transaction instead of a second one. */
export { planUnlock, applyUnlockPlan }
