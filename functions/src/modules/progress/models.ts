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
