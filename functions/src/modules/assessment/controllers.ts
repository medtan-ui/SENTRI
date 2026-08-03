import { requireAuth } from '../../shared/authGuards'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as service from './service'
import { submitAssessmentSchema } from './validators'

/**
 * submitAssessment — the pre-test and post-test entry point. The graded
 * quiz has its own callable (submitQuiz); this one handles the two
 * ungraded measurements that bracket a module.
 */
export const submitAssessment = defineCallable('submitAssessment', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(submitAssessmentSchema, request.data)
  return service.submitAssessment(uid, input.moduleId, input.assessmentType, input.answers, input.durations)
})
