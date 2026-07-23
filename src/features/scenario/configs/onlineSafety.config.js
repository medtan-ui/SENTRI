/**
 * onlineSafety.config.js
 * Module 6's simulation — phone surface (frames/PhoneFrame, reused as-is
 * from Module 5). Mock data only. Same shape as passwordSecurity.config.js;
 * see that file for the full field-by-field JSDoc.
 *
 * coachLevel: 'none' — a single subtle pulse on every target after 15s
 * idle, no animated coach.
 *
 * Scenario 1 (FriendRequestScene) gates one choice behind an inspection:
 * `confirm-anyway` can only be reached after `inspect-profile` has been
 * opened at least once. The scene implements this by having the single
 * physical "Confirm" control resolve to a different target — and a
 * different scenario_choice_id — once the profile has been viewed, so
 * the two paths carry genuinely distinct feedback rather than one
 * generic "confirmed" outcome.
 *
 * Scenario 2 (ChatEscalationScene) is the only consequence in SENTRI
 * depicting harm to a person rather than an account. os-02-b
 * (leave-on-read) is technically risky — the account stays active to
 * try the same approach on someone else — but its own outcome_title and
 * feedback deliberately differ from os-02-a's: no meeting happened, and
 * the feedback says so.
 *
 * Scenario 3 (ReportAndBlockScene) doesn't hard-block blocking before
 * screenshotting — per spec that must remain reachable — but the scene
 * itself reflects the lost access live, while still paused_interactive,
 * rather than through a second static config choice.
 *
 * @type {import('./passwordSecurity.config').ModuleScenarioConfig}
 */
export const onlineSafetyConfig = {
  module_id: 'online-safety',
  module_title: 'Online Safety',
  coachLevel: 'none',
  scenarios: [
    {
      scenario_id: 'os-01',
      scenario_order: 1,
      scenario_title: 'A New Friend Request',
      scenario_description: 'A friend request is waiting from an account you don\'t recognize.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'A notification is waiting for a decision.',
      scene: 'FriendRequestScene',
      choices: [
        {
          scenario_choice_id: 'os-01-a',
          target: 'confirm-request',
          choice_text: 'Confirm the request without checking the account',
          is_safe_choice: false,
          outcome_title: 'Confirmed, No Questions Asked',
          consequence_type: 'none',
          feedback_text:
            "Accepting a request from an account you don't recognize gives a stranger the same access you'd give someone you actually know — to your posts, your activity, and anyone else on your friends list. None of that took more than one tap to check.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'os-01-c',
          target: 'inspect-profile',
          choice_text: 'Open the profile, then delete the request',
          is_safe_choice: true,
          outcome_title: 'Checked, Then Declined',
          consequence_type: 'none',
          feedback_text:
            "Zero mutual friends, an account that's two weeks old, three posts total, and photos that turn up attached to other names elsewhere — every one of those is a sign of a fake or cloned profile. Deleting the request after seeing that is exactly right.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'os-01-b',
          target: 'confirm-anyway',
          choice_text: 'Confirm anyway, after having viewed the profile',
          is_safe_choice: false,
          outcome_title: 'Seen and Confirmed Anyway',
          consequence_type: 'none',
          feedback_text:
            "This time the signals were actually in front of you — no mutual friends, a two-week-old account, photos that show up elsewhere — and the request was confirmed anyway. That's a different mistake than not checking at all, and worth noticing in yourself: seeing a warning sign isn't the same as acting on it.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'os-02',
      scenario_order: 2,
      scenario_title: 'Making Plans',
      scenario_description: 'A chat that has been friendly for weeks just suggested meeting up today.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'The conversation is waiting on a reply.',
      scene: 'ChatEscalationScene',
      choices: [
        {
          scenario_choice_id: 'os-02-a',
          target: 'agree-to-meet',
          choice_text: 'Reply "Sure, see you there" and send',
          is_safe_choice: false,
          outcome_title: 'You were meeting someone who was never who they said.',
          consequence_type: 'physical_risk',
          feedback_text:
            "The person waiting at the spot wasn't who the profile said they were. In the moment it took to realize that, your phone was already out of your hands — and by the time you'd worked out what was happening, you were already headed back toward campus. What happened next isn't something you caused by talking to someone online or agreeing to meet them — it's something someone else deliberately set up. Telling a parent, a guardian, campus security, or the police right away is the correct next step, not something to be embarrassed about.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'os-02-c',
          target: 'suggest-public',
          choice_text: 'Reply "Let\'s meet at the mall instead — I\'ll bring a friend" and send',
          is_safe_choice: true,
          outcome_title: 'Public, Not Alone',
          consequence_type: 'none',
          feedback_text:
            "Suggesting a public place and bringing a friend doesn't reject the friendship — it just removes the two things someone with bad intentions needs most: isolation and unpredictability. Someone with genuine intentions has no real reason to object to that.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'os-02-b',
          target: 'leave-on-read',
          choice_text: 'Close the chat without replying',
          is_safe_choice: false,
          outcome_title: 'The Account Is Still Out There',
          consequence_type: 'physical_risk',
          feedback_text:
            "Closing the chat stopped anything from happening to you today — not showing up is exactly what kept you safe here. But the account itself is untouched: nothing was reported, so it's still free to send this same message to the next person who answers it.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'os-03',
      scenario_order: 3,
      scenario_title: 'Afterwards',
      scenario_description: 'Back on the profile, deciding what to do about it.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'The profile is still there, and so is the conversation.',
      scene: 'ReportAndBlockScene',
      choices: [
        {
          scenario_choice_id: 'os-03-a',
          target: 'do-nothing',
          choice_text: 'Go back and close the app without doing anything',
          is_safe_choice: false,
          outcome_title: 'Closed, But Still Out There',
          consequence_type: 'none',
          feedback_text:
            "Closing the app does nothing to the account itself — no report, no block, no record anywhere. It's free to try the same approach on someone else, and the conversation is only harder to find again later if it turns out to be needed.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'os-03-c',
          target: 'preserve-block-report',
          choice_text: 'Screenshot the conversation, then block, then report the account',
          is_safe_choice: true,
          outcome_title: 'Documented, Then Handled',
          consequence_type: 'none',
          feedback_text:
            "Screenshotting first preserved a record before blocking removed access to the conversation, and reporting flags the account for whoever reviews it next. That order — evidence, then block, then report — is the complete version of this, not just the safe reaction.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'os-03-b',
          target: 'public-callout',
          choice_text: 'Post a public comment on their profile confronting them',
          is_safe_choice: false,
          outcome_title: 'Now It\'s Public',
          consequence_type: 'none',
          feedback_text:
            "A public comment doesn't just confront them — it tells them, and anyone who reads the thread, exactly which account has been noticed, giving them time to delete it and start over under a new name before anyone reports it. It also puts your own name and profile in front of that same audience, attached to a post about a stranger who tried to get you alone.",
          feedback_media_url: null,
        },
      ],
    },
  ],
}

export default onlineSafetyConfig
