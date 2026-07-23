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
  module_id: 'data-privacy',
  module_title: 'Data Privacy',
  coachLevel: 'none',
  scenarios: [
    {
      scenario_id: 'dp-01',
      scenario_order: 1,
      scenario_title: 'A Giveaway in the Feed',
      scenario_description: 'A "₱5,000 giveaway" post is sitting in her feed.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'A post in the feed is asking for a decision.',
      scene: 'GiveawayPostScene',
      choices: [
        {
          scenario_choice_id: 'dp-01-a',
          target: 'join-link',
          choice_text: 'Tap JOIN NOW on the giveaway post',
          is_safe_choice: false,
          outcome_title: 'Not a Sponsor — Just a New Account',
          consequence_type: 'none',
          feedback_text:
            "Reminder-78 has no verification badge, was created days ago, and has almost no post history — the hallmarks of a throwaway account built to run a scheme like this one, not a real sponsor with a prize to give away.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'dp-01-c',
          target: 'account-name',
          choice_text: "Open Reminder-78's profile before doing anything else",
          is_safe_choice: true,
          outcome_title: 'Checked Before Trusting It',
          consequence_type: 'none',
          feedback_text:
            "The profile shows exactly what a scam account looks like: created only 6 days ago, just 2 posts, no verification badge, and comments disabled so nobody can publicly call it out. None of that belongs to a real giveaway sponsor.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'dp-01-d',
          target: 'dismiss-post',
          choice_text: 'Mark the post "Not interested" and move on',
          is_safe_choice: true,
          outcome_title: 'Ignored — And Nothing Happened',
          consequence_type: 'none',
          feedback_text:
            "Scrolling past cost you nothing, and that's a perfectly reasonable way to handle a post like this. But you didn't see why it was suspicious — checking the account first (created 6 days ago, no verification, comments disabled) would have shown you the actual warning signs to recognize next time.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'dp-02',
      scenario_order: 2,
      scenario_title: 'Claim Your Prize',
      scenario_description: 'A form is asking for her information to send the prize.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'A form wants some information before it continues.',
      scene: 'GiveawayFormScene',
      choices: [
        {
          scenario_choice_id: 'dp-02-a-birthday',
          target: 'field-birthday',
          choice_text: 'Submit the form with a birthday entered',
          is_safe_choice: false,
          outcome_title: 'Your information is being resold.',
          consequence_type: 'data_exposure',
          feedback_text:
            "You entered your birthdate. That's an identity-verification factor at almost every bank in the country — combined with your name, it's often enough to pass a security check as you. A raffle has no legitimate reason to ask for it.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'dp-02-a-address',
          target: 'field-address',
          choice_text: 'Submit the form with a home address entered',
          is_safe_choice: false,
          outcome_title: 'Your information is being resold.',
          consequence_type: 'data_exposure',
          feedback_text:
            'You entered your home address. A raffle has no legitimate use for it — whoever has it now knows exactly where you live, tied to your real name and email.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'dp-02-a-phone',
          target: 'field-phone',
          choice_text: 'Submit the form with a phone number entered',
          is_safe_choice: false,
          outcome_title: 'Your information is being resold.',
          consequence_type: 'data_exposure',
          feedback_text:
            "You entered your phone number. It's now tied to your real name and can be resold directly to whoever wants to reach you next — including the messages that are about to start arriving.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'dp-02-c',
          target: 'name-email-only',
          choice_text: 'Submit the form with only name and email entered',
          is_safe_choice: true,
          outcome_title: 'Only What It Actually Needs',
          consequence_type: 'none',
          feedback_text:
            "A raffle legitimately needs a name and a way to contact a winner — nothing here required your address, phone number, or birthday, and you didn't give them.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'dp-02-d',
          target: 'back-abandoned',
          choice_text: 'Leave the form without submitting',
          is_safe_choice: true,
          outcome_title: 'Backed Out, No Data Given',
          consequence_type: 'none',
          feedback_text:
            "Leaving the form entirely is the safest option of all — a legitimate giveaway can't resell information you never typed in.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'dp-03',
      scenario_order: 3,
      scenario_title: "The Messages Won't Stop",
      scenario_description: 'Spam texts have started arriving on her phone.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'Her phone keeps buzzing with messages from unknown numbers.',
      scene: 'SpamFloodScene',
      choices: [
        {
          scenario_choice_id: 'dp-03-a',
          target: 'reply-stop',
          choice_text: 'Open the spam message and reply STOP',
          is_safe_choice: false,
          outcome_title: 'That Reply Confirmed the Number Is Live',
          consequence_type: 'data_exposure',
          feedback_text:
            "Replying — even just \"STOP\" — tells whoever's sending these that a real person reads this number. That confirmation makes it more valuable on the same lists that sold it in the first place, not less.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'dp-03-b',
          target: 'change-number',
          choice_text: 'Go to Settings and change her phone number',
          is_safe_choice: false,
          outcome_title: 'A New Number, Same Leaked Data',
          consequence_type: 'financial_loss',
          feedback_text:
            "Changing the number stops these specific messages, but the information that leaked — name, address, and birthday — hasn't gone anywhere and is still linked to her. A new number doesn't undo what a resold identity can still be used for.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'dp-03-c',
          target: 'block-and-report',
          choice_text: 'Block & report the number, then check accounts using it in Settings',
          is_safe_choice: true,
          outcome_title: 'Blocked, Reported, and Checked',
          consequence_type: 'none',
          feedback_text:
            "Blocking and reporting the number stops it specifically, and checking which accounts use this number is the step that actually deals with the leak itself — instead of just reacting to the latest message.",
          feedback_media_url: null,
        },
      ],
    },
  ],
}

export default dataPrivacyConfig
