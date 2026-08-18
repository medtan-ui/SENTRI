export interface ModuleProgressDoc {
  userId: string
  moduleId: string
  moduleOrder: number
  isUnlocked: boolean
  lessonStarted: boolean
  lessonCompleted: boolean
  simulationCompleted: boolean
  /** Set the first time a run through this module's simulation finishes
   * with no risky choice, replays included. Replays record no decisions
   * (so the safe/risky measurement stays the first run's), which is
   * exactly why the badge rule needs this flag as well as the counters. */
  simulationFlawless?: boolean
  quizCompleted: boolean
  moduleCompleted: boolean
  score: number | null
  attempts: number
  lastAccessed: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
  completionDate: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null
  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp

  // ── Baseline measurement ─────────────────────────────────────────
  // The per-module pre-test; see modules/assessment. Optional because
  // documents created before these fields existed simply don't have them,
  // and every reader treats "absent" as "not taken yet".
  //
  // There is deliberately no matching per-module post-test. The "after"
  // measurement is the single end-of-curriculum final assessment, whose
  // score and normalized gain live in finalAssessmentProgress/{userId}
  // (see modules/finalAssessment) — one document per student, not one per
  // student per module.
  preTestCompleted?: boolean
  preTestScore?: number | null
  preTestCompletedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null

  // ── Quiz retry / appeal ──────────────────────────────────────────
  // A quiz is one attempt by default. An admin may grant exactly one
  // extra attempt; `attemptsAllowed` is what submitQuiz checks against.
  attemptsAllowed?: number
  retryGrantedBy?: string | null
  retryGrantedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null
  retryReason?: string | null
}

export interface InitializeStudentProgressInput {
  moduleId?: string
  targetUserId?: string
}

export interface ModuleIdInput {
  moduleId: string
}

export interface ResetModuleProgressInput {
  userId: string
  moduleId: string
}
