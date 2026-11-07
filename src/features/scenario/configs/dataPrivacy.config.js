/**
 * dataPrivacy.config.js
 * Module 5's simulation — phone surface (frames/PhoneFrame). Mock data
 * only. Same shape as passwordSecurity.config.js; see that file for the
 * full field-by-field JSDoc.
 *
 * coachLevel: 'none' — a single subtle pulse on every target after 15s
 * idle, no animated coach. No scenario sets `coachTarget` for the same
 * reason 'none' doesn't use it.
 *
 * Scenario 2 (GiveawayFormScene) is input-driven, like Module 1's
 * SignupTrioScene: the scene inspects which fields were filled at submit
 * time and resolves to one of three separate risky choice_ids — one per
 * dangerous field (birthday/address/phone) — rather than a single generic
 * id. That's not a stylistic choice: FeedbackPanel and ConsequenceOverlay
 * are full-bleed overlays owned by the engine, so a scene has no way to
 * make its own rendered text visible during consequence/feedback phases.
 * Naming "the single most damaging field" therefore has to happen through
 * which config choice gets resolved, not through scene-rendered UI.
 *
 * Scenario 3 (SpamFloodScene) includes one free, local-only action —
 * "Block & report spam" from a message's more-options menu — that marks
 * local state but never calls onResolve. It narratively precedes the safe
 * resolution but isn't itself required to reach it; kept out of the
 * `choices` array on purpose, same reasoning as Module 4's `view-cert`.
 *
 * @type {import('./passwordSecurity.config').ModuleScenarioConfig}
 */
export const dataPrivacyConfig = {
  moduleId: 'data-privacy',
  moduleTitle: 'Data Privacy',
  coachLevel: 'none',
  scenarios: [
    {
      scenarioId: 'dp-01',
      scenarioOrder: 1,
      scenarioTitle: 'A Giveaway in the Feed',
      scenarioDescription: 'A raffle giveaway post is sitting in Marie\'s phone feed.',
      videoAvailable: true,
      materialUrl: '/videos/module-5/module-5-intro.mp4',
      posterCaption: 'Marie spots a giveaway notification on her phone.',
      scene: 'GiveawayPostScene',
      contextPopup: {
        title: "A Giveaway Catches Her Attention",
        narrative: "Marie checks her phone and spots a raffle giveaway post with a good prize. The JOIN NOW link makes entering look quick and easy. You are now viewing the post on her phone. What will you do before deciding whether to join?",
      },
      choices: [
        {
          scenarioChoiceId: 'dp-01-a',
          target: 'join-link',
          choiceText: 'Tap JOIN NOW on the giveaway post',
          isSafeChoice: false,
          outcomeTitle: 'Not a Sponsor — Just a New Account',
          consequenceType: 'none',
          feedbackText:
            "Reminder-78 has no verification badge, was created days ago, and has almost no post history — the hallmarks of a throwaway account built to run a scheme like this one, not a real sponsor with a prize to give away.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: '/videos/module-5/module-5-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'dp-01-c',
          target: 'account-name',
          choiceText: "Open Reminder-78's profile before doing anything else",
          isSafeChoice: true,
          outcomeTitle: 'Checked Before Trusting It',
          consequenceType: 'none',
          feedbackText:
            "The profile shows exactly what a scam account looks like: created only 6 days ago, just 2 posts, no verification badge, and comments disabled so nobody can publicly call it out. None of that belongs to a real giveaway sponsor.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'dp-01-d',
          target: 'dismiss-post',
          choiceText: 'Mark the post "Not interested" and move on',
          isSafeChoice: true,
          outcomeTitle: 'Ignored — And Nothing Happened',
          consequenceType: 'none',
          feedbackText:
            "Scrolling past cost you nothing, and that's a perfectly reasonable way to handle a post like this. But you didn't see why it was suspicious — checking the account first (created 6 days ago, no verification, comments disabled) would have shown you the actual warning signs to recognize next time.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'dp-02',
      scenarioOrder: 2,
      scenarioTitle: 'Claim Your Prize',
      scenarioDescription: 'A form is asking for her information to enter the raffle.',
      videoAvailable: true,
      materialUrl: '/videos/module-5/module-5-scene-2-intro.mp4',
      posterCaption: 'A raffle form wants personal information before it continues.',
      scene: 'GiveawayFormScene',
      contextPopup: {
        title: "A Prize Form Wants Personal Details",
        narrative: "In this scene, the giveaway link has opened a form asking for Marie's details, including her birthday, home address, and phone number. Excited by the prize, she is tempted to fill it in. You are taking over before anything is submitted. What, if anything, will you share?",
      },
      choices: [
        {
          scenarioChoiceId: 'dp-02-a-birthday',
          target: 'field-birthday',
          choiceText: 'Submit the form with a birthday entered',
          isSafeChoice: false,
          outcomeTitle: 'Your information is being resold.',
          consequenceType: 'data_exposure',
          feedbackText:
            "You entered your birthdate. That's an identity-verification factor at almost every bank in the country — combined with your name, it's often enough to pass a security check as you. A raffle has no legitimate reason to ask for it.",
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-5/module-5-fail-video.mp4',
          consequenceVideoUrl: '/videos/module-5/module-5-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'dp-02-a-address',
          target: 'field-address',
          choiceText: 'Submit the form with a home address entered',
          isSafeChoice: false,
          outcomeTitle: 'Your information is being resold.',
          consequenceType: 'data_exposure',
          feedbackText:
            'You entered your home address. A raffle has no legitimate use for it — whoever has it now knows exactly where you live, tied to your real name and email.',
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-5/module-5-fail-video.mp4',
          consequenceVideoUrl: '/videos/module-5/module-5-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'dp-02-a-phone',
          target: 'field-phone',
          choiceText: 'Submit the form with a phone number entered',
          isSafeChoice: false,
          outcomeTitle: 'Your information is being resold.',
          consequenceType: 'data_exposure',
          feedbackText:
            "You entered your phone number. It's now tied to your real name and can be resold directly to whoever wants to reach you next — leading to the spam calls and messages that soon flooded Marie's phone.",
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-5/module-5-fail-video.mp4',
          consequenceVideoUrl: '/videos/module-5/module-5-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'dp-02-c',
          target: 'name-email-only',
          choiceText: 'Submit the form with only name and email entered',
          isSafeChoice: true,
          outcomeTitle: 'Only What It Actually Needs',
          consequenceType: 'none',
          feedbackText:
            "A raffle legitimately needs a name and a way to contact a winner — nothing here required your address, phone number, or birthday, and you didn't give them.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'dp-02-d',
          target: 'back-abandoned',
          choiceText: 'Leave the form without submitting',
          isSafeChoice: true,
          outcomeTitle: 'Backed Out, No Data Given',
          consequenceType: 'none',
          feedbackText:
            "Leaving the form entirely is the safest option of all — a legitimate giveaway can't resell information you never typed in.",
          feedbackMediaUrl: null,
        },
      ],
    },
  ],
}

export default dataPrivacyConfig
