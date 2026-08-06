/**
 * modules/analytics/service.ts
 * aggregateModuleAnalytics/aggregateStudentAnalytics/aggregateCohortAnalytics
 * each do a full recompute into a single summary doc; the transaction
 * around that final write isn't for the arithmetic (which is already
 * consistent from the Promise.all reads) but so two concurrent
 * aggregation runs can't interleave partial writes to the same doc.
 * incrementLearningAnalytics is genuinely incremental (read-modify-write
 * on a running counter), so its transaction is load-bearing against
 * concurrent scenario decisions.
 *
 * All statistics live in ./metrics.ts as pure functions. This file only
 * fetches, hands documents to them, and persists the result — so the
 * maths is testable without Firestore and the IO stays in one place.
 */
import { admin, db } from '../../shared/admin'
import { REAL_MODULE_IDS } from '../../shared/constants'
import { getModuleOrThrow } from '../../shared/moduleGuards'
import * as assessmentRepo from '../assessment/repository'
import * as repo from './repository'
import {
  behaviourMetrics,
  cohortNormalizedGain,
  itemAnalysis,
  topicMastery,
  transferAnalysis,
} from './metrics'
import {
  CohortAnalyticsDoc,
  CohortModulePoint,
  ModuleAnalyticsDoc,
  RecordAnalyticsEventInput,
  StudentAnalyticsDoc,
  StudentTimelinePoint,
  TrendPoint,
} from './models'

/** How far back the completion trend looks. Long enough to show a shape
 * over a term, short enough that the document stays small. */
const TREND_WINDOW_DAYS = 30

