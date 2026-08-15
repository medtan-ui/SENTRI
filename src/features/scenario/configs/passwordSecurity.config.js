/**
 * passwordSecurity.config.js
 * Module 1's entire simulation. Mock data only — nothing here reaches
 * Firestore. `choiceText` exists for the record/admin dashboard only;
 * it is never rendered as a selectable option — the student acts on the
 * real interface element named by each choice's `target`.
 *
 * @typedef {Object} ScenarioChoiceConfig
 * @property {string} scenarioChoiceId
 * @property {string} target
 * @property {string} choiceText
 * @property {boolean} isSafeChoice
 * @property {string} outcomeTitle
 * @property {'credential_compromise'|'account_takeover'|'data_exposure'|'device_compromise'|'financial_loss'|'physical_risk'|'none'} consequenceType
 * @property {string} feedbackText
 * @property {string|null} feedbackMediaUrl
 * @property {string|null} [consequenceVideoUrl] risky choices only — the
 *   clip shown inside the consequence overlay, in the same format as a
 *   scenario's own `materialUrl` (a YouTube link/id or a direct video
 *   file URL). Null while no clip has been recorded yet, which is what
 *   makes ConsequenceOverlay show its placeholder card.
 *
 * @typedef {Object} ScenarioConfig
 * @property {string} scenarioId
 * @property {number} scenarioOrder
 * @property {string} scenarioTitle
 * @property {string} scenarioDescription
 * @property {boolean} videoAvailable
 * @property {string|null} materialUrl
 * @property {string} posterCaption
 * @property {string} scene
 * @property {string} [coachTarget]
 * @property {string} [postCompletionReflection] optional closing note shown
 *   in FeedbackPanel only once this scenario is *safely* resolved (not on
 *   an unsafe attempt, which shows "Try Again" instead of completing) —
 *   for a broader reflection that doesn't fit any one choice's own
 *   feedbackText
 * @property {ScenarioChoiceConfig[]} choices
 *
 * @typedef {Object} ModuleScenarioConfig
 * @property {string} moduleId
 * @property {string} moduleTitle
 * @property {'full'|'idle'|'none'} coachLevel
 * @property {ScenarioConfig[]} scenarios
 */

