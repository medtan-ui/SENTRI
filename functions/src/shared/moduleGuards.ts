/**
 * shared/moduleGuards.ts
 * Shared "does this module exist / what comes next" lookups against the
 * modules collection, reused by the admin, scenario, quiz, and progress
 * modules so the rule lives in exactly one place. There is no admin
 * enabled/disabled gate — every real module is reachable once unlocked by
 * curriculum order (see modules/progress).
 */
import { db } from './admin'
import { COLLECTIONS, ModuleId, REAL_MODULE_IDS } from './constants'
import { AppError } from './errors'

export function assertRealModuleId(moduleId: unknown): asserts moduleId is ModuleId {
  if (typeof moduleId !== 'string' || !(REAL_MODULE_IDS as readonly string[]).includes(moduleId)) {
    throw new AppError('invalid-argument', `moduleId must be one of: ${REAL_MODULE_IDS.join(', ')}`)
  }
}

export interface ModuleDoc {
  moduleId: string
  moduleOrder: number
  status: string
  prerequisite: string | null
  title?: string
  [key: string]: unknown
}

export async function getModuleOrThrow(moduleId: string): Promise<ModuleDoc> {
  assertRealModuleId(moduleId)
  const snap = await db.collection(COLLECTIONS.MODULES).doc(moduleId).get()
  if (!snap.exists) {
    throw new AppError('not-found', `Module "${moduleId}" has not been configured yet.`)
  }
  return snap.data() as ModuleDoc
}

/** The module immediately after `moduleOrder` in the fixed curriculum, or null past the last one. */
export async function getNextModule(moduleOrder: number): Promise<ModuleDoc | null> {
  const snap = await db.collection(COLLECTIONS.MODULES).where('moduleOrder', '==', moduleOrder + 1).limit(1).get()
  if (snap.empty) return null
  return snap.docs[0].data() as ModuleDoc
}
