/**
 * passwordSecurity.config.js
 * Module 1's entire simulation. Mock data only — nothing here reaches
 * Firestore. `choice_text` exists for the record/admin dashboard only;
 * it is never rendered as a selectable option — the student acts on the
 * real interface element named by each choice's `target`.
 *
 * @typedef {Object} ScenarioChoiceConfig
 * @property {string} scenario_choice_id
 * @property {string} target
 * @property {string} choice_text
 * @property {boolean} is_safe_choice
 * @property {string} outcome_title
 * @property {'credential_compromise'|'account_takeover'|'data_exposure'|'device_compromise'|'financial_loss'|'physical_risk'|'none'} consequence_type
 * @property {string} feedback_text
 * @property {string|null} feedback_media_url
 *
 * @typedef {Object} ScenarioConfig
 * @property {string} scenario_id
 * @property {number} scenario_order
 * @property {string} scenario_title
 * @property {string} scenario_description
 * @property {boolean} videoAvailable
 * @property {string|null} material_url
 * @property {string} posterCaption
 * @property {string} scene
 * @property {string} [coachTarget]
 * @property {ScenarioChoiceConfig[]} choices
 *
 * @typedef {Object} ModuleScenarioConfig
 * @property {string} module_id
 * @property {string} module_title
 * @property {'full'|'idle'|'none'} coachLevel
 * @property {ScenarioConfig[]} scenarios
 */

/** @type {ModuleScenarioConfig} */
export const passwordSecurityConfig = {
  module_id: 'password-security',
  module_title: 'Password Security',
  coachLevel: 'full',
  scenarios: [
    {
      scenario_id: 'ps-01',
      scenario_order: 1,
      scenario_title: 'Setting Up Your Accounts',
      scenario_description:
        "You're signing up for three accounts you'll need this semester. Set a password for each one.",
      videoAvailable: false,
      material_url: null,
      posterCaption: 'Three new accounts, three passwords to choose.',
      scene: 'SignupTrioScene',
      coachTarget: 'signup-password-1',
      choices: [
        {
          scenario_choice_id: 'ps-01-a',
          target: 'save-all-same',
          choice_text: 'Save the exact same password on all three accounts',
          is_safe_choice: false,
          outcome_title: 'One Password, Three Points of Failure',
          consequence_type: 'credential_compromise',
          feedback_text:
            "All three accounts now share one password. If any single one of these services is ever breached, an attacker can try that same password against the other two — and it will work.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ps-01-b',
          target: 'save-similar-stem',
          choice_text: 'Save a slightly different password on each, built from the same base word',
          is_safe_choice: false,
          outcome_title: "Almost Different Isn't Different",
          consequence_type: 'credential_compromise',
          feedback_text:
            'Passwords like these share an obvious pattern. Once an attacker sees one of them, guessing the other two is trivial — predictable variation offers almost no real protection.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ps-01-c',
          target: 'save-all-different',
          choice_text: 'Save a completely different password on each account',
          is_safe_choice: true,
          outcome_title: 'Three Accounts, Three Passwords',
          consequence_type: 'none',
          feedback_text:
            'Each account now stands on its own. If one service is ever breached, the other two stay safe — this is the single habit that limits the most damage.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ps-01-d',
          target: 'save-all-different-weak',
          choice_text: 'Save a different, but simple, password on each account',
          is_safe_choice: true,
          outcome_title: 'Different Accounts, Same Weak Spot',
          consequence_type: 'none',
          feedback_text:
            "Good job, three different passwords for three different accounts. That's the habit that matters most: if one service ever gets breached, the other two stay safe either way. One thing to level up next time though, these particular passwords are still on the easy side to guess or crack. A bit more length plus a mix of cases, numbers, and symbols would make them much tougher.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'ps-02',
      scenario_order: 2,
      scenario_title: 'A Message From the Registrar',
      scenario_description: 'An email is waiting in your Campus Mail inbox about your application.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'Something in your inbox needs a decision.',
      scene: 'MailInboxScene',
      coachTarget: 'email-verify-btn',
      choices: [
        {
          scenario_choice_id: 'ps-02-a',
          target: 'email-verify-btn',
          choice_text: 'Click Verify Account in the email',
          is_safe_choice: false,
          outcome_title: 'Your Credentials Were Just Captured',
          consequence_type: 'account_takeover',
          feedback_text:
            "That button led to a lookalike login page, and it just captured your password. Because you used the same password everywhere in Scenario 1, the attacker now tries it against Campus Mail and PeraSend too — and gets into both. One click on a fake page took down all three accounts.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ps-02-b',
          target: 'reply-btn',
          choice_text: 'Reply to the email asking if it is legitimate',
          is_safe_choice: false,
          outcome_title: "You Just Confirmed You're a Real Target",
          consequence_type: 'account_takeover',
          feedback_text:
            'Replying tells the attacker your address is active and someone is reading it — that alone makes you a more attractive target for a follow-up attempt, and it does nothing to verify whether the email was real.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ps-02-c',
          target: 'address-bar',
          choice_text: "Go to the university portal yourself using the browser's address bar",
          is_safe_choice: true,
          outcome_title: 'Verified Through a Source You Trust',
          consequence_type: 'none',
          feedback_text:
            "Typing the address yourself — or using a saved, trusted link — sidesteps the fake page entirely. Your application status shows no pending action, because the email was never real.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'ps-03',
      scenario_order: 3,
      scenario_title: 'Securing What Happened',
      scenario_description: 'Your accounts need attention. Decide how far you go to secure them.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'Time to clean up and lock things down.',
      scene: 'AccountSecurityScene',
      coachTarget: 'account-change-1',
      choices: [
        {
          scenario_choice_id: 'ps-03-a',
          target: 'change-portal-only',
          choice_text: 'Change the password on the portal only, then confirm',
          is_safe_choice: false,
          outcome_title: 'Two Doors Still Unlocked',
          consequence_type: 'account_takeover',
          feedback_text:
            'The portal is safe now, but Campus Mail and PeraSend still use the old, compromised password. An attacker who captured it can still get into both — securing one account out of three is not enough when the same password was everywhere.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ps-03-b',
          target: 'remind-later',
          choice_text: 'Dismiss the security check and deal with it later',
          is_safe_choice: false,
          outcome_title: 'Your Wallet Is Still Open',
          consequence_type: 'financial_loss',
          feedback_text:
            'The attacker already has your password and is not waiting. PeraSend — the one account tied directly to your money — is still sitting open along with the other two. Every hour this is delayed is an hour they can move money out, not just read your mail.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ps-03-c',
          target: 'change-all-and-enable-2fa',
          choice_text: 'Change the password on all three accounts and enable two-step verification',
          is_safe_choice: true,
          outcome_title: 'Fully Secured',
          consequence_type: 'none',
          feedback_text:
            'All three accounts now have new, unique passwords, and two-step verification means a stolen password alone is no longer enough to get in. This is a full recovery, not a partial one.',
          feedback_media_url: null,
        },
      ],
    },
  ],
}

export default passwordSecurityConfig