export async function recordAnalyticsEvent(
  userId: string,
  input: RecordAnalyticsEventInput,
): Promise<{ eventId: string }> {
  const eventId = await repo.writeAnalyticsEvent(userId, input)
  return { eventId }
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const timestamp = value as FirebaseFirestore.Timestamp
  return typeof timestamp?.toDate === 'function' ? timestamp.toDate() : null
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function aggregateModuleAnalytics(moduleId: string): Promise<ModuleAnalyticsDoc> {
  await getModuleOrThrow(moduleId)

  const [progressDocs, attempts, decisions, responses] = await Promise.all([
    repo.getModuleProgressForModule(moduleId),
    repo.getQuizAttemptsForModule(moduleId),
    repo.getScenarioDecisionsForModule(moduleId),
    assessmentRepo.getResponsesForModule(moduleId),
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
    const scenarioId = d.scenarioId as string
    const choiceId = d.scenarioChoiceId as string
    if (!scenarioId || !choiceId) return
    if (!choiceBreakdown[scenarioId]) choiceBreakdown[scenarioId] = {}
    choiceBreakdown[scenarioId][choiceId] = (choiceBreakdown[scenarioId][choiceId] || 0) + 1
  })

  const gain = cohortNormalizedGain(
    progressDocs.map((p) => ({ pre: p.preTestScore, post: p.postTestScore })),
  )

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
    avgPreTestScore: gain.avgPre,
    avgPostTestScore: gain.avgPost,
    normalizedGain: gain.normalizedGain,
    pairedCount: gain.pairedCount,
    postTestCompletedCount: progressDocs.filter((p) => p.postTestCompleted).length,
    topicMastery: topicMastery(responses),
    itemAnalysis: itemAnalysis(responses),
    behaviour: behaviourMetrics(decisions),
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
  const [progressDocs, attempts, decisions, responses, modules] = await Promise.all([
    repo.getModuleProgressForStudent(userId),
    repo.getQuizAttemptsForStudent(userId),
    repo.getScenarioDecisionsForStudent(userId),
    assessmentRepo.getResponsesForStudent(userId),
    repo.getAllModules(),
  ])

  const moduleOrderById: Record<string, number> = {}
  modules.forEach((m) => {
    if (m.moduleId) moduleOrderById[m.moduleId as string] = (m.moduleOrder as number) ?? 0
  })

  const modulesCompleted = progressDocs.filter((p) => p.moduleCompleted).length
  const modulesInProgress = progressDocs.filter(
    (p) => p.isUnlocked && !p.moduleCompleted && (p.lessonStarted || p.simulationCompleted),
  ).length
  const avgQuizScore =
    attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length) : 0
  const totalSafeChoices = decisions.filter((d) => d.isSafeChoice === true).length
  const totalRiskyChoices = decisions.filter((d) => d.isSafeChoice === false).length

  let lastActivityAt: FirebaseFirestore.Timestamp | null = null
  for (const p of progressDocs) {
    const t = p.lastAccessed as FirebaseFirestore.Timestamp | undefined
    if (t && (!lastActivityAt || t.toMillis() > lastActivityAt.toMillis())) lastActivityAt = t
  }

  const gain = cohortNormalizedGain(
    progressDocs.map((p) => ({ pre: p.preTestScore, post: p.postTestScore })),
  )
  const transfer = transferAnalysis(decisions, responses, moduleOrderById)
  const safeRateByModule = new Map(transfer.byModule.map((p) => [p.moduleId, p.firstAttemptSafeRate]))

  const timeline: StudentTimelinePoint[] = progressDocs
    .map((p) => ({
      moduleId: p.moduleId as string,
      moduleOrder: (p.moduleOrder as number) ?? moduleOrderById[p.moduleId as string] ?? 0,
      preTestScore: typeof p.preTestScore === 'number' ? p.preTestScore : null,
      quizScore: typeof p.score === 'number' ? p.score : null,
      postTestScore: typeof p.postTestScore === 'number' ? p.postTestScore : null,
      normalizedGain: typeof p.normalizedGain === 'number' ? p.normalizedGain : null,
      firstAttemptSafeRate: safeRateByModule.get(p.moduleId as string) ?? null,
      completedAt: (p.completionDate as FirebaseFirestore.Timestamp) ?? null,
    }))
    .sort((a, b) => a.moduleOrder - b.moduleOrder)

  const doc: StudentAnalyticsDoc = {
    userId,
    modulesCompleted,
    modulesInProgress,
    avgQuizScore,
    totalSafeChoices,
    totalRiskyChoices,
    lastActivityAt,
    avgPreTestScore: gain.avgPre,
    avgPostTestScore: gain.avgPost,
    normalizedGain: gain.normalizedGain,
    pairedCount: gain.pairedCount,
    topicMastery: topicMastery(responses),
    behaviour: behaviourMetrics(decisions),
    transfer,
    timeline,
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
 * Everything a cohort rollup is computed from. Named and passed around as
 * one value so the read and the computation can be separated — which is
 * the whole point of the split below.
 */
export interface CohortSources {
  progress: FirebaseFirestore.DocumentData[]
  attempts: FirebaseFirestore.DocumentData[]
  decisions: FirebaseFirestore.DocumentData[]
  responses: FirebaseFirestore.DocumentData[]
  modules: FirebaseFirestore.DocumentData[]
  roster: repo.StudentRoster
}

/**
 * One full pass over the collections a cohort rollup reads.
 *
 * Kept separate from the computation so buildCohortDoc stays pure: the
 * arithmetic every reported figure depends on can then be tested against
 * fixed inputs without an emulator.
 *
 * Full-collection reads are acceptable at all here because this runs on
 * demand from the admin Analytics page or once a night on a schedule, not
 * per page view, and the collections are bounded by a single school's
 * worth of students.
 */
export async function readCohortSources(): Promise<CohortSources> {
  const [progress, attempts, decisions, responses, modules, roster] = await Promise.all([
    repo.getAllModuleProgress(),
    repo.getAllQuizAttempts(),
    repo.getAllScenarioDecisions(),
    assessmentRepo.getAllResponses(),
    repo.getAllModules(),
    repo.getStudentRoster(),
  ])
  return { progress, attempts, decisions, responses, modules, roster }
}

/**
 * buildCohortDoc
 * The class-level view: one computation over every student's progress,
 * every decision, and every item response at once. This is the only
 * aggregate that can answer the two questions a per-module summary
 * structurally cannot — how the cohort as a whole is moving, and whether
 * behaviour learned in early modules transfers to later ones.
 *
 * No IO — it takes already-read documents and returns the document to
 * write, which keeps the arithmetic directly testable.
 */
export function buildCohortDoc(sources: CohortSources): CohortAnalyticsDoc {
  const { roster, modules } = sources

  const progressDocs = sources.progress
  const attempts = sources.attempts
  const decisions = sources.decisions
  const responses = sources.responses

  const studentCount = roster.totalStudents

  const moduleOrderById: Record<string, number> = {}
  const moduleTitleById: Record<string, string> = {}
  modules.forEach((m) => {
    if (!m.moduleId) return
    moduleOrderById[m.moduleId as string] = (m.moduleOrder as number) ?? 0
    moduleTitleById[m.moduleId as string] = (m.title as string) ?? (m.moduleId as string)
  })
  const moduleCount = modules.length

  const byStudent = new Map<string, FirebaseFirestore.DocumentData[]>()
  progressDocs.forEach((p) => {
    const userId = p.userId as string
    if (!userId) return
    if (!byStudent.has(userId)) byStudent.set(userId, [])
    byStudent.get(userId)!.push(p)
  })

  const studentsCompletedAll =
    moduleCount > 0
      ? [...byStudent.values()].filter((rows) => rows.filter((p) => p.moduleCompleted).length >= moduleCount)
          .length
      : 0

  const totalCompleted = progressDocs.filter((p) => p.moduleCompleted).length
  const trackedStudents = byStudent.size

  // One pre/post pair per student, averaged across the modules they've
  // finished — so a student who did five modules doesn't outweigh one who
  // did one when the cohort gain is computed.
  const perStudentPairs = [...byStudent.values()].map((rows) => {
    const paired = rows.filter(
      (p) => typeof p.preTestScore === 'number' && typeof p.postTestScore === 'number',
    )
    if (paired.length === 0) return { pre: null, post: null }
    return {
      pre: Math.round(paired.reduce((s, p) => s + (p.preTestScore as number), 0) / paired.length),
      post: Math.round(paired.reduce((s, p) => s + (p.postTestScore as number), 0) / paired.length),
    }
  })
  const gain = cohortNormalizedGain(perStudentPairs)

  const transfer = transferAnalysis(decisions, responses, moduleOrderById)
  const safeRateByModule = new Map(transfer.byModule.map((p) => [p.moduleId, p.firstAttemptSafeRate]))

  const moduleBreakdown: CohortModulePoint[] = Object.keys(moduleOrderById)
    .map((moduleId) => {
      const rows = progressDocs.filter((p) => p.moduleId === moduleId)
      const moduleAttempts = attempts.filter((a) => a.moduleId === moduleId)
      const completed = rows.filter((p) => p.moduleCompleted).length
      const moduleGain = cohortNormalizedGain(
        rows.map((p) => ({ pre: p.preTestScore, post: p.postTestScore })),
      )
      return {
        moduleId,
        moduleOrder: moduleOrderById[moduleId],
        title: moduleTitleById[moduleId],
        studentsStarted: rows.length,
        studentsCompleted: completed,
        completionRate: rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0,
        avgScore:
          moduleAttempts.length > 0
            ? Math.round(moduleAttempts.reduce((s, a) => s + (a.score || 0), 0) / moduleAttempts.length)
            : 0,
        normalizedGain: moduleGain.normalizedGain,
        firstAttemptSafeRate: safeRateByModule.get(moduleId) ?? null,
      }
    })
    .sort((a, b) => a.moduleOrder - b.moduleOrder)

  return {
    totalStudents: studentCount,
    activeStudents: trackedStudents,
    studentsCompletedAll,
    avgModulesCompleted: trackedStudents > 0 ? Math.round((totalCompleted / trackedStudents) * 10) / 10 : 0,
    avgPreTestScore: gain.avgPre,
    avgPostTestScore: gain.avgPost,
    normalizedGain: gain.normalizedGain,
    pairedCount: gain.pairedCount,
    behaviour: behaviourMetrics(decisions),
    transfer,
    topicMastery: topicMastery(responses),
    moduleBreakdown,
    completionTrend: buildCompletionTrend(progressDocs, attempts),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }
}

/**
 * The transaction isn't for the arithmetic (already consistent from the
 * single read the document was computed from) but so two concurrent
 * aggregation runs can't interleave partial writes to the same document.
 */
async function writeCohortDoc(doc: CohortAnalyticsDoc): Promise<void> {
  await db.runTransaction(async (txn) => {
    const ref = repo.cohortAnalyticsRef()
    await txn.get(ref)
    txn.set(ref, doc)
  })
}

/**
 * aggregateCohortAnalytics
 * Recompute and persist the cohort rollup over every student.
 */
export async function aggregateCohortAnalytics(): Promise<CohortAnalyticsDoc> {
  const sources = await readCohortSources()
  const doc = buildCohortDoc(sources)
  await writeCohortDoc(doc)
  return doc
}

const describeError = (err: unknown) => (err instanceof Error ? err.message : String(err))

/**
 * Recomputes every aggregate the admin dashboard reads: all six modules
 * and the cohort rollup. Shared by the nightly schedule and the
 * dashboard's "Refresh All", so a scheduled run and a manual one can't
 * drift apart in what they cover.
 *
 * The per-module pass stays sequential. Those are scoped `where` queries
 * rather than full-collection reads, and running six at once against the
 * same collections buys nothing but contention on a class-sized dataset.
 *
 * A failure in one target is recorded and the rest still run: one
 * unconfigured module must not turn the nightly job into a no-op the
 * first time content happens to be mid-edit at 2am.
 */
export async function aggregateAllAnalytics(): Promise<{
  modules: number
  failures: Array<{ target: string; error: string }>
}> {
  const failures: Array<{ target: string; error: string }> = []

  let moduleCount = 0
  for (const moduleId of REAL_MODULE_IDS) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await aggregateModuleAnalytics(moduleId)
      moduleCount += 1
    } catch (err) {
      failures.push({ target: `module:${moduleId}`, error: describeError(err) })
    }
  }

  try {
    await aggregateCohortAnalytics()
  } catch (err) {
    failures.push({ target: 'cohort', error: describeError(err) })
  }

  return { modules: moduleCount, failures }
}

