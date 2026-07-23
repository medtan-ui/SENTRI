/**
 * shared/validation.ts
 * Every callable's input schema is a zod schema (see each module's
 * validators.ts); parseOrThrow turns a failed parse into the same
 * AppError('invalid-argument', ...) shape every other validation failure
 * uses, with the itemized issues attached as `details` for the client.
 */
import { z } from 'zod'
import { AppError } from './errors'

export function parseOrThrow<Schema extends z.ZodTypeAny>(schema: Schema, data: unknown): z.infer<Schema> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new AppError('invalid-argument', 'The request data is invalid.', {
      issues: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    })
  }
  return result.data
}
