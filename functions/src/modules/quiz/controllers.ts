import { requireAuth } from '../../shared/authGuards'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as service from './service'
import { submitQuizSchema } from './validators'

export const submitQuiz = defineCallable('submitQuiz', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(submitQuizSchema, request.data)
  return service.submitQuiz(uid, input.moduleId, input.answers)
})