/** @type {ModuleScenarioConfig} */
export const passwordSecurityConfig = {
  moduleId: 'password-security',
  moduleTitle: 'Password Security',
  coachLevel: 'full',
  scenarios: [
    {
      scenarioId: 'ps-01',
      scenarioOrder: 1,
      scenarioTitle: 'Setting Up Your Accounts',
      scenarioDescription:
        "You're signing up for three accounts you'll need this semester. Set a password for each one.",
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'Three new accounts, three passwords to choose.',
      scene: 'SignupTrioScene',
      coachTarget: 'signup-password-1',
      postCompletionReflection:
        "Real talk: if you just mashed the keyboard for those passwords, there's a good chance you won't remember them next week. 😅",
      choices: [
        {
          scenarioChoiceId: 'ps-01-a',
          target: 'save-all-same',
          choiceText: 'Save the exact same password on all three accounts',
          isSafeChoice: false,
          outcomeTitle: 'One Password, Three Points of Failure',
          consequenceType: 'credential_compromise',
          feedbackText:
            "All three accounts now share one password. If any single one of these services is ever breached, an attacker can try that same password against the other two — and it will work.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ps-01-b',
          target: 'save-similar-stem',
          choiceText: 'Save a slightly different password on each, built from the same base word',
          isSafeChoice: false,
          outcomeTitle: "Almost Different Isn't Different",
          consequenceType: 'credential_compromise',
          feedbackText:
            'Passwords like these share an obvious pattern. Once an attacker sees one of them, guessing the other two is trivial — predictable variation offers almost no real protection.',
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ps-01-c',
          target: 'save-all-different',
          choiceText: 'Save a completely different password on each account',
          isSafeChoice: true,
          outcomeTitle: 'Three Accounts, Three Passwords',
          consequenceType: 'none',
          feedbackText:
            'Each account now stands on its own. If one service is ever breached, the other two stay safe — this is the single habit that limits the most damage.',
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'ps-01-d',
          target: 'save-all-different-weak',
          choiceText: 'Save a different, but simple, password on each account',
          isSafeChoice: true,
          outcomeTitle: 'Different Accounts, Same Weak Spot',
          consequenceType: 'none',
          feedbackText:
            "Good job, three different passwords for three different accounts. That's the habit that matters most: if one service ever gets breached, the other two stay safe either way. One thing to level up next time though, these particular passwords are still on the easy side to guess or crack. A bit more length plus a mix of cases, numbers, and symbols would make them much tougher.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'ps-02',
      scenarioOrder: 2,
      scenarioTitle: 'A Message From the Registrar',
      scenarioDescription: 'An email is waiting in your Campus Mail inbox about your application.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'Something in your inbox needs a decision.',
      scene: 'MailInboxScene',
      coachTarget: 'email-verify-btn',
      choices: [
        {
          scenarioChoiceId: 'ps-02-a',
          target: 'email-verify-btn',
          choiceText: 'Click Verify Account in the email',
          isSafeChoice: false,
          outcomeTitle: 'Your Credentials Were Just Captured',
          consequenceType: 'account_takeover',
          feedbackText:
            "That button led to a lookalike login page, and it just captured your password. Because you used the same password everywhere in Scenario 1, the attacker now tries it against Campus Mail and PeraSend too — and gets into both. One click on a fake page took down all three accounts.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ps-02-b',
          target: 'reply-btn',
          choiceText: 'Reply to the email asking if it is legitimate',
          isSafeChoice: false,
          outcomeTitle: "You Just Confirmed You're a Real Target",
          consequenceType: 'account_takeover',
          feedbackText:
            'Replying tells the attacker your address is active and someone is reading it — that alone makes you a more attractive target for a follow-up attempt, and it does nothing to verify whether the email was real.',
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ps-02-c',
          target: 'address-bar',
          choiceText: "Go to the university portal yourself using the browser's address bar",
          isSafeChoice: true,
          outcomeTitle: 'Verified Through a Source You Trust',
          consequenceType: 'none',
          feedbackText:
            "Typing the address yourself — or using a saved, trusted link — sidesteps the fake page entirely. Your application status shows no pending action, because the email was never real.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'ps-03',
      scenarioOrder: 3,
      scenarioTitle: 'Securing What Happened',
      scenarioDescription: 'Your accounts need attention. Decide how far you go to secure them.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'Time to clean up and lock things down.',
      scene: 'AccountSecurityScene',
      coachTarget: 'account-change-1',
      choices: [
        {
          scenarioChoiceId: 'ps-03-a',
          target: 'change-portal-only',
          choiceText: 'Change the password on the portal only, then confirm',
          isSafeChoice: false,
          outcomeTitle: 'Two Doors Still Unlocked',
          consequenceType: 'account_takeover',
          feedbackText:
            'The portal is safe now, but Campus Mail and PeraSend still use the old, compromised password. An attacker who captured it can still get into both — securing one account out of three is not enough when the same password was everywhere.',
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ps-03-b',
          target: 'remind-later',
          choiceText: 'Dismiss the security check and deal with it later',
          isSafeChoice: false,
          outcomeTitle: 'Your Wallet Is Still Open',
          consequenceType: 'financial_loss',
          feedbackText:
            'The attacker already has your password and is not waiting. PeraSend — the one account tied directly to your money — is still sitting open along with the other two. Every hour this is delayed is an hour they can move money out, not just read your mail.',
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ps-03-c',
          target: 'change-all-and-enable-2fa',
          choiceText: 'Change the password on all three accounts and enable two-step verification',
          isSafeChoice: true,
          outcomeTitle: 'Fully Secured',
          consequenceType: 'none',
          feedbackText:
            'All three accounts now have new, unique passwords, and two-step verification means a stolen password alone is no longer enough to get in. This is a full recovery, not a partial one.',
          feedbackMediaUrl: null,
        },
      ],
    },
  ],
}

export default passwordSecurityConfig
