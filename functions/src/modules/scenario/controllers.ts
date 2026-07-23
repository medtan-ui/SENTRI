import { requireAuth } from '../../shared/authGuards'
import { parseOrThrow } from '../../shared/validation'
import { defineCallable } from '../../shared/withCallable'
import * as service from './service'
import { submitScenarioDecisionSchema } from './validators'

export const submitScenarioDecision = defineCallable('submitScenarioDecision', async (request) => {
  const { uid } = requireAuth(request)
  const input = parseOrThrow(submitScenarioDecisionSchema, request.data)
  return service.submitScenarioDecision(uid, input.moduleId, input.scenarioId, input.choiceId)
})
