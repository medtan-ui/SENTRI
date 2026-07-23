export type UserRole = 'student' | 'admin'

export interface UserProfile {
  role: UserRole
  displayName: string
  email: string
  status: 'active' | 'disabled'
  mustChangePassword: boolean
  createdAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
}

export interface CreateUserAccountInput {
  email: string
  password: string
  displayName: string
  role: UserRole
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
