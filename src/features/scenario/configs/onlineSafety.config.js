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
      videoAvailable: true,
      materialUrl: '/videos/module-6/module-6-intro.mp4',
      posterCaption: 'A friend request arrives from someone unfamiliar.',
      scene: 'FriendRequestScene',
      contextPopup: {
        title: "A Request from Someone Unfamiliar",
        narrative: "A student receives a friend request from someone he does not recognize. The profile suggests they attend the same school, making the request seem familiar. You are now looking at the request on his phone. How will you decide whether to connect?",
      },
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
          consequenceVideoUrl: '/videos/module-6/module-6-tutorial.mp4',
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
          consequenceVideoUrl: '/videos/module-6/module-6-tutorial.mp4',
        },
      ],
    },
    {
      scenarioId: 'os-02',
      scenarioOrder: 2,
      scenarioTitle: 'Making Plans',
      scenarioDescription: 'A chat that has been friendly for weeks just suggested meeting up today.',
      videoAvailable: true,
      materialUrl: '/videos/module-6/module-6-scene-2-intro.mp4',
      posterCaption: 'The online contact asks for your location and a meeting.',
      scene: 'ChatEscalationScene',
      contextPopup: {
        title: "An Online Chat Becomes a Meeting Request",
        narrative: "In this scene, the student has been chatting with Jamie, an online contact claiming to attend the same university. Jamie now asks for his live location and suggests meeting today. You are taking over in the conversation. How will you respond to the request?",
      },
      choices: [
        {
          scenarioChoiceId: 'os-02-a',
          target: 'agree-to-meet',
          choiceText: 'Reply "Sure, here\'s my location — see you there" and send',
          isSafeChoice: false,
          outcomeTitle: 'Robbed by an Online Stranger',
          consequenceType: 'physical_risk',
          feedbackText:
            "The person waiting at the location wasn't who the profile claimed to be. In the moment it took to realize that, your phone was snatched right out of your hands. Sharing your live location and agreeing to meet an unverified online stranger in an isolated area puts your personal safety at serious risk.",
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-6/module-6-fail-video.mp4',
          consequenceVideoUrl: '/videos/module-6/module-6-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'os-02-c',
          target: 'suggest-public',
          choiceText: 'Reply "Let\'s meet at the student mall instead — I\'ll bring a friend" and send',
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
          consequenceVideoUrl: '/videos/module-6/module-6-tutorial.mp4',
        },
      ],
    },
  ],
}

export default onlineSafetyConfig
