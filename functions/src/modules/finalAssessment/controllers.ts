import { requireAdmin, requireAuth } from '../../shared/authGuards'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as repo from './repository'
import * as service from './service'
import { submitFinalAssessmentSchema, updateFinalAssessmentSchema } from './validators'

/**
 * getFinalAssessmentForStudent — what the student final assessment page
 * actually calls to render the form. See service.ts: correctChoiceId/
 * explanation never leave the server here, unlike the admin editor's
 * direct Firestore read of the same document (getFinalAssessment in
 * src/services/finalAssessmentService.js, unchanged, still correct for
 * that use since an editor has to see the answer key).
 */
export const getFinalAssessmentForStudent = defineCallable('getFinalAssessmentForStudent', async (request) => {
  requireAuth(request)
  const assessment = await service.getFinalAssessmentForStudent()
  return { assessment }
})

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
