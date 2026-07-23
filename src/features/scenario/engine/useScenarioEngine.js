import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recordDecision, markFeedbackViewed } from '../services/scenarioDecisionService'

const LOADING_MS = 300
const PLAYING_MS = 1300
const RESOLVING_MS = 250
const ADVANCING_MS = 600

const COACH_DELAY_MS = { full: 2500, idle: 8000 }
const COACH_REAPPEAR_MS = 12000
const PULSE_IDLE_MS = 15000

/**
 * useScenarioEngine
 * The Video-Pause-Interact-Branch state machine:
 *   loading -> playing -> paused_interactive -> resolving
 *     -> consequence (risky only) -> feedback
 *     -> paused_interactive (retry, same pause point) | advancing -> (next scenario | complete)
 *
 * Also owns the affordance-coach scheduling (Layer 2/3) and the target
 * registry scenes/InteractiveTarget/AffordanceCoach share — everything
 * a bespoke scene needs comes back out of this hook; scenes never touch
 * Firestore or timers themselves.
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

  const [coachActive, setCoachActive] = useState(false)
  const [pulseIdleActive, setPulseIdleActive] = useState(false)
  const hasInteractedRef = useRef(false)
  const [hasInteractedBefore, setHasInteractedBefore] = useState(false)

  const currentDecisionIdRef = useRef(null)
  const targetRegistry = useRef(new Map())

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

  // ── Coach/idle-pulse timer bookkeeping ──
  const coachTimerRef = useRef(null)
  const pulseTimerRef = useRef(null)

  const clearCoachTimer = () => {
    if (coachTimerRef.current) clearTimeout(coachTimerRef.current)
    coachTimerRef.current = null
  }
  const clearPulseTimer = () => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    pulseTimerRef.current = null
  }

  const notifyInteraction = useCallback(() => {
    if (hasInteractedRef.current) return
    hasInteractedRef.current = true
    setHasInteractedBefore(true)
    setCoachActive(false)
    setPulseIdleActive(false)
    clearCoachTimer()
    clearPulseTimer()
  }, [])

  // Arm the initial coach ('full'/'idle') or idle-pulse ('none') timer
  // whenever a fresh paused_interactive begins and the student hasn't
  // shown understanding yet.
  useEffect(() => {
    clearCoachTimer()
    clearPulseTimer()
    if (state !== 'paused_interactive' || hasInteractedRef.current) return undefined

    if (coachLevel === 'none') {
      pulseTimerRef.current = setTimeout(() => {
        if (!hasInteractedRef.current) setPulseIdleActive(true)
      }, PULSE_IDLE_MS)
      return clearPulseTimer
    }

    const delay = COACH_DELAY_MS[coachLevel] ?? COACH_DELAY_MS.full
    coachTimerRef.current = setTimeout(() => {
      if (!hasInteractedRef.current) setCoachActive(true)
    }, delay)
    return clearCoachTimer
  }, [state, scenarioIndex, coachLevel])

  // Called by AffordanceCoach after its 3rd loop finishes — re-arm for
  // another appearance after 12s of continued inactivity.
  const handleCoachFinished = useCallback(() => {
    setCoachActive(false)
    if (hasInteractedRef.current) return
    clearCoachTimer()
    coachTimerRef.current = setTimeout(() => {
      if (!hasInteractedRef.current) setCoachActive(true)
    }, COACH_REAPPEAR_MS)
  }, [])

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
   * Called by a scene once it has resolved a scenario_choice_id — either
   * directly from a single target click, or from compound logic (e.g.
   * comparing three password fields) that only a bespoke scene can do.
   * @param {string} choiceId
   */
  const selectChoice = useCallback(
    (choiceId) => {
      if (state !== 'paused_interactive') return
      const choice = currentScenario.choices.find((c) => c.scenario_choice_id === choiceId)
      if (!choice) return

      setSelectedChoice(choice)
      setState('resolving')

      recordDecision({
        userId,
        moduleId: config.module_id,
        scenarioId: currentScenario.scenario_id,
        choiceId: choice.scenario_choice_id,
        isSafe: choice.is_safe_choice,
      }).then((decisionId) => {
        currentDecisionIdRef.current = decisionId
      })
    },
    [state, currentScenario, userId, config.module_id],
  )

  // ── resolving -> consequence (risky) | feedback (safe) ──
  useEffect(() => {
    if (state !== 'resolving' || !selectedChoice) return undefined
    const t = setTimeout(() => {
      if (!selectedChoice.is_safe_choice) {
        setAttemptCount((n) => n + 1)
        setState('consequence')
      } else {
        setState('feedback')
      }
    }, RESOLVING_MS)
    return () => clearTimeout(t)
  }, [state, selectedChoice])

  const dismissConsequence = useCallback(() => {
    setState('feedback')
  }, [])

  const retry = useCallback(() => {
    markFeedbackViewed(currentDecisionIdRef.current)
    currentDecisionIdRef.current = null
    setSelectedChoice(null)
    setState('paused_interactive')
  }, [])

  const continueToNext = useCallback(() => {
    markFeedbackViewed(currentDecisionIdRef.current)
    currentDecisionIdRef.current = null
    setCompletedScenarioIds((prev) =>
      prev.includes(currentScenario.scenario_id) ? prev : [...prev, currentScenario.scenario_id],
    )
    setState('advancing')
  }, [currentScenario])

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

  const coachTargetId = currentScenario.coachTarget || currentScenario.choices[0]?.target || null

  return {
    state,
    currentScenario,
    scenarioIndex,
    totalScenarios,
    isLastScenario,
    completedScenarioIds,
    attemptCount,
    guidedHintActive,
    selectedChoice,
    coachActive,
    coachTargetId,
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
      dismissConsequence,
      retry,
      continueToNext,
      handleCoachFinished,
    },
  }
}
