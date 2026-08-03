/**
 * auth/controllers.ts
 * Callable entry points for admin-only account management. Same six
 * exported function names as the original functions/index.js — the
 * frontend's src/services/adminService.js calls these by name and is not
 * being modified, so the public contract must stay identical.
 */
import { requireAdmin, requireAuth } from '../shared/authGuards'
import { parseOrThrow } from '../shared/validation'
import { defineCallable } from '../shared/withCallable'
import * as service from './service'
import {
  changeOwnPasswordSchema,
  createUserAccountSchema,
  deleteUserAccountSchema,
  getAuditLogSchema,
  registerStudentAccountSchema,
  resetUserPasswordSchema,
  setUserAccountStatusSchema,
  setUserSectionSchema,
  updateOwnNicknameSchema,
} from './validators'

export const createUserAccount = defineCallable('createUserAccount', async (request) => {
  const actor = await requireAdmin(request)
  const input = parseOrThrow(createUserAccountSchema, request.data)
  return service.createUserAccount(actor, input)
})

// Deliberately public — no requireAuth/requireAdmin. This is the student
// self-registration flow reached from the logged-out Login page, so there
// is no caller identity to check yet. Safe to leave ungated because the
// input schema and service both hardcode role: 'student' server-side —
// nothing about who's allowed to call this lets a caller create anything
// other than an ordinary student account for themselves.
export const registerStudentAccount = defineCallable('registerStudentAccount', async (request) => {
  const input = parseOrThrow(registerStudentAccountSchema, request.data)
  return service.registerStudentAccount(input)
})

export const deleteUserAccount = defineCallable('deleteUserAccount', async (request) => {
  const actor = await requireAdmin(request)
  const input = parseOrThrow(deleteUserAccountSchema, request.data)
  return service.deleteUserAccount(actor, actor.uid, input)
})

export const resetUserPassword = defineCallable('resetUserPassword', async (request) => {
  const actor = await requireAdmin(request)
  const input = parseOrThrow(resetUserPasswordSchema, request.data)
  return service.resetUserPassword(actor, input)
})

export const setUserAccountStatus = defineCallable('setUserAccountStatus', async (request) => {
  const actor = await requireAdmin(request)
  const input = parseOrThrow(setUserAccountStatusSchema, request.data)
  return service.setUserAccountStatus(actor, actor.uid, input)
})

// Admin-only, unlike updateOwnNickname below: a section decides which
// cohort report a student's results are counted in, so it is not something
// a student may set for themselves after registration.
export const setUserSection = defineCallable('setUserSection', async (request) => {
  const actor = await requireAdmin(request)
  const input = parseOrThrow(setUserSectionSchema, request.data)
  return service.setUserSection(actor, { uid: input.uid, section: input.section ?? null })
})

export const changeOwnPassword = defineCallable('changeOwnPassword', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(changeOwnPasswordSchema, request.data)
  return service.changeOwnPassword(uid, input)
})

export const updateOwnNickname = defineCallable('updateOwnNickname', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(updateOwnNicknameSchema, request.data)
  return service.updateOwnNickname(uid, input)
})

export const listUsers = defineCallable('listUsers', async (request) => {
  await requireAdmin(request)
  return service.listUsers()
})

export const getAuditLog = defineCallable('getAuditLog', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(getAuditLogSchema, request.data ?? {})
  return service.getAuditLog(input.limit)
})
