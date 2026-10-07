import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recordDecision, markFeedbackViewed } from '../services/scenarioDecisionService'

const LOADING_MS = 300
const PLAYING_MS = 1300
const RESOLVING_MS = 250
const ADVANCING_MS = 600

const PULSE_IDLE_MS = 15000

// States that are safe to restore directly after a page refresh.
// Mid-transition states (loading, resolving, advancing) are normalised
// to paused_interactive so the student never wakes up in a half-baked
// machine transition.
const RESTORABLE_STATES = new Set(['paused_interactive', 'feedback', 'playing', 'complete'])

function makeStorageKey(moduleId, userId) {
  return `sentri:scenario:${moduleId}:${userId ?? 'anon'}`
}

function readSnapshot(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSnapshot(key, snapshot) {
  try {
    sessionStorage.setItem(key, JSON.stringify(snapshot))
  } catch {
    // storage quota exceeded or private mode — silently ignore
  }
}

/**
 * useScenarioEngine
 * The Video-Pause-Interact-Branch state machine:
 *   loading -> playing -> paused_interactive -> resolving -> feedback
 *     -> paused_interactive (retry, same pause point) | advancing -> (next scenario | complete)
 *
 * `playing` behaves differently depending on whether this scenario has a
 * real opening clip. With none configured (every module today), it is a
 * short fixed beat over the poster and the scene arrives on its own —
 * which is what keeps the simulation testable before any video exists.
 * With a clip pasted into Material URL, nothing is timed: the player
 * holds until the student presses Start Scenario, so a 40-second clip is
 * never cut off after a second and a bit.
 *
 * Also owns the idle-pulse scheduling (a quiet breathing highlight on the
 * target itself, via InteractiveTarget's .idlePulse) and the target
 * registry scenes/InteractiveTarget share — everything a bespoke scene
 * needs comes back out of this hook; scenes never touch Firestore or
 * timers themselves.
 *
 * ── Replays ──────────────────────────────────────────────────────────
 * A student who already finished this simulation can walk back through
 * it any time, and that run is practice: no decision is recorded, so the
 * safe/risky figures an instructor reads stay the measurement of the
 * first, real attempt. The run still scores itself on screen, and a
 * clean replay still counts for the badge that asks for one (reported
 * through onRunComplete, not through the decision records).
 *
 * ── Page-refresh persistence ─────────────────────────────────────────
 * Progress is written to sessionStorage on every meaningful state change
 * and restored on mount so a browser refresh doesn't send the student
 * back to scene 1. The key is scoped to moduleId + userId, so separate
 * users and modules never share a slot. sessionStorage (not localStorage)
 * is intentional: a brand-new browser session starts fresh, but a tab
 * reload within the same session picks up exactly where the student left.
 *
 * @param {import('../configs/passwordSecurity.config').ModuleScenarioConfig} config
 * @param {string|null} userId
 * @param {{ isReplay?: boolean }} [options]
 */
export function useScenarioEngine(config, userId, { isReplay = false } = {}) {
  const storageKey = makeStorageKey(config.moduleId, userId)

  // ── Restore from sessionStorage on first render ──────────────────────
  const snapshot = useMemo(() => readSnapshot(storageKey), [storageKey])

  const [state, setState] = useState(() => {
    if (!snapshot) return 'loading'
    // Never restore a mid-transition state — map to the nearest safe one.
    return RESTORABLE_STATES.has(snapshot.state) ? snapshot.state : 'paused_interactive'
  })
  const [scenarioIndex, setScenarioIndex] = useState(() => snapshot?.scenarioIndex ?? 0)
  const [attemptCount, setAttemptCount] = useState(() => snapshot?.attemptCount ?? 0)
  const [selectedChoice, setSelectedChoice] = useState(null) // transient — not persisted
  const [completedScenarioIds, setCompletedScenarioIds] = useState(
    () => snapshot?.completedScenarioIds ?? [],
  )

  // Track scenarios resolved cleanly (first try, no risky choices)
  // using an array of scenario IDs to avoid double-counting on reviews.
  const [cleanScenarioIds, setCleanScenarioIds] = useState(
    () => snapshot?.cleanScenarioIds ?? [],
  )
  const [failedScenarioIds, setFailedScenarioIds] = useState(
    () => snapshot?.failedScenarioIds ?? [],
  )
  const cleanCalls = cleanScenarioIds.length

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
  // A clip only counts as real when there is actually a URL behind the
  // flag — an admin clearing Material URL turns videoAvailable off with
  // it (see the admin VideoSection), but a config authored by hand could
  // still carry one without the other.
  const hasIntroClip = Boolean(currentScenario.videoAvailable && currentScenario.materialUrl)
  const isLastScenario = scenarioIndex === totalScenarios - 1
  const coachLevel = config.coachLevel || 'full'
  const guidedHintActive = !selectedChoice && attemptCount >= 3

  // ── Persist progress to sessionStorage whenever meaningful state changes ─
  useEffect(() => {
    // Don't persist mid-transition states — wait for the machine to settle.
    if (!RESTORABLE_STATES.has(state)) return
    writeSnapshot(storageKey, {
      state,
      scenarioIndex,
      attemptCount,
      completedScenarioIds,
      cleanScenarioIds,
      failedScenarioIds,
    })
  }, [state, scenarioIndex, attemptCount, completedScenarioIds, cleanScenarioIds, failedScenarioIds, storageKey])

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

  // ── playing -> paused_interactive ──
  // Only auto-advances when there is no clip to watch. With one
  // configured, the student's own Start Scenario press is what moves this
  // on (startScenario below) — there is no way to know from a YouTube
  // embed whether they actually watched it, so the honest thing is to
  // stop taking the decision away from them.
  useEffect(() => {
    if (state !== 'playing' || hasIntroClip) return undefined
    const t = setTimeout(() => setState('paused_interactive'), PLAYING_MS)
    return () => clearTimeout(t)
  }, [state, hasIntroClip])

  /**
   * startScenario
   * Leaves the opening clip for the interactive scene. Only reachable
   * from the held `playing` state, i.e. only when a clip is configured;
   * with no clip the beat above has already moved on by itself.
   */
  const startScenario = useCallback(() => {
    setState((prev) => (prev === 'playing' ? 'paused_interactive' : prev))
  }, [])

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

      // Practice runs leave no trace in the record on purpose.
      if (isReplay) return

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
    [state, currentScenario, userId, config.moduleId, attemptCount, isReplay],
  )

  // ── resolving -> consequence (if failVideoUrl exists) or feedback ──
  useEffect(() => {
    if (state !== 'resolving' || !selectedChoice) return undefined
    const t = setTimeout(() => {
      if (!selectedChoice.isSafeChoice) {
        setAttemptCount((n) => n + 1)
        setFailedScenarioIds((prev) =>
          prev.includes(currentScenario.scenarioId) ? prev : [...prev, currentScenario.scenarioId],
        )
        if (selectedChoice.failVideoUrl) {
          setState('consequence')
          return
        }
      }
      setState('feedback')
    }, RESOLVING_MS)
    return () => clearTimeout(t)
  }, [state, selectedChoice, currentScenario.scenarioId])

  const acknowledgeConsequence = useCallback(() => {
    setState('feedback')
  }, [])

  const retry = useCallback(() => {
    if (!isReplay) markFeedbackViewed(currentDecisionIdRef.current)
    currentDecisionIdRef.current = null
    setSelectedChoice(null)
    setState('paused_interactive')
  }, [isReplay])

  const continueToNext = useCallback(() => {
    if (!isReplay) markFeedbackViewed(currentDecisionIdRef.current)
    currentDecisionIdRef.current = null
    const scenarioId = currentScenario.scenarioId
    // Only reachable from a safe resolution (the feedback panel offers
    // Continue for safe choices and Try Again for risky ones), so
    // attemptCount === 0 here means the student got it right first go.
    if (attemptCount === 0 && !failedScenarioIds.includes(scenarioId)) {
      setCleanScenarioIds((prev) => (prev.includes(scenarioId) ? prev : [...prev, scenarioId]))
    }
    setCompletedScenarioIds((prev) =>
      prev.includes(scenarioId) ? prev : [...prev, scenarioId],
    )
    setState('advancing')
  }, [currentScenario, attemptCount, isReplay, failedScenarioIds])

  // ── Incremental navigation actions (reviewing previous/next scenes) ──
  // All nav actions go straight to paused_interactive — the video is
  // skipped so the student lands on the interactive scene immediately.
  // The "Replay Video" button is the explicit way to re-watch an intro.
  const goToPrevious = useCallback(() => {
    if (state === 'complete') {
      setScenarioIndex(totalScenarios - 1)
      setSelectedChoice(null)
      setAttemptCount(0)
      setState('paused_interactive')
      return
    }
    if (scenarioIndex > 0) {
      setScenarioIndex((i) => i - 1)
      setSelectedChoice(null)
      setAttemptCount(0)
      setState('paused_interactive')
    }
  }, [state, scenarioIndex, totalScenarios])

  const goToNext = useCallback(() => {
    if (scenarioIndex < totalScenarios - 1) {
      setScenarioIndex((i) => i + 1)
      setSelectedChoice(null)
      setAttemptCount(0)
      setState('paused_interactive')
    } else if (completedScenarioIds.length >= totalScenarios) {
      setState('complete')
    }
  }, [scenarioIndex, totalScenarios, completedScenarioIds.length])

  const goToScene = useCallback(
    (targetIndex) => {
      if (targetIndex >= 0 && targetIndex < totalScenarios) {
        setScenarioIndex(targetIndex)
        setSelectedChoice(null)
        setAttemptCount(0)
        setState('paused_interactive')
      }
    },
    [totalScenarios],
  )

  const replayVideo = useCallback(() => {
    if (hasIntroClip) {
      setSelectedChoice(null)
      setState('playing')
    }
  }, [hasIntroClip])

  const canGoBack = scenarioIndex > 0 || state === 'complete'
  const canGoNext =
    state !== 'complete' &&
    (scenarioIndex < completedScenarioIds.length ||
      (scenarioIndex === totalScenarios - 1 && completedScenarioIds.length >= totalScenarios))

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
    isReplay,
    currentScenario,
    hasIntroClip,
    // True while the opening clip is on screen waiting to be started.
    awaitingStart: state === 'playing' && hasIntroClip,
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
    canGoBack,
    canGoNext,
    interaction: {
      registerTarget,
      unregisterTarget,
      notifyInteraction,
      getTargetNode,
      pulseIdleActive,
    },
    actions: {
      startScenario,
      selectChoice,
      acknowledgeConsequence,
      retry,
      continueToNext,
      goToPrevious,
      goToNext,
      goToScene,
      replayVideo,
    },
  }
}

