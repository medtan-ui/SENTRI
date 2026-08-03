import { z } from 'zod'

export const submitAssessmentSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
  assessmentType: z.enum(['pretest', 'posttest']),
  answers: z.record(z.string(), z.string()),
  // Per-question milliseconds. Capped at an hour so a tab left open
  // overnight can't drag a cohort's average time-to-answer into
  // meaninglessness; a missing entry stays missing rather than becoming 0.
  durations: z.record(z.string(), z.number().min(0).max(3_600_000)).optional(),
})
