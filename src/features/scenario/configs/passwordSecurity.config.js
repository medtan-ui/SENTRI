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
 * @property {{ title: string, narrative: string }} [contextPopup] setup shown when the interactive opens
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
      scenarioTitle: 'Setting Up Your Account',
      scenarioDescription:
        'Alex is signing up for the University Student Portal. His EBP E-Wallet password is visible on-screen. Choose a password for his portal account wisely.',
      videoAvailable: true,
      materialUrl: '/videos/module-1/passsec-scene1.mp4',
      posterCaption: 'Alex is creating his school portal account.',
      scene: 'SignupTrioScene',
      contextPopup: {
        title: 'Creating a School Portal Account',
        narrative:
          "Alex is registering for the University Student Portal. His EBP E-Wallet password happens to be visible on the screen. Should he reuse it? Or should he create something new and strong?",
      },
      coachTarget: 'signup-password-1',
      postCompletionReflection:
        "Great choice! Using a unique, strong password for each account keeps your other accounts safe even if one is ever compromised. A password manager can help you remember them all. 💡",
      choices: [
        {
          scenarioChoiceId: 'ps-01-a',
          target: 'save-all-same',
          choiceText: 'Enter the EBP E-Wallet password (password reuse)',
          isSafeChoice: false,
          outcomeTitle: 'Password Reuse — A Dangerous Shortcut',
          consequenceType: 'credential_compromise',
          feedbackText:
            "You used the same password as your EBP E-Wallet. If the school portal is ever breached or phished, attackers can immediately try that same password on your e-wallet — putting your real money at risk.",
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-1/passsec-fail.mp4',
          consequenceVideoUrl: '/videos/module-1/module-1-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'ps-01-b',
          target: 'save-similar-stem',
          choiceText: 'Enter a password with the same base as the wallet password',
          isSafeChoice: false,
          outcomeTitle: "Almost Different Isn't Different",
          consequenceType: 'credential_compromise',
          feedbackText:
            'Your password is too similar to your e-wallet password. Once an attacker sees one, guessing the variation is trivial — predictable changes offer almost no real protection.',
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-1/passsec-fail.mp4',
          consequenceVideoUrl: '/videos/module-1/module-1-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'ps-01-c',
          target: 'save-all-different',
          choiceText: 'Enter a completely unique, strong password',
          isSafeChoice: true,
          outcomeTitle: 'Smart — Unique Password for Each Account',
          consequenceType: 'none',
          feedbackText:
            "Your school portal now has its own strong, unique password. Even if the portal is ever compromised, your EBP E-Wallet stays protected. This is exactly the habit that limits damage from a breach.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'ps-01-d',
          target: 'save-all-different-weak',
          choiceText: 'Enter a unique but short or simple password',
          isSafeChoice: false,
          outcomeTitle: 'Unique but Too Weak',
          consequenceType: 'credential_compromise',
          feedbackText:
            "Good instinct — you didn't reuse your e-wallet password. But this password is too short or simple, making it easy to guess or crack. Use a longer passphrase with letters, numbers, and symbols to properly protect your account.",
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-1/passsec-fail.mp4',
          consequenceVideoUrl: '/videos/module-1/module-1-tutorial.mp4',
        },
      ],
    },
    {
      scenarioId: 'ps-02',
      scenarioOrder: 2,
      scenarioTitle: 'A Message From the Registrar',
      scenarioDescription: 'An urgent email is waiting in your Campus Mail inbox about your School Portal account.',
      videoAvailable: true,
      materialUrl: '/videos/module-1/passsec-scene2.mp4',
      posterCaption: 'A message from the school portal arrives in your inbox.',
      scene: 'MailInboxScene',
      contextPopup: {
        title: "An Unexpected Verification Email",
        narrative: "Alex notices an urgent email claiming his school portal requires immediate verification within 24 hours. He opens his inbox without checking if it is legit. How will you decide whether to trust the request?",
      },
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
            "That button led to a lookalike login page, and it just captured your password. Because you used the same password on your EBP e-wallet, the attacker immediately accesses your wallet too. One click on a fake page took down all your accounts.",
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-1/passsec-fail.mp4',
          consequenceVideoUrl: '/videos/module-1/module-1-tutorial.mp4',
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
          failVideoUrl: '/videos/module-1/passsec-fail.mp4',
          consequenceVideoUrl: '/videos/module-1/module-1-tutorial.mp4',
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
  ],
}

export default passwordSecurityConfig
