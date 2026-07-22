import { passwordSecurityModuleData } from './passwordSecurity'

/**
 * Registry of mock module data, keyed by moduleId. Adding a future module
 * (Phishing Awareness, Malware Awareness, ...) means adding one more file
 * + one more entry here — never touching the loader or any page.
 */
export const MODULE_CONTENT_REGISTRY = {
  'password-security': passwordSecurityModuleData,
}
