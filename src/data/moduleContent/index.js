import { passwordSecurityModuleData } from './passwordSecurity'
import { phishingAwarenessModuleData } from './phishingAwareness'
import { malwareAwarenessModuleData } from './malwareAwareness'
import { safeBrowsingModuleData } from './safeBrowsing'
import { dataPrivacyModuleData } from './dataPrivacy'
import { onlineSafetyModuleData } from './onlineSafety'

/**
 * Registry of mock module data, keyed by moduleId. SENTRI's curriculum is
 * fixed at six modules (see pages/Admin/Modules/mockModules.js) — this
 * registry is now complete.
 */
export const MODULE_CONTENT_REGISTRY = {
  'password-security': passwordSecurityModuleData,
  'phishing-awareness': phishingAwarenessModuleData,
  'malware-awareness': malwareAwarenessModuleData,
  'safe-browsing': safeBrowsingModuleData,
  'data-privacy': dataPrivacyModuleData,
  'online-safety': onlineSafetyModuleData,
}
