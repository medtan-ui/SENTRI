import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recordDecision, markFeedbackViewed } from '../services/scenarioDecisionService'

const LOADING_MS = 300
const PLAYING_MS = 1300
const RESOLVING_MS = 250
const ADVANCING_MS = 600

const PULSE_IDLE_MS = 15000

/**
 * useScenarioEngine
 * The Video-Pause-Interact-Branch state machine:
 *   loading -> playing -> paused_interactive -> resolving -> feedback
 *     -> paused_interactive (retry, same pause point) | advancing -> (next scenario | complete)
 *
 * Also owns the idle-pulse scheduling (a quiet breathing highlight on the
 * target itself, via InteractiveTarget's .idlePulse) and the target
 * registry scenes/InteractiveTarget share — everything a bespoke scene
 * needs comes back out of this hook; scenes never touch Firestore or
 * timers themselves.
 *
 * @param {import('../configs/passwordSecurity.config').ModuleScenarioConfig} config
 * @param {string|null} userId
 */
export function useScenarioEngine(config, userId) {
  const [state, setState] = useState('loading')
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [completedScenarioIds, setCompletedScenarioIds] = useState([])

  // How many scenarios were resolved safely without a single risky
  // attempt. Purely for the run's own feedback — a student who needed
  // three goes still finishes, and the engine still records every
  // attempt to scenarioDecisionRecords exactly as before. This is the
  // number that makes a second playthrough worth doing.
  const [cleanCalls, setCleanCalls] = useState(0)

  const [pulseIdleActive, setPulseIdleActive] = useState(false)
  const hasInteractedRef = useRef(false)
  const [hasInteractedBefore, setHasInteractedBefore] = useState(false)

  const currentDecisionIdRef = useRef(null)
  const targetRegistry = useRef(new Map())

  // When the current scene last became interactive. The difference
  // between this and the moment a choice lands is the time-to-decide
  // measure — set on every entry into paused_interactive, so a retry is
  // timed from the retry, not from the scenario's original start.
  const decisionStartedAtRef = useRef(null)

  const currentScenario = config.scenarios[scenarioIndex]
  const totalScenarios = config.scenarios.length
  const isLastScenario = scenarioIndex === totalScenarios - 1
  const coachLevel = config.coachLevel || 'full'
  const guidedHintActive = !selectedChoice && attemptCount >= 3

  // ── Target registry (for AffordanceCoach to find a target's DOM node) ──
  const registerTarget = useCallback((id, node) => {
    if (node) targetRegistry.current.set(id, node)
  }, [])
  const unregisterTarget = useCallback((id) => {
    targetRegistry.current.delete(id)
  }, [])
  const getTargetNode = useCallback((id) => targetRegistry.current.get(id) || null, [])

  // ── Idle-pulse timer bookkeeping ──
  const pulseTimerRef = useRef(null)

  const clearPulseTimer = () => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    pulseTimerRef.current = null
  }

  const notifyInteraction = useCallback(() => {
    if (hasInteractedRef.current) return
    hasInteractedRef.current = true
    setHasInteractedBefore(true)
    setPulseIdleActive(false)
    clearPulseTimer()
  }, [])

  // Start the decision clock the moment the scene becomes interactive.
  // Runs on every entry into paused_interactive, including a retry, so
  // each attempt is timed on its own rather than accumulating.
  useEffect(() => {
    if (state === 'paused_interactive') decisionStartedAtRef.current = Date.now()
  }, [state, scenarioIndex])

  // Arm the idle-pulse timer whenever a fresh paused_interactive begins
  // and the student hasn't shown understanding yet. A config can opt a
  // scenario out entirely with coachLevel: 'none'.
  useEffect(() => {
    clearPulseTimer()
    if (state !== 'paused_interactive' || hasInteractedRef.current || coachLevel === 'none') return undefined

    pulseTimerRef.current = setTimeout(() => {
      if (!hasInteractedRef.current) setPulseIdleActive(true)
    }, PULSE_IDLE_MS)
    return clearPulseTimer
  }, [state, scenarioIndex, coachLevel])

  // ── loading -> playing ──
  useEffect(() => {
    if (state !== 'loading') return undefined
    const t = setTimeout(() => setState('playing'), LOADING_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, scenarioIndex])

  // ── playing -> paused_interactive ── (poster/video beat; never blocks
  // on videoAvailable, per spec — always advances after a fixed beat)
  useEffect(() => {
    if (state !== 'playing') return undefined
    const t = setTimeout(() => setState('paused_interactive'), PLAYING_MS)
    return () => clearTimeout(t)
  }, [state])

  /**
   * selectChoice
   * Called by a scene once it has resolved a scenarioChoiceId — either
   * directly from a single target click, or from compound logic (e.g.
   * comparing three password fields) that only a bespoke scene can do.
   * @param {string} choiceId
   */
  const selectChoice = useCallback(
    (choiceId) => {
      if (state !== 'paused_interactive') return
      const choice = currentScenario.choices.find((c) => c.scenarioChoiceId === choiceId)
      if (!choice) return

      const startedAt = decisionStartedAtRef.current
      const durationMs = startedAt ? Date.now() - startedAt : null

      setSelectedChoice(choice)
      setState('resolving')

      recordDecision({
        userId,
        moduleId: config.moduleId,
        scenarioId: currentScenario.scenarioId,
        choiceId: choice.scenarioChoiceId,
        isSafe: choice.isSafeChoice,
        // attemptCount counts *risky* attempts already made on this
        // scenario, so the attempt now being recorded is the next one.
        attemptNumber: attemptCount + 1,
        durationMs,
      }).then((decisionId) => {
        currentDecisionIdRef.current = decisionId
      })
    },
    [state, currentScenario, userId, config.moduleId, attemptCount],
  )

  // ── resolving -> feedback (both safe and risky go straight there) ──
  useEffect(() => {
    if (state !== 'resolving' || !selectedChoice) return undefined
    const t = setTimeout(() => {
      if (!selectedChoice.isSafeChoice) setAttemptCount((n) => n + 1)
      setState('feedback')
    }, RESOLVING_MS)
    return () => clearTimeout(t)
  }, [state, selectedChoice])

  const retry = useCallback(() => {
    markFeedbackViewed(currentDecisionIdRef.current)
    currentDecisionIdRef.current = null
    setSelectedChoice(null)
    setState('paused_interactive')
  }, [])

  const continueToNext = useCallback(() => {
    markFeedbackViewed(currentDecisionIdRef.current)
    currentDecisionIdRef.current = null
    // Only reachable from a safe resolution (the feedback panel offers
    // Continue for safe choices and Try Again for risky ones), so
    // attemptCount === 0 here means the student got it right first go.
    if (attemptCount === 0) setCleanCalls((n) => n + 1)
    setCompletedScenarioIds((prev) =>
      prev.includes(currentScenario.scenarioId) ? prev : [...prev, currentScenario.scenarioId],
    )
    setState('advancing')
  }, [currentScenario, attemptCount])

  // ── advancing -> next scenario's loading, or complete ──
  useEffect(() => {
    if (state !== 'advancing') return undefined
    const t = setTimeout(() => {
      setSelectedChoice(null)
      setAttemptCount(0)
      if (isLastScenario) {
        setState('complete')
      } else {
        setScenarioIndex((i) => i + 1)
        setState('loading')
      }
    }, ADVANCING_MS)
    return () => clearTimeout(t)
  }, [state, isLastScenario])

  return {
    state,
    currentScenario,
    scenarioIndex,
    totalScenarios,
    isLastScenario,
    completedScenarioIds,
    attemptCount,
    cleanCalls,
    guidedHintActive,
    selectedChoice,
    coachLevel,
    pulseIdleActive,
    hasInteractedBefore,
    interaction: {
      registerTarget,
      unregisterTarget,
      notifyInteraction,
      getTargetNode,
      pulseIdleActive,
    },
    actions: {
      selectChoice,
      retry,
      continueToNext,
    },
  }
}
