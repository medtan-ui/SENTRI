import { requireAdmin, requireAuth } from '../../shared/authGuards'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as repo from './repository'
import * as service from './service'
import { submitFinalAssessmentSchema, updateFinalAssessmentSchema } from './validators'

/**
 * submitFinalAssessment — the one end-of-curriculum test, graded
 * server-side. Replaces the six per-module post-tests.
 */
export const submitFinalAssessment = defineCallable('submitFinalAssessment', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(submitFinalAssessmentSchema, request.data)
  return service.submitFinalAssessment(uid, input.answers, input.durations)
})

/**
 * updateFinalAssessment — admin-only edit of the single config document,
 * mirroring updateQuizConfiguration for a module quiz. Validated
 * server-side so a malformed question set can never reach a student.
 */
export const updateFinalAssessment = defineCallable('updateFinalAssessment', async (request) => {
  await requireAdmin(request)
  const input = parseOrThrow(updateFinalAssessmentSchema, request.data)
  await repo.configRef().set(input, { merge: false })
  return { saved: true }
})
