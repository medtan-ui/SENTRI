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
 * different scenarioChoiceId — once the profile has been viewed, so
 * the two paths carry genuinely distinct feedback rather than one
 * generic "confirmed" outcome.
 *
 * Scenario 2 (ChatEscalationScene) is the only consequence in SENTRI
 * depicting harm to a person rather than an account. os-02-b
 * (leave-on-read) is technically risky — the account stays active to
 * try the same approach on someone else — but its own outcomeTitle and
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
  moduleId: 'online-safety',
  moduleTitle: 'Online Safety',
  coachLevel: 'none',
  scenarios: [
    {
      scenarioId: 'os-01',
      scenarioOrder: 1,
      scenarioTitle: 'A New Friend Request',
      scenarioDescription: 'A friend request is waiting from an account you don\'t recognize.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'A notification is waiting for a decision.',
      scene: 'FriendRequestScene',
      choices: [
        {
          scenarioChoiceId: 'os-01-a',
          target: 'confirm-request',
          choiceText: 'Confirm the request without checking the account',
          isSafeChoice: false,
          outcomeTitle: 'Confirmed, No Questions Asked',
          consequenceType: 'none',
          feedbackText:
            "Accepting a request from an account you don't recognize gives a stranger the same access you'd give someone you actually know — to your posts, your activity, and anyone else on your friends list. None of that took more than one tap to check.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'os-01-c',
          target: 'inspect-profile',
          choiceText: 'Open the profile, then delete the request',
          isSafeChoice: true,
          outcomeTitle: 'Checked, Then Declined',
          consequenceType: 'none',
          feedbackText:
            "Zero mutual friends, an account that's two weeks old, three posts total, and photos that turn up attached to other names elsewhere — every one of those is a sign of a fake or cloned profile. Deleting the request after seeing that is exactly right.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'os-01-b',
          target: 'confirm-anyway',
          choiceText: 'Confirm anyway, after having viewed the profile',
          isSafeChoice: false,
          outcomeTitle: 'Seen and Confirmed Anyway',
          consequenceType: 'none',
          feedbackText:
            "This time the signals were actually in front of you — no mutual friends, a two-week-old account, photos that show up elsewhere — and the request was confirmed anyway. That's a different mistake than not checking at all, and worth noticing in yourself: seeing a warning sign isn't the same as acting on it.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'os-02',
      scenarioOrder: 2,
      scenarioTitle: 'Making Plans',
      scenarioDescription: 'A chat that has been friendly for weeks just suggested meeting up today.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'The conversation is waiting on a reply.',
      scene: 'ChatEscalationScene',
      choices: [
        {
          scenarioChoiceId: 'os-02-a',
          target: 'agree-to-meet',
          choiceText: 'Reply "Sure, see you there" and send',
          isSafeChoice: false,
          outcomeTitle: 'You were meeting someone who was never who they said.',
          consequenceType: 'physical_risk',
          feedbackText:
            "The person waiting at the spot wasn't who the profile said they were. In the moment it took to realize that, your phone was already out of your hands — and by the time you'd worked out what was happening, you were already headed back toward campus. What happened next isn't something you caused by talking to someone online or agreeing to meet them — it's something someone else deliberately set up. Telling a parent, a guardian, campus security, or the police right away is the correct next step, not something to be embarrassed about.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'os-02-c',
          target: 'suggest-public',
          choiceText: 'Reply "Let\'s meet at the mall instead — I\'ll bring a friend" and send',
          isSafeChoice: true,
          outcomeTitle: 'Public, Not Alone',
          consequenceType: 'none',
          feedbackText:
            "Suggesting a public place and bringing a friend doesn't reject the friendship — it just removes the two things someone with bad intentions needs most: isolation and unpredictability. Someone with genuine intentions has no real reason to object to that.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'os-02-b',
          target: 'leave-on-read',
          choiceText: 'Close the chat without replying',
          isSafeChoice: false,
          outcomeTitle: 'The Account Is Still Out There',
          consequenceType: 'physical_risk',
          feedbackText:
            "Closing the chat stopped anything from happening to you today — not showing up is exactly what kept you safe here. But the account itself is untouched: nothing was reported, so it's still free to send this same message to the next person who answers it.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'os-03',
      scenarioOrder: 3,
      scenarioTitle: 'Afterwards',
      scenarioDescription: 'Back on the profile, deciding what to do about it.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'The profile is still there, and so is the conversation.',
      scene: 'ReportAndBlockScene',
      choices: [
        {
          scenarioChoiceId: 'os-03-a',
          target: 'do-nothing',
          choiceText: 'Go back and close the app without doing anything',
          isSafeChoice: false,
          outcomeTitle: 'Closed, But Still Out There',
          consequenceType: 'none',
          feedbackText:
            "Closing the app does nothing to the account itself — no report, no block, no record anywhere. It's free to try the same approach on someone else, and the conversation is only harder to find again later if it turns out to be needed.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'os-03-c',
          target: 'preserve-block-report',
          choiceText: 'Screenshot the conversation, then block, then report the account',
          isSafeChoice: true,
          outcomeTitle: 'Documented, Then Handled',
          consequenceType: 'none',
          feedbackText:
            "Screenshotting first preserved a record before blocking removed access to the conversation, and reporting flags the account for whoever reviews it next. That order — evidence, then block, then report — is the complete version of this, not just the safe reaction.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'os-03-b',
          target: 'public-callout',
          choiceText: 'Post a public comment on their profile confronting them',
          isSafeChoice: false,
          outcomeTitle: 'Now It\'s Public',
          consequenceType: 'none',
          feedbackText:
            "A public comment doesn't just confront them — it tells them, and anyone who reads the thread, exactly which account has been noticed, giving them time to delete it and start over under a new name before anyone reports it. It also puts your own name and profile in front of that same audience, attached to a post about a stranger who tried to get you alone.",
          feedbackMediaUrl: null,
        },
      ],
    },
  ],
}

export default onlineSafetyConfig
