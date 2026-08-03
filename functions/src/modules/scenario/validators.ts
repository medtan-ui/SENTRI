import { z } from 'zod'

export const submitScenarioDecisionSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
  scenarioId: z.string().min(1, 'scenarioId is required.'),
  choiceId: z.string().min(1, 'choiceId is required.'),
  attemptNumber: z.number().int().min(1).max(100).optional(),
  // Capped at an hour: a student who walked away mid-scenario shouldn't
  // silently redefine what a "slow" decision looks like for everyone else.
  durationMs: z.number().min(0).max(3_600_000).optional(),
})
