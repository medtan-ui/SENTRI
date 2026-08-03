import { passwordSecurityConfig } from './passwordSecurity.config'
import { phishingAwarenessConfig } from './phishingAwareness.config'
import { malwareAwarenessConfig } from './malwareAwareness.config'
import { safeBrowsingConfig } from './safeBrowsing.config'
import { dataPrivacyConfig } from './dataPrivacy.config'
import { onlineSafetyConfig } from './onlineSafety.config'

/**
 * SCENARIO_CONFIG_REGISTRY
 * Every module's authored Scenario Engine configuration, keyed by
 * moduleId. This is the single source of truth for scenario *structure*
 * — which bespoke scene renders each scenario, which interactive target
 * maps to which choice, and which choice is the safe one. Those fields
 * are code-owned and never editable from the admin UI, because they are
 * wired to hand-authored React scene components (src/features/scenario/
 * scenes/) that no form can regenerate.
 *
 * The *copy and media* around that structure (titles, descriptions,
 * feedback, consequence types, poster captions, video URLs) is editable
 * by admins and stored in Firestore's `moduleScenarios` collection — see
 * src/services/scenarioService.js, which layers those edits over this
 * registry before handing the result to the engine.
 */
export const SCENARIO_CONFIG_REGISTRY = {
  'password-security': passwordSecurityConfig,
  'phishing-awareness': phishingAwarenessConfig,
  'malware-awareness': malwareAwarenessConfig,
  'safe-browsing': safeBrowsingConfig,
  'data-privacy': dataPrivacyConfig,
  'online-safety': onlineSafetyConfig,
}

/** @returns {string[]} every module id that has an authored scenario. */
export const SCENARIO_MODULE_IDS = Object.keys(SCENARIO_CONFIG_REGISTRY)