/**
 * Daily completions/submissions over the trailing window. Every day in
 * the window is emitted, including empty ones — a chart with gaps
 * silently compresses quiet periods and makes activity look steadier
 * than it was.
 */
export function buildCompletionTrend(
  progressDocs: FirebaseFirestore.DocumentData[],
  attempts: FirebaseFirestore.DocumentData[],
  now: Date = new Date(),
): TrendPoint[] {
  const days: TrendPoint[] = []
  const index = new Map<string, TrendPoint>()

  for (let offset = TREND_WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000)
    const point: TrendPoint = { date: isoDay(date), modulesCompleted: 0, quizzesSubmitted: 0, activeStudents: 0 }
    days.push(point)
    index.set(point.date, point)
  }

  const activeByDay = new Map<string, Set<string>>()

  progressDocs.forEach((p) => {
    const completedAt = toDate(p.completionDate)
    if (!completedAt) return
    const point = index.get(isoDay(completedAt))
    if (point) point.modulesCompleted += 1
  })

  attempts.forEach((a) => {
    const submittedAt = toDate(a.submittedAt)
    if (!submittedAt) return
    const day = isoDay(submittedAt)
    const point = index.get(day)
    if (!point) return
    point.quizzesSubmitted += 1
    if (a.userId) {
      if (!activeByDay.has(day)) activeByDay.set(day, new Set())
      activeByDay.get(day)!.add(a.userId as string)
    }
  })

  activeByDay.forEach((users, day) => {
    const point = index.get(day)
    if (point) point.activeStudents = users.size
  })

  return days
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
