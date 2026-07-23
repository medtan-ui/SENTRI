export interface SubmitScenarioDecisionInput {
  moduleId: string
  scenarioId: string
  choiceId: string
}

export interface ScenarioVideo {
  videoUrl: string
  videoAvailable: boolean
  thumbnail?: string
  duration: number
}

export interface ScenarioChoice {
  id: string
  text: string
  isSafe: boolean
  feedbackTitle: string
  feedbackText: string
  consequenceVideo?: ScenarioVideo
}

export interface ScenarioItem {
  id: string
  title: string
  order: number
  simulatedUrl?: string
  video: ScenarioVideo
  pauseTimestamp: number
  choices: ScenarioChoice[]
}

export interface ScenarioConfig {
  id: string
  title: string
  surface: 'browser' | 'phone'
  scenarios: ScenarioItem[]
}

export interface SubmitScenarioDecisionResult {
  isSafe: boolean
  feedback: { title: string; text: string }
  consequence: { feedbackTitle: string; feedbackText: string; consequenceVideo?: ScenarioVideo } | null
}
