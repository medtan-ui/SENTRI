/**
 * modules/analytics/service.ts
 * aggregateModuleAnalytics/aggregateStudentAnalytics do a full recompute
 * into a single summary doc; the transaction around that final write isn't
 * for the arithmetic (which is already consistent from the Promise.all
 * reads) but so two concurrent aggregation runs can't interleave partial
 * writes to the same doc. incrementLearningAnalytics is genuinely
 * incremental (read-modify-write on a running counter), so its
 * transaction is load-bearing against concurrent scenario decisions.
 */
import { admin, db } from '../../shared/admin'
import { getModuleOrThrow } from '../../shared/moduleGuards'
import * as repo from './repository'
import { ModuleAnalyticsDoc, RecordAnalyticsEventInput, StudentAnalyticsDoc } from './models'

export async function recordAnalyticsEvent(
  userId: string,
  input: RecordAnalyticsEventInput,
): Promise<{ eventId: string }> {
  const eventId = await repo.writeAnalyticsEvent(userId, input)
  return { eventId }
}

export async function aggregateModuleAnalytics(moduleId: string): Promise<ModuleAnalyticsDoc> {
  await getModuleOrThrow(moduleId)

  const [progressDocs, attempts, decisions] = await Promise.all([
    repo.getModuleProgressForModule(moduleId),
    repo.getQuizAttemptsForModule(moduleId),
    repo.getScenarioDecisionsForModule(moduleId),
  ])

  const totalStudents = progressDocs.length
  const completedCount = progressDocs.filter((p) => p.moduleCompleted).length
  const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0

  const attemptedQuizCount = attempts.length
  const passCount = attempts.filter((a) => a.passed).length
  const passRate = attemptedQuizCount > 0 ? Math.round((passCount / attemptedQuizCount) * 100) : 0
  const avgScore =
    attemptedQuizCount > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attemptedQuizCount)
      : 0

  const choiceBreakdown: Record<string, Record<string, number>> = {}
  decisions.forEach((d) => {
    const scenarioId = d.scenario_id as string
    const choiceId = d.scenario_choice_id as string
    if (!scenarioId || !choiceId) return
    if (!choiceBreakdown[scenarioId]) choiceBreakdown[scenarioId] = {}
    choiceBreakdown[scenarioId][choiceId] = (choiceBreakdown[scenarioId][choiceId] || 0) + 1
  })

  const doc: ModuleAnalyticsDoc = {
    moduleId,
    totalStudents,
    completedCount,
    completionRate,
    attemptedQuizCount,
    passCount,
    passRate,
    avgScore,
    choiceBreakdown,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  await db.runTransaction(async (txn) => {
    const ref = repo.moduleAnalyticsRef(moduleId)
    await txn.get(ref)
    txn.set(ref, doc)
  })

  return doc
}

export async function aggregateStudentAnalytics(userId: string): Promise<StudentAnalyticsDoc> {
  const [progressDocs, attempts, decisions] = await Promise.all([
    repo.getModuleProgressForStudent(userId),
    repo.getQuizAttemptsForStudent(userId),
    repo.getScenarioDecisionsForStudent(userId),
  ])

  const modulesCompleted = progressDocs.filter((p) => p.moduleCompleted).length
  const modulesInProgress = progressDocs.filter(
    (p) => p.isUnlocked && !p.moduleCompleted && (p.lessonStarted || p.simulationCompleted),
  ).length
  const avgQuizScore =
    attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length) : 0
  const totalSafeChoices = decisions.filter((d) => d.is_safe_choice === true).length
  const totalRiskyChoices = decisions.filter((d) => d.is_safe_choice === false).length

  let lastActivityAt: FirebaseFirestore.Timestamp | null = null
  for (const p of progressDocs) {
    const t = p.lastAccessed as FirebaseFirestore.Timestamp | undefined
    if (t && (!lastActivityAt || t.toMillis() > lastActivityAt.toMillis())) lastActivityAt = t
  }

  const doc: StudentAnalyticsDoc = {
    userId,
    modulesCompleted,
    modulesInProgress,
    avgQuizScore,
    totalSafeChoices,
    totalRiskyChoices,
    lastActivityAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  await db.runTransaction(async (txn) => {
    const ref = repo.studentAnalyticsRef(userId)
    await txn.get(ref)
    txn.set(ref, doc)
  })

  return doc
}

/**
 * Firestore-trigger body (see controllers.ts for the onDocumentCreated
 * wiring) — increments one student-module pair's safe/risky decision
 * counters. Exported separately from the trigger itself so it can be
 * called directly in tests without a real Firestore trigger firing.
 */
export async function incrementLearningAnalytics(userId: string, moduleId: string, isSafe: boolean): Promise<void> {
  const ref = repo.learningAnalyticsRef(userId, moduleId)
  await db.runTransaction(async (txn) => {
    const snap = await txn.get(ref)
    const current = snap.exists ? snap.data()! : { safeChoices: 0, riskyChoices: 0, totalDecisions: 0 }
    txn.set(
      ref,
      {
        userId,
        moduleId,
        safeChoices: (current.safeChoices || 0) + (isSafe ? 1 : 0),
        riskyChoices: (current.riskyChoices || 0) + (isSafe ? 0 : 1),
        totalDecisions: (current.totalDecisions || 0) + 1,
        lastDecisionAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })
}
