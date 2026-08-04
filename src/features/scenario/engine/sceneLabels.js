/**
 * sceneLabels
 * A short "what am I looking at" badge shown above each scene while it's
 * active, keyed by the same `scene` string every config already uses to
 * pick a component out of SCENE_REGISTRY. Replaces the old traveling-
 * cursor coach: instead of animating a pointer at a button, we just tell
 * the student what kind of interface they're in.
 *
 * These labels used to be prefixed with an emoji each. They came off for
 * a reason specific to this component rather than general tidiness: the
 * badge sits directly on top of a scene that is *pretending to be* an
 * email client, a browser or a chat app, and several of those scenes use
 * emoji themselves as part of the fiction. A decorative 📧 floating above
 * a fake inbox competed with the fake inbox. The words already say what
 * the badge is for.
 */
export const SCENE_LABELS = {
  SignupTrioScene: 'Sign-Up Form',
  MailInboxScene: 'Email Inbox',
  AccountSecurityScene: 'Account Settings',
  InboxScene: 'Email Inbox',
  FakePortalScene: 'Login Page',
  SearchResultsScene: 'Search Results',
  DownloadScene: 'Download Prompt',
  FakeAlertScene: 'Pop-up Alert',
  ResearchSearchScene: 'Search Results',
  CertWarningScene: 'Browser Warning',
  FakeUpdateScene: 'Software Update',
  GiveawayPostScene: 'Social Media Post',
  GiveawayFormScene: 'Entry Form',
  SpamFloodScene: 'Message Inbox',
  FriendRequestScene: 'Friend Request',
  ChatEscalationScene: 'Chat Conversation',
  ReportAndBlockScene: 'Chat Conversation',
}

export function sceneLabelFor(sceneName) {
  return SCENE_LABELS[sceneName] || 'Interactive Scenario'
}
