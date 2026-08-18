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
      scenarioDescription:
        'A ClassDeck notification about an activity submission is waiting in your Campus Mail inbox.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'Something in your inbox needs a decision.',
      scene: 'InboxScene',
      coachTarget: 'submit-link',
      postCompletionReflection:
        "One message to the person who supposedly sent it settled the whole thing. That habit costs about ten seconds.",
      choices: [
        {
          scenarioChoiceId: 'ph-01-a',
          target: 'submit-link',
          choiceText: 'Click Submit Activity in the email',
          isSafeChoice: false,
          outcomeTitle: 'That Button Leads Somewhere Else',
          consequenceType: 'none',
          feedbackText:
            "That button doesn't go to ClassDeck — it opens a lookalike login page built to capture what you type. Hovering over a link before clicking it would have shown you the real destination, and asking your instructor would have settled it before any of that mattered.",
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
          target: 'ask-instructor',
          choiceText: 'Message the instructor on Campus Chat to check whether they posted it',
          isSafeChoice: true,
          outcomeTitle: 'Checked With the Person Who Supposedly Sent It',
          consequenceType: 'none',
          feedbackText:
            "Prof. Reyes never posted an activity. Asking through a channel you already trust — a chat you use with them every week — is the one check an attacker cannot fake, because they do not control it. Notice you never had to judge the email itself: you went around it. Report or delete it now and it is done.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'ph-02',
      scenarioOrder: 2,
      scenarioTitle: 'A Familiar-Looking Login Page',
      scenarioDescription: 'A login page opened, using the same crest and layout as ClassDeck.',
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
            'The page at classdeck-submit.net just captured your email and password. Account takeover typically follows within minutes — the attacker can use these same credentials to sign into your real accounts before you even notice.',
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
            'classdeck-submit.net is not where ClassDeck lives, the real one is classdeck.edu.ph. Checking the address bar before typing anything, and leaving the moment it looks wrong, kept your credentials safe.',
          feedbackMediaUrl: null,
        },
      ],
    },
  ],
}

export default phishingAwarenessConfig
