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
  module_id: 'phishing-awareness',
  module_title: 'Phishing Awareness',
  coachLevel: 'idle',
  scenarios: [
    {
      scenario_id: 'ph-01',
      scenario_order: 1,
      scenario_title: 'A Message About Your Submission',
      scenario_description: 'An email about a missing assignment is waiting in your Campus Mail inbox.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'Something in your inbox needs a decision.',
      scene: 'InboxScene',
      coachTarget: 'submit-link',
      choices: [
        {
          scenario_choice_id: 'ph-01-a',
          target: 'submit-link',
          choice_text: 'Click Submit Assignment in the email',
          is_safe_choice: false,
          outcome_title: 'That Button Leads Somewhere Else',
          consequence_type: 'none',
          feedback_text:
            "That button doesn't go to the real student portal — it opens a lookalike login page built to steal your credentials. Hovering over a link before clicking it would have shown you the real destination.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ph-01-b',
          target: 'reply-btn',
          choice_text: 'Reply to the email asking for clarification',
          is_safe_choice: false,
          outcome_title: "You Just Confirmed You're a Real Target",
          consequence_type: 'none',
          feedback_text:
            'Replying tells whoever sent this that your address is active and someone is reading it — that makes you a more attractive target, and it does nothing to verify whether the email itself is real.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ph-01-c',
          target: 'sender-chip',
          choice_text: 'Inspect the sender, then report the email as phishing',
          is_safe_choice: true,
          outcome_title: 'Checked First, Then Reported',
          consequence_type: 'none',
          feedback_text:
            "Expanding the sender showed an address that doesn't match a real university domain. Reporting it — instead of clicking anything inside it — is exactly the right move, and it flags the same email for everyone else who received it.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'ph-02',
      scenario_order: 2,
      scenario_title: 'A Familiar-Looking Login Page',
      scenario_description: 'A login page opened, using the same logo and layout as the student portal.',
      videoAvailable: false,
      material_url: null,
      posterCaption: "Something about this page is worth a second look.",
      scene: 'FakePortalScene',
      choices: [
        {
          scenario_choice_id: 'ph-02-a',
          target: 'login-form',
          choice_text: 'Enter the password and click Sign In',
          is_safe_choice: false,
          outcome_title: 'Your credentials were captured.',
          consequence_type: 'account_takeover',
          feedback_text:
            'The page at tip-edu-verify.net just captured your email and password. Account takeover typically follows within minutes — the attacker can use these same credentials to sign into your real accounts before you even notice.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ph-02-b',
          target: 'forgot-password',
          choice_text: 'Click "Forgot password?" on this page',
          is_safe_choice: false,
          outcome_title: 'Still on Their Site',
          consequence_type: 'credential_compromise',
          feedback_text:
            "Forgot password? on a fake site doesn't recover anything real — you're still interacting with the attacker's page, and whatever you enter next can be captured just the same.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'ph-02-c',
          target: 'address-bar',
          choice_text: 'Check the address bar and leave the page',
          is_safe_choice: true,
          outcome_title: 'Caught the Mismatch',
          consequence_type: 'none',
          feedback_text:
            'tip-edu-verify.net is not the university\'s real domain. Checking the address bar before typing anything — and leaving the moment it looks wrong — kept your credentials safe.',
          feedback_media_url: null,
        },
      ],
    },
  ],
}

export default phishingAwarenessConfig
