export interface ModuleProgressDoc {
  userId: string
  moduleId: string
  moduleOrder: number
  isUnlocked: boolean
  lessonStarted: boolean
  lessonCompleted: boolean
  simulationCompleted: boolean
  quizCompleted: boolean
  moduleCompleted: boolean
  score: number | null
  attempts: number
  lastAccessed: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
  completionDate: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null
  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp

  // ── Pre / post measurement ───────────────────────────────────────
  // Both run on the same item bank; see modules/assessment. Optional
  // because documents created before these fields existed simply don't
  // have them, and every reader treats "absent" as "not taken yet".
  preTestCompleted?: boolean
  preTestScore?: number | null
  preTestCompletedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null
  postTestCompleted?: boolean
  postTestScore?: number | null
  postTestCompletedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null
  /** Hake's normalized gain, stored at post-test time so a later edit to
   * the item bank can't retroactively change a reported gain. */
  normalizedGain?: number | null

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
