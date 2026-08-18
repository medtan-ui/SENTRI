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
import { COHORT_DOC_ID } from '../analytics/repository'
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
/**
 * The slice of a student's final assessment document that the reward
 * layer needs. Kept narrow on purpose — gamification should not depend on
 * the whole shape of another module's document.
 */
export interface FinalAssessmentSummary {
  completed: boolean
  passed: boolean
  normalizedGain: number | null
}

/** Null when the student hasn't taken the final assessment yet. */
export async function getFinalAssessmentSummary(userId: string): Promise<FinalAssessmentSummary | null> {
  const snap = await db.collection(COLLECTIONS.FINAL_ASSESSMENT_PROGRESS).doc(userId).get()
  if (!snap.exists) return null
  const data = snap.data() as { completed?: boolean; passed?: boolean; normalizedGain?: number | null }
  return {
    completed: Boolean(data.completed),
    passed: Boolean(data.passed),
    normalizedGain: typeof data.normalizedGain === 'number' ? data.normalizedGain : null,
  }
}

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
 * the updateLearningAnalytics trigger off scenarioDecisionRecords.
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
  if (!data) return { displayName: 'Student', role: ROLES.STUDENT }
  return {
    displayName: data.nickname || data.displayName || 'Student',
    role: data.role ?? ROLES.STUDENT,
  }
}

/**
 * The top `limit` scorers, highest first.
 *
 * A single-field `orderBy('points')` with no `where` clause, so it needs
 * no composite index — nothing has to be deployed and built before the
 * board works at all.
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

/**
 * The badge rarity figures the cohort rollup already computes
 * (analytics/service buildBadgeDistribution). Read here rather than
 * recounted: a student opening their shelf should cost one document
 * read, not a scan of everyone else's reward documents.
 *
 * Returns an empty list when the rollup has never been built, which the
 * caller renders as "no rarity known yet" rather than as zero percent.
 */
export async function getBadgeDistribution(): Promise<
  Array<{ badgeId: string; earnedCount: number; earnedPct: number }>
> {
  const snap = await db.collection(COLLECTIONS.COHORT_ANALYTICS).doc(COHORT_DOC_ID).get()
  const rows = snap.exists ? (snap.data()?.badgeDistribution as unknown) : null
  if (!Array.isArray(rows)) return []
  return rows
    .filter((row) => row && typeof row.badgeId === 'string')
    .map((row) => ({
      badgeId: row.badgeId as string,
      earnedCount: typeof row.earnedCount === 'number' ? row.earnedCount : 0,
      earnedPct: typeof row.earnedPct === 'number' ? row.earnedPct : 0,
    }))
}
