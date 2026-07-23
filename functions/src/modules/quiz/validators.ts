import { z } from 'zod'

export const submitQuizSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required.'),
  answers: z.record(z.string(), z.string()),
})
