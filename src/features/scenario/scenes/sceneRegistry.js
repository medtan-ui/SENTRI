import SignupTrioScene from './password-security/SignupTrioScene'
import MailInboxScene from './password-security/MailInboxScene'
import AccountSecurityScene from './password-security/AccountSecurityScene'
import InboxScene from './phishing-awareness/InboxScene'
import FakePortalScene from './phishing-awareness/FakePortalScene'
import SearchResultsScene from './malware-awareness/SearchResultsScene'
import DownloadScene from './malware-awareness/DownloadScene'
import FakeAlertScene from './malware-awareness/FakeAlertScene'
import ResearchSearchScene from './safe-browsing/ResearchSearchScene'
import CertWarningScene from './safe-browsing/CertWarningScene'
import FakeUpdateScene from './safe-browsing/FakeUpdateScene'
import GiveawayPostScene from './data-privacy/GiveawayPostScene'
import GiveawayFormScene from './data-privacy/GiveawayFormScene'
import SpamFloodScene from './data-privacy/SpamFloodScene'
import FriendRequestScene from './online-safety/FriendRequestScene'
import ChatEscalationScene from './online-safety/ChatEscalationScene'
import ReportAndBlockScene from './online-safety/ReportAndBlockScene'

/**
 * sceneRegistry
 * Maps a config's `scene` string to the bespoke component that renders
 * it. Adding a future module means adding its scene components here and
 * a new config file — ScenarioEngine itself never changes.
 */
export const SCENE_REGISTRY = {
  SignupTrioScene,
  MailInboxScene,
  AccountSecurityScene,
  InboxScene,
  FakePortalScene,
  SearchResultsScene,
  DownloadScene,
  FakeAlertScene,
  ResearchSearchScene,
  CertWarningScene,
  FakeUpdateScene,
  GiveawayPostScene,
  GiveawayFormScene,
  SpamFloodScene,
  FriendRequestScene,
  ChatEscalationScene,
  ReportAndBlockScene,
}
