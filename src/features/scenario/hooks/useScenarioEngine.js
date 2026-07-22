import { useCallback, useEffect, useRef, useState } from 'react'
import { SCENARIO_STATES } from '../types/scenario.types'

// Brief beat between a video reaching its pause point (or a "Try Again")
// and the decision overlay appearing, so the pause visually registers
// first. Purely a UX polish delay, not part of the state machine's logic.
const DECISION_BEAT_MS = 350
// Simulated "config load" delay before the very first INTRO screen.
// Stands in for a future async fetch (e.g. Firestore) without adding one now.
const LOADING_BEAT_MS = 400

/**
 * useScenarioEngine
 *
 * Drives the entire animation-based scenario flow from a single
 * ModuleScenarioConfig (see ../types/scenario.types.js). Knows nothing
 * about any specific module — every string, choice, and video comes from
 * `config`.
 *
 * State machine (see scenario.types.js for the full diagram):
 *   LOADING -> INTRO -> PLAYING -> PAUSED -> DECISION -> FEEDBACK
 *     safe:  FEEDBACK -> PLAYING (resume to end) -> INTRO (next) | COMPLETE
 *     risky: FEEDBACK -> CONSEQUENCE -> PAUSED (try again, never PLAYING/INTRO)
 *
 * @param {import('../types/scenario.types').ModuleScenarioConfig} config
 */
export function useScenarioEngine(config) {
  const [engineState, setEngineState] = useState(SCENARIO_STATES.LOADING)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState(null)
  const [completedScenarioIds, setCompletedScenarioIds] = useState([])
  const [safeChoices, setSafeChoices] = useState(0)
  const [riskyAttempts, setRiskyAttempts] = useState(0)

  const currentScenario = config.scenarios[scenarioIndex]
  const totalScenarios = config.scenarios.length
  const isLastScenario = scenarioIndex === totalScenarios - 1
  const activeChoice = selectedChoiceId
    ? currentScenario.choices.find((c) => c.id === selectedChoiceId) || null
    : null

  // ── LOADING -> INTRO, once, on mount ──
  useEffect(() => {
    const timer = setTimeout(() => setEngineState(SCENARIO_STATES.INTRO), LOADING_BEAT_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── PAUSED -> DECISION, automatically ──
  // Reused by both "video reached its pause timestamp" and "Try Again"
  // (which also lands on PAUSED) so both paths show the overlay the same way.
  useEffect(() => {
    if (engineState !== SCENARIO_STATES.PAUSED) return undefined
    const timer = setTimeout(() => setEngineState(SCENARIO_STATES.DECISION), DECISION_BEAT_MS)
    return () => clearTimeout(timer)
  }, [engineState])

  const beginScenario = useCallback(() => {
    setEngineState(SCENARIO_STATES.PLAYING)
  }, [])

  // Called by ScenarioPlayer when the video's currentTime reaches pauseTimestamp.
  const handleReachedPauseTimestamp = useCallback(() => {
    setEngineState((prev) => (prev === SCENARIO_STATES.PLAYING ? SCENARIO_STATES.PAUSED : prev))
  }, [])

  const selectChoice = useCallback(
    (choiceId) => {
      const choice = currentScenario.choices.find((c) => c.id === choiceId)
      if (!choice) return
      setSelectedChoiceId(choiceId)
      if (choice.isSafe) {
        setSafeChoices((n) => n + 1)
      } else {
        setRiskyAttempts((n) => n + 1)
      }
      setEngineState(SCENARIO_STATES.FEEDBACK)
    },
    [currentScenario],
  )

  // Safe path: story continues — resume the same video from where it paused.
  const continueFromFeedback = useCallback(() => {
    setEngineState(SCENARIO_STATES.PLAYING)
  }, [])

  // Risky path: move from the feedback banner into the consequence playback.
  const viewConsequence = useCallback(() => {
    setEngineState(SCENARIO_STATES.CONSEQUENCE)
  }, [])

  // Risky path: "Try Again" — back to PAUSED (never PLAYING, never INTRO),
  // resuming from the same pauseTimestamp the video never left.
  const retryFromConsequence = useCallback(() => {
    setSelectedChoiceId(null)
    setEngineState(SCENARIO_STATES.PAUSED)
  }, [])

  // Called by ScenarioPlayer once the full clip (post-resume) finishes.
  const handleScenarioVideoEnded = useCallback(() => {
    setCompletedScenarioIds((ids) =>
      ids.includes(currentScenario.id) ? ids : [...ids, currentScenario.id],
    )
    setSelectedChoiceId(null)
    setEngineState((prev) => {
      if (prev !== SCENARIO_STATES.PLAYING) return prev
      return isLastScenario ? SCENARIO_STATES.COMPLETE : SCENARIO_STATES.INTRO
    })
    if (!isLastScenario) {
      setScenarioIndex((i) => i + 1)
    }
  }, [currentScenario, isLastScenario])

  const resultRef = useRef(null)
  if (engineState === SCENARIO_STATES.COMPLETE && !resultRef.current) {
    resultRef.current = { simulationPassed: true, safeChoices, riskyAttempts }
  }

  return {
    engineState,
    currentScenario,
    scenarioIndex,
    totalScenarios,
    isLastScenario,
    completedScenarioIds,
    safeChoices,
    riskyAttempts,
    activeChoice,
    result: resultRef.current,
    actions: {
      beginScenario,
      handleReachedPauseTimestamp,
      selectChoice,
      continueFromFeedback,
      viewConsequence,
      retryFromConsequence,
      handleScenarioVideoEnded,
    },
  }
}
