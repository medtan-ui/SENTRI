import { z } from 'zod'

export const submitScenarioDecisionSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
  scenarioId: z.string().min(1, 'scenarioId is required.'),
  choiceId: z.string().min(1, 'choiceId is required.'),
})
