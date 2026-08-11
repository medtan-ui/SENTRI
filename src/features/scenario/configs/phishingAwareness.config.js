/**
 * phishingAwareness.config.js
 * Module 2's simulation — Alex Gonzales, desktop browser + webmail.
 * Mock data only. Same shape as passwordSecurity.config.js; see that
 * file for the full field-by-field JSDoc.
 *
 * coachLevel is 'idle' (8s delay, not 2.5s) — by this module a student
 * has already been taught the interfaces respond in Module 1, and
 * useScenarioEngine's hasInteractedBefore flag means the coach retires
 * the moment they act in Scenario 1 anyway, so in practice it never
 * reappears in Scenario 2 — no engine change was needed for this.
 *
 * @type {import('./passwordSecurity.config').ModuleScenarioConfig}
 */
export const phishingAwarenessConfig = {
  moduleId: 'phishing-awareness',
  moduleTitle: 'Phishing Awareness',
  coachLevel: 'idle',
  scenarios: [
    {
      scenarioId: 'ph-01',
      scenarioOrder: 1,
      scenarioTitle: 'A Message About Your Submission',
      scenarioDescription: 'An email about a missing assignment is waiting in your Campus Mail inbox.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'Something in your inbox needs a decision.',
      scene: 'InboxScene',
      coachTarget: 'submit-link',
      choices: [
        {
          scenarioChoiceId: 'ph-01-a',
          target: 'submit-link',
          choiceText: 'Click Submit Assignment in the email',
          isSafeChoice: false,
          outcomeTitle: 'That Button Leads Somewhere Else',
          consequenceType: 'none',
          feedbackText:
            "That button doesn't go to the real student portal — it opens a lookalike login page built to steal your credentials. Hovering over a link before clicking it would have shown you the real destination.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ph-01-b',
          target: 'reply-btn',
          choiceText: 'Reply to the email asking for clarification',
          isSafeChoice: false,
          outcomeTitle: "You Just Confirmed You're a Real Target",
          consequenceType: 'none',
          feedbackText:
            'Replying tells whoever sent this that your address is active and someone is reading it — that makes you a more attractive target, and it does nothing to verify whether the email itself is real.',
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ph-01-c',
          target: 'sender-chip',
          choiceText: 'Inspect the sender, then report the email as phishing',
          isSafeChoice: true,
          outcomeTitle: 'Checked First, Then Reported',
          consequenceType: 'none',
          feedbackText:
            "Expanding the sender showed an address that doesn't match a real university domain. Reporting it — instead of clicking anything inside it — is exactly the right move, and it flags the same email for everyone else who received it.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'ph-02',
      scenarioOrder: 2,
      scenarioTitle: 'A Familiar-Looking Login Page',
      scenarioDescription: 'A login page opened, using the same logo and layout as the student portal.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: "Something about this page is worth a second look.",
      scene: 'FakePortalScene',
      choices: [
        {
          scenarioChoiceId: 'ph-02-a',
          target: 'login-form',
          choiceText: 'Enter the password and click Sign In',
          isSafeChoice: false,
          outcomeTitle: 'Your credentials were captured.',
          consequenceType: 'account_takeover',
          feedbackText:
            'The page at tip-edu-verify.net just captured your email and password. Account takeover typically follows within minutes — the attacker can use these same credentials to sign into your real accounts before you even notice.',
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ph-02-b',
          target: 'forgot-password',
          choiceText: 'Click "Forgot password?" on this page',
          isSafeChoice: false,
          outcomeTitle: 'Still on Their Site',
          consequenceType: 'credential_compromise',
          feedbackText:
            "Forgot password? on a fake site doesn't recover anything real — you're still interacting with the attacker's page, and whatever you enter next can be captured just the same.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'ph-02-c',
          target: 'address-bar',
          choiceText: 'Check the address bar and leave the page',
          isSafeChoice: true,
          outcomeTitle: 'Caught the Mismatch',
          consequenceType: 'none',
          feedbackText:
            'tip-edu-verify.net is not the university\'s real domain. Checking the address bar before typing anything — and leaving the moment it looks wrong — kept your credentials safe.',
          feedbackMediaUrl: null,
        },
      ],
    },
  ],
}

export default phishingAwarenessConfig
