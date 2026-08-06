/**
 * modules/scenario/service.ts
 * Server-side validation and recording of one scenario decision. The
 * client tells us *which* choice was taken; whether that choice is safe
 * is read from the stored config here, never trusted from the client —
 * the same rule quiz grading follows.
 */
import { AppError } from '../../shared/errors'
import { getModuleOrThrow } from '../../shared/moduleGuards'
import * as repo from './repository'
import { SubmitScenarioDecisionResult } from './models'

export async function submitScenarioDecision(
  userId: string,
  moduleId: string,
  scenarioId: string,
  choiceId: string,
  attemptNumber = 1,
  durationMs?: number,
): Promise<SubmitScenarioDecisionResult> {
  await getModuleOrThrow(moduleId)

  const config = await repo.getScenarioConfig(moduleId)
  if (!config) {
    throw new AppError('not-found', `Module "${moduleId}" has no scenario configured yet.`)
  }

  const scenario = config.scenarios.find((s) => s.scenarioId === scenarioId)
  if (!scenario) {
    throw new AppError('not-found', `Scenario "${scenarioId}" does not exist for this module.`)
  }

  const choice = scenario.choices.find((c) => c.scenarioChoiceId === choiceId)
  if (!choice) {
    throw new AppError('invalid-argument', `Choice "${choiceId}" does not exist for this scenario.`)
  }

  const decisionId = await repo.recordDecision({
    userId,
    moduleId,
    scenarioId,
    choiceId,
    isSafe: choice.isSafeChoice,
    attemptNumber,
    durationMs,
  })

  return {
    isSafe: choice.isSafeChoice,
    decisionId,
    feedback: { title: choice.outcomeTitle, text: choice.feedbackText },
    consequence: choice.isSafeChoice
      ? null
      : {
          outcomeTitle: choice.outcomeTitle,
          consequenceType: choice.consequenceType,
          feedbackMediaUrl: choice.feedbackMediaUrl ?? null,
        },
  }
}
