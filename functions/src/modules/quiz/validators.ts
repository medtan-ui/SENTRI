import { z } from 'zod'

export const getQuizForStudentSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
})

export const submitQuizSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
  answers: z.record(z.string(), z.string()),
  // Per-question milliseconds, for the time-to-answer metrics. Capped at
  // an hour so a tab left open overnight can't distort a cohort average;
  // a missing entry stays missing rather than becoming 0.
  durations: z.record(z.string(), z.number().min(0).max(3_600_000)).optional(),
})
