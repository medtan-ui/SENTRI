/**
 * scenario.types.js
 *
 * This project is plain JavaScript (no TypeScript toolchain configured —
 * no tsconfig, no .ts files anywhere in src/). These are documented as
 * JSDoc typedefs instead of a .ts module so editors still get intellisense
 * and shape-checking without introducing a second type system alongside
 * the rest of the codebase.
 *
 * Every shape here is pure configuration data. The engine (useScenarioEngine
 * + the components in ../components) never imports a concrete module's
 * content — it only ever sees these generic shapes.
 */

/**
 * A video asset used by a scenario or a choice's consequence clip.
 * Real video files are not ready yet, so `videoAvailable` lets the engine
 * fall back to a placeholder frame (with a simulated timeline for dev
 * testing) instead of trying to load a broken URL.
 *
 * @typedef {Object} ScenarioVideo
 * @property {string} videoUrl       Placeholder or real video source.
 * @property {boolean} videoAvailable  False = render placeholder frame instead of <video>.
 * @property {string} [thumbnail]    Poster image / placeholder background.
 * @property {number} duration       Total seconds, used for progress + simulated playback.
 */

/**
 * One selectable action inside a scenario's decision point.
 *
 * @typedef {Object} ScenarioChoice
 * @property {string} id
 * @property {string} text                 Label shown on the choice button.
 * @property {boolean} isSafe              Safe -> feedback then story continues. Risky -> consequence + retry.
 * @property {string} feedbackTitle        Heading shown in FeedbackPanel.
 * @property {string} feedbackText         Body copy shown in FeedbackPanel / as the explanation after a consequence.
 * @property {ScenarioVideo} [consequenceVideo]  Only meaningful when isSafe is false. Omit to fall back to an image placeholder.
 */

/**
 * One paused-video decision point. A module is a sequence of these.
 *
 * @typedef {Object} Scenario
 * @property {string} id
 * @property {string} title            Shown on the pre-scenario intro screen and in progress indicators.
 * @property {string} [simulatedUrl]   Address-bar text when surface is 'browser'. Purely cosmetic.
 * @property {ScenarioVideo} video
 * @property {number} pauseTimestamp   Seconds into `video` where playback auto-pauses for a decision.
 * @property {ScenarioChoice[]} choices  2-3 choices.
 */

/**
 * The single object the engine is driven by. One config === one module's
 * entire simulation. Swapping this out is the only thing required to
 * reuse the engine for a different module — no component changes.
 *
 * @typedef {Object} ModuleScenarioConfig
 * @property {string} id
 * @property {string} title
 * @property {'browser'|'phone'} surface  Which device chrome wraps the player.
 * @property {Scenario[]} scenarios
 */

/**
 * The engine's state machine, in the exact order specified by the flow:
 * INTRO -> PLAYING -> PAUSED -> DECISION -> FEEDBACK -> (safe: back to
 * PLAYING to finish the clip, then NEXT/COMPLETE) | (risky: CONSEQUENCE ->
 * TRY_AGAIN -> back to PAUSED, never PLAYING, never INTRO).
 *
 * @typedef {'LOADING'|'INTRO'|'PLAYING'|'PAUSED'|'DECISION'|'FEEDBACK'|'CONSEQUENCE'|'COMPLETE'} ScenarioState
 */

/** Canonical runtime enum for ScenarioState — import this, never a raw string. */
export const SCENARIO_STATES = Object.freeze({
  LOADING: 'LOADING',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  DECISION: 'DECISION',
  FEEDBACK: 'FEEDBACK',
  CONSEQUENCE: 'CONSEQUENCE',
  COMPLETE: 'COMPLETE',
})

/**
 * Result object handed back once the final scenario completes.
 * @typedef {Object} ScenarioEngineResult
 * @property {boolean} simulationPassed
 * @property {number} safeChoices
 * @property {number} riskyAttempts
 */

// Nothing else is exported — this file is documentation + the one shared
// runtime constant, not a component.
export {}
