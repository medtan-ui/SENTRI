/**
 * auth/validators.ts
 * Same password/role rules the original functions/index.js enforced,
 * reimplemented as zod schemas so they compose with the rest of the
 * backend's validation layer. Password complexity mirrors
 * src/utils/passwordPolicy.js on the frontend (UX-only there; this is the
 * authoritative check).
 */
import { z } from 'zod'
import { MIN_PASSWORD_LENGTH } from '../shared/constants'

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .refine((value) => /[a-z]/.test(value), 'Password must include a lowercase letter.')
  .refine((value) => /[A-Z]/.test(value), 'Password must include an uppercase letter.')
  .refine((value) => /[0-9]/.test(value), 'Password must include a number.')

export const roleSchema = z.enum(['student', 'admin'])

// This project is scoped to a single school (TIP) — every account, admin or
// student, is created against an @tip.edu.ph address. Checked lowercase here
// rather than relying on the caller's later .toLowerCase() normalization,
// since that runs after this schema has already validated the raw input.
// Shared by every account-creation path (admin-created and self-registered)
// so the domain rule can't drift between them.
export const schoolEmailSchema = z
  .string()
  .trim()
  .min(1, 'email is required.')
  .email('Please provide a valid email address.')
  .refine((value) => value.toLowerCase().endsWith('@tip.edu.ph'), 'Only @tip.edu.ph email addresses are allowed.')

export const createUserAccountSchema = z.object({
  email: schoolEmailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1, 'displayName is required.'),
  nickname: z.string().trim().min(1).optional(),
  role: roleSchema,
})

// Public, unauthenticated self-registration — always creates a student
// account (role is never client-controlled here, unlike createUserAccountSchema
// above, which stays admin-only). Nickname is required, not optional, since
// the public registration form always collects it.
export const registerStudentAccountSchema = z.object({
  email: schoolEmailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1, 'displayName is required.'),
  nickname: z.string().trim().min(1, 'nickname is required.').max(50, 'Nickname is too long.'),
})

export const deleteUserAccountSchema = z.object({
  uid: z.string().min(1, 'uid is required.'),
})

export const resetUserPasswordSchema = z.object({
  uid: z.string().min(1, 'uid is required.'),
  newPassword: passwordSchema,
})

export const setUserAccountStatusSchema = z.object({
  uid: z.string().min(1, 'uid is required.'),
  status: z.enum(['active', 'disabled']),
})

export const changeOwnPasswordSchema = z.object({
  newPassword: passwordSchema,
})

export const updateOwnNicknameSchema = z.object({
  nickname: z.string().trim().min(1, 'nickname is required.').max(50, 'Nickname is too long.'),
})

export const getAuditLogSchema = z.object({
  limit: z.number().int().positive().max(200).optional(),
})
