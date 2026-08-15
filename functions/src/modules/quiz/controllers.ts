import { requireAuth } from '../../shared/authGuards'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as service from './service'
import { getQuizForStudentSchema, submitQuizSchema } from './validators'

/**
 * getQuizForStudent — what StudentQuizPage actually calls to render the
 * quiz form. See service.ts: correctChoiceId/explanation never leave the
 * server here, unlike the admin editor's direct Firestore read of the same
 * document (see src/services/quizService.js, unchanged, still correct for
 * that use since an editor has to see the answer key).
 */
export const getQuizForStudent = defineCallable('getQuizForStudent', async (request) => {
  requireAuth(request)
  const input = parseOrThrow(getQuizForStudentSchema, request.data)
  const quiz = await service.getQuizForStudent(input.moduleId)
  return { quiz }
})

export const submitQuiz = defineCallable('submitQuiz', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(submitQuizSchema, request.data)
  return service.submitQuiz(uid, input.moduleId, input.answers, input.durations)
})
