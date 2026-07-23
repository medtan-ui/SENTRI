import { createContext, useContext } from 'react'

/**
 * ScenarioInteractionContext
 * Lets every <InteractiveTarget> inside a scene, without prop drilling:
 *   - register its DOM node under a target id, so <AffordanceCoach> can
 *     find whichever target it should currently point at
 *   - report the student's first real interaction, so the engine can
 *     permanently retire the coach and set hasInteractedBefore
 *   - know which target id (if any) the coach or idle-pulse is currently
 *     highlighting, so it can render its own active/highlighted state
 *
 * No Firestore, no engine state here — purely a DOM/interaction seam
 * between the engine and whatever bespoke scene is mounted.
 */
const ScenarioInteractionContext = createContext(null)

export const ScenarioInteractionProvider = ScenarioInteractionContext.Provider

export function useScenarioInteraction() {
  const ctx = useContext(ScenarioInteractionContext)
  if (!ctx) {
    throw new Error('useScenarioInteraction must be used within a ScenarioEngine')
  }
  return ctx
}
