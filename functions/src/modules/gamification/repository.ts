/**
 * modules/gamification/repository.ts
 * All direct Firestore access for `gamification/{userId}`, plus the two
 * reads the recompute depends on (a student's progress rows and their
 * profile). Nothing here decides what anything is worth — that is
 * catalog.ts — and nothing here decides when to write — that is
 * service.ts.
 */
import { admin, db } from '../../shared/admin'
import { COLLECTIONS, ROLES } from '../../shared/constants'
import { ModuleProgressDoc } from '../progress/models'
import { GamificationDoc } from './models'

export function gamificationRef(userId: string): FirebaseFirestore.DocumentReference {
  return db.collection(COLLECTIONS.GAMIFICATION).doc(userId)
}

export async function getGamification(userId: string): Promise<GamificationDoc | null> {
  const snap = await gamificationRef(userId).get()
  return snap.exists ? (snap.data() as GamificationDoc) : null
}

export async function saveGamification(userId: string, data: Partial<GamificationDoc>): Promise<void> {
  await gamificationRef(userId).set(
    { ...data, userId, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  )
}

/** Every module progress row belonging to one student. */
export async function listProgressForUser(userId: string): Promise<ModuleProgressDoc[]> {
  const snap = await db.collection(COLLECTIONS.MODULE_PROGRESS).where('userId', '==', userId).get()
  return snap.docs.map((doc) => doc.data() as ModuleProgressDoc)
}

export interface BehaviourRow {
  moduleId: string
  safeChoices: number
  riskyChoices: number
}

/**
 * One student's per-module safe/risky decision counters, maintained by
 * the updateLearningAnalytics trigger off scenario_decision_records.
 *
 * This is the only thing the reward layer needs that a moduleProgress
 * row cannot tell it: progress records *that* a simulation finished,
 * never *how cleanly*. Reading the already-aggregated counters rather
 * than the raw decision records keeps the recompute at one small query
 * instead of one per decision the student has ever made.
 */
export async function listBehaviourForUser(userId: string): Promise<BehaviourRow[]> {
  const snap = await db.collection(COLLECTIONS.LEARNING_ANALYTICS).where('userId', '==', userId).get()
  return snap.docs.map((doc) => {
    const data = doc.data()
    return {
      moduleId: String(data.moduleId ?? ''),
      safeChoices: Number(data.safeChoices ?? 0),
      riskyChoices: Number(data.riskyChoices ?? 0),
    }
  })
}

export interface ProfileSummary {
  displayName: string
  section: string | null
  role: string
}

/**
 * Falls back to a neutral label rather than throwing: a missing or
 * half-written profile should degrade a leaderboard row, never break the
 * trigger that keeps a student's points current.
 */
export async function getProfileSummary(userId: string): Promise<ProfileSummary> {
  const snap = await db.collection(COLLECTIONS.USERS).doc(userId).get()
  const data = snap.data()
  if (!data) return { displayName: 'Student', section: null, role: ROLES.STUDENT }
  return {
    displayName: data.nickname || data.displayName || 'Student',
    section: typeof data.section === 'string' && data.section.trim() ? data.section.trim() : null,
    role: data.role ?? ROLES.STUDENT,
  }
}

/**
 * The top `limit` scorers, highest first.
 *
 * Deliberately a single-field `orderBy('points')` with no `where` clause,
 * even when the caller asked for one section: adding an equality filter
 * would need a composite index deployed alongside the functions, and a
 * section is then filtered out of this result in memory instead (see
 * service.getLeaderboard). At a capstone cohort's scale reading a couple
 * of hundred small documents is cheaper than the operational cost of an
 * index that has to exist before the feature works at all.
 */
export async function topByPoints(limit: number): Promise<GamificationDoc[]> {
  const snap = await db
    .collection(COLLECTIONS.GAMIFICATION)
    .orderBy('points', 'desc')
    .limit(limit)
    .get()
  return snap.docs.map((doc) => doc.data() as GamificationDoc)
}

/**
 * How many students are strictly ahead of `points`. An aggregation count,
 * so a student ranked 400th costs one query rather than 400 documents.
 */
export async function countAhead(points: number): Promise<number> {
  const snap = await db.collection(COLLECTIONS.GAMIFICATION).where('points', '>', points).count().get()
  return snap.data().count
}

export async function countRanked(): Promise<number> {
  const snap = await db.collection(COLLECTIONS.GAMIFICATION).count().get()
  return snap.data().count
}
