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
      scenarioDescription: 'A "₱5,000 giveaway" post is sitting in her feed.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'A post in the feed is asking for a decision.',
      scene: 'GiveawayPostScene',
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
          consequenceVideoUrl: null,
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
      scenarioDescription: 'A form is asking for her information to send the prize.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'A form wants some information before it continues.',
      scene: 'GiveawayFormScene',
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
          consequenceVideoUrl: null,
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
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'dp-02-a-phone',
          target: 'field-phone',
          choiceText: 'Submit the form with a phone number entered',
          isSafeChoice: false,
          outcomeTitle: 'Your information is being resold.',
          consequenceType: 'data_exposure',
          feedbackText:
            "You entered your phone number. It's now tied to your real name and can be resold directly to whoever wants to reach you next — including the messages that are about to start arriving.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
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
    {
      scenarioId: 'dp-03',
      scenarioOrder: 3,
      scenarioTitle: "The Messages Won't Stop",
      scenarioDescription: 'Spam texts have started arriving on her phone.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'Her phone keeps buzzing with messages from unknown numbers.',
      scene: 'SpamFloodScene',
      choices: [
        {
          scenarioChoiceId: 'dp-03-a',
          target: 'reply-stop',
          choiceText: 'Open the spam message and reply STOP',
          isSafeChoice: false,
          outcomeTitle: 'That Reply Confirmed the Number Is Live',
          consequenceType: 'data_exposure',
          feedbackText:
            "Replying — even just \"STOP\" — tells whoever's sending these that a real person reads this number. That confirmation makes it more valuable on the same lists that sold it in the first place, not less.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'dp-03-b',
          target: 'change-number',
          choiceText: 'Go to Settings and change her phone number',
          isSafeChoice: false,
          outcomeTitle: 'A New Number, Same Leaked Data',
          consequenceType: 'financial_loss',
          feedbackText:
            "Changing the number stops these specific messages, but the information that leaked — name, address, and birthday — hasn't gone anywhere and is still linked to her. A new number doesn't undo what a resold identity can still be used for.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: null,
        },
        {
          scenarioChoiceId: 'dp-03-c',
          target: 'block-and-report',
          choiceText: 'Block & report the number, then check accounts using it in Settings',
          isSafeChoice: true,
          outcomeTitle: 'Blocked, Reported, and Checked',
          consequenceType: 'none',
          feedbackText:
            "Blocking and reporting the number stops it specifically, and checking which accounts use this number is the step that actually deals with the leak itself — instead of just reacting to the latest message.",
          feedbackMediaUrl: null,
        },
      ],
    },
  ],
}

export default dataPrivacyConfig
