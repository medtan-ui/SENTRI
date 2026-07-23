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
  resetUserPasswordSchema,
} from './validators'

export const createUserAccount = defineCallable('createUserAccount', async (request) => {
  const actor = await requireAdmin(request)
  const input = parseOrThrow(createUserAccountSchema, request.data)
  return service.createUserAccount(actor, input)
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

export const changeOwnPassword = defineCallable('changeOwnPassword', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(changeOwnPasswordSchema, request.data)
  return service.changeOwnPassword(uid, input)
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
