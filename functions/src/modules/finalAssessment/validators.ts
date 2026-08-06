import { z } from 'zod'

export const submitFinalAssessmentSchema = z.object({
  answers: z.record(z.string(), z.string()),
  // Per-question milliseconds. Capped at an hour so a tab left open
  // overnight can't drag a cohort's average time-to-answer into
  // meaninglessness; a missing entry stays missing rather than becoming 0.
  durations: z.record(z.string(), z.number().min(0).max(3_600_000)).optional(),
})

const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, 'Every choice needs text.'),
})

const questionSchema = z
  .object({
    id: z.string().min(1),
    order: z.number().int().min(1),
    text: z.string().min(1, 'Every question needs text.'),
    choices: z.array(choiceSchema).min(2, 'A question needs at least two choices.'),
    correctChoiceId: z.string().min(1),
    explanation: z.string(),
    difficulty: z.string(),
    topic: z.string().optional(),
    sourceModuleId: z.string().optional(),
  })
  .refine((q) => q.choices.some((c) => c.id === q.correctChoiceId), {
    message: 'correctChoiceId must reference one of the question\'s own choices.',
    path: ['correctChoiceId'],
  })

export const updateFinalAssessmentSchema = z.object({
  title: z.string().min(1, 'The final assessment needs a title.'),
  settings: z.object({
    passingScore: z.number().min(0).max(100),
    timeLimitMinutes: z.number().min(0).max(600),
    instructions: z.string(),
    available: z.boolean(),
    attemptsAllowed: z.number().int().min(1).max(10),
  }),
  questions: z.array(questionSchema).min(1, 'The final assessment needs at least one question.'),
})
