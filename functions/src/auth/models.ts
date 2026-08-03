export type UserRole = 'student' | 'admin'

export interface UserProfile {
  role: UserRole
  displayName: string
  nickname: string
  email: string
  status: 'active' | 'disabled'
  mustChangePassword: boolean
  /**
   * The class group this account belongs to, as typed (e.g. "BSIT-3A").
   * Null for admins and for students who haven't been assigned one — the
   * analytics rollup treats that as "unassigned" rather than dropping
   * them. See shared/sections.ts for how the label becomes a group key.
   */
  section?: string | null
  createdAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
}

export interface CreateUserAccountInput {
  email: string
  password: string
  displayName: string
  nickname?: string
  role: UserRole
  section?: string | null
}

export interface RegisterStudentAccountInput {
  email: string
  password: string
  displayName: string
  nickname: string
  section?: string | null
}

export interface SetUserSectionInput {
  uid: string
  /** Null or blank clears the assignment. */
  section: string | null
}

export interface SetUserAccountStatusInput {
  uid: string
  status: 'active' | 'disabled'
}

export interface DeleteUserAccountInput {
  uid: string
}

export interface ResetUserPasswordInput {
  uid: string
  newPassword: string
}

export interface ChangeOwnPasswordInput {
  newPassword: string
}

export interface UpdateOwnNicknameInput {
  nickname: string
}

export interface GetAuditLogInput {
  limit?: number
}

export interface AuditLogEntry {
  action: string
  actorUid: string
  actorEmail: string | null
  targetUid: string | null
  targetEmail: string | null
  details: unknown
}
