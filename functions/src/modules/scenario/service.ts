import { AppError } from '../../shared/errors'
import { getModuleOrThrow } from '../../shared/moduleGuards'
import * as repo from './repository'
import { SubmitScenarioDecisionResult } from './models'

export async function submitScenarioDecision(
  userId: string,
  moduleId: string,
  scenarioId: string,
  choiceId: string,
): Promise<SubmitScenarioDecisionResult> {
  await getModuleOrThrow(moduleId)

  const config = await repo.getScenarioConfig(moduleId)
  if (!config) {
    throw new AppError('not-found', `Module "${moduleId}" has no scenario configured yet.`)
  }

  const scenario = config.scenarios.find((s) => s.id === scenarioId)
  if (!scenario) {
    throw new AppError('not-found', `Scenario "${scenarioId}" does not exist for this module.`)
  }

  const choice = scenario.choices.find((c) => c.id === choiceId)
  if (!choice) {
    throw new AppError('invalid-argument', `Choice "${choiceId}" does not exist for this scenario.`)
  }

  await repo.recordDecision({ userId, moduleId, scenarioId, choiceId, isSafe: choice.isSafe })

  if (choice.isSafe) {
    return {
      isSafe: true,
      feedback: { title: choice.feedbackTitle, text: choice.feedbackText },
      consequence: null,
    }
  }

  return {
    isSafe: false,
    feedback: { title: choice.feedbackTitle, text: choice.feedbackText },
    consequence: {
      feedbackTitle: choice.feedbackTitle,
      feedbackText: choice.feedbackText,
      consequenceVideo: choice.consequenceVideo,
    },
  }
}
