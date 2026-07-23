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

export const createUserAccountSchema = z.object({
  email: z.string().trim().min(1, 'email is required.').email('Please provide a valid email address.'),
  password: passwordSchema,
  displayName: z.string().trim().min(1, 'displayName is required.'),
  role: roleSchema,
})

export const deleteUserAccountSchema = z.object({
  uid: z.string().min(1, 'uid is required.'),
})

export const resetUserPasswordSchema = z.object({
  uid: z.string().min(1, 'uid is required.'),
  newPassword: passwordSchema,
})

export const changeOwnPasswordSchema = z.object({
  newPassword: passwordSchema,
})

export const getAuditLogSchema = z.object({
  limit: z.number().int().positive().max(200).optional(),
})
