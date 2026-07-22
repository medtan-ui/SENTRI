import { passwordModuleConfig } from '../../../scenario/configs/passwordModuleConfig'

/**
 * scenarioConfigService.js
 *
 * Authored seed content for the admin Scenario Configuration feature —
 * the initial value every moduleScenarios/{moduleId} Firestore document
 * is lazily seeded with on its first read (see
 * src/services/scenarioService.js), and what "Reset to Defaults" reverts
 * a draft to. Real persistence now lives in scenarioService/Firestore;
 * this file only owns the mock content itself.
 *
 * Deliberately decoupled from src/features/scenario/configs — this is
 * the ADMIN's own editable copy of each module's scenario config, seeded
 * from the engine's real Password Security config where one already
 * exists.
 */

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function withOrder(scenarios) {
  return scenarios.map((scenario, index) => ({ order: index + 1, ...scenario }))
}

// ── Password Security — seeded from the engine's real config ──
const passwordSecurityDefaults = {
  id: passwordModuleConfig.id,
  title: passwordModuleConfig.title,
  surface: passwordModuleConfig.surface,
  scenarios: withOrder(passwordModuleConfig.scenarios),
}

// ── The other five modules — concise handcrafted mock scenarios,
// matching the exact same shape the engine consumes. ──

const phishingAwarenessDefaults = {
  id: 'phishing-awareness',
  title: 'Phishing Awareness',
  surface: 'browser',
  scenarios: withOrder([
    {
      id: 'pa-scenario-1',
      title: 'An Urgent Payment Request',
      simulatedUrl: 'https://mail.example.com/inbox',
      video: { videoUrl: '/placeholder-videos/phishing-awareness/scenario-1.mp4', videoAvailable: false, thumbnail: '', duration: 38 },
      pauseTimestamp: 15,
      choices: [
        {
          id: 'pa-s1-c1',
          text: 'Open the attached invoice to check the amount',
          isSafe: false,
          feedbackTitle: 'That attachment could carry malware',
          feedbackText: 'Unexpected invoice attachments are a classic phishing lure. Opening it could run malicious code on your device.',
          consequenceVideo: { videoUrl: '/placeholder-videos/phishing-awareness/scenario-1-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 16 },
        },
        {
          id: 'pa-s1-c2',
          text: 'Call the vendor using the number on file to confirm the request',
          isSafe: true,
          feedbackTitle: 'Exactly right',
          feedbackText: 'Verifying through a known, trusted channel — not the email itself — confirms whether the request is real.',
        },
        {
          id: 'pa-s1-c3',
          text: 'Reply directly to the email asking for more details',
          isSafe: false,
          feedbackTitle: "Replying doesn't verify anything",
          feedbackText: 'Replying only confirms your address is active and keeps you talking to the attacker, not the real vendor.',
        },
      ],
    },
    {
      id: 'pa-scenario-2',
      title: 'The Fake Login Page',
      simulatedUrl: 'https://mail.example.com/link-warning',
      video: { videoUrl: '/placeholder-videos/phishing-awareness/scenario-2.mp4', videoAvailable: false, thumbnail: '', duration: 34 },
      pauseTimestamp: 13,
      choices: [
        {
          id: 'pa-s2-c1',
          text: 'Enter your username and password on the linked page',
          isSafe: false,
          feedbackTitle: 'That page was a lookalike',
          feedbackText: "The domain didn't match the real service. Entering credentials there hands them straight to an attacker.",
          consequenceVideo: { videoUrl: '/placeholder-videos/phishing-awareness/scenario-2-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 17 },
        },
        {
          id: 'pa-s2-c2',
          text: 'Close the tab and navigate to the service yourself',
          isSafe: true,
          feedbackTitle: 'Good instinct',
          feedbackText: 'Typing the address yourself sidesteps the fake page entirely.',
        },
      ],
    },
    {
      id: 'pa-scenario-3',
      title: 'A Suspicious Attachment',
      simulatedUrl: 'https://mail.example.com/inbox',
      video: { videoUrl: '/placeholder-videos/phishing-awareness/scenario-3.mp4', videoAvailable: false, thumbnail: '', duration: 30 },
      pauseTimestamp: 11,
      choices: [
        {
          id: 'pa-s3-c1',
          text: 'Open the .zip file to see what it contains',
          isSafe: false,
          feedbackTitle: 'Unexpected archives are risky',
          feedbackText: 'Compressed attachments are a common way to smuggle malware past basic scanning.',
        },
        {
          id: 'pa-s3-c2',
          text: 'Delete the email and report it to IT',
          isSafe: true,
          feedbackTitle: 'Well handled',
          feedbackText: 'Reporting suspicious emails helps flag the same attack for everyone else who received it.',
        },
      ],
    },
  ]),
}

const malwareAwarenessDefaults = {
  id: 'malware-awareness',
  title: 'Malware Awareness',
  surface: 'browser',
  scenarios: withOrder([
    {
      id: 'ma-scenario-1',
      title: 'A Free Software Download',
      simulatedUrl: 'https://free-tools-download.example.com',
      video: { videoUrl: '/placeholder-videos/malware-awareness/scenario-1.mp4', videoAvailable: false, thumbnail: '', duration: 36 },
      pauseTimestamp: 14,
      choices: [
        {
          id: 'ma-s1-c1',
          text: 'Download the "free" version from this unfamiliar site',
          isSafe: false,
          feedbackTitle: 'Unofficial sources are a common malware source',
          feedbackText: 'Free downloads from unverified sites are frequently bundled with malware.',
          consequenceVideo: { videoUrl: '/placeholder-videos/malware-awareness/scenario-1-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 15 },
        },
        {
          id: 'ma-s1-c2',
          text: "Download only from the software's official website",
          isSafe: true,
          feedbackTitle: 'Safer choice',
          feedbackText: 'Official sources are far less likely to bundle malicious software with a download.',
        },
      ],
    },
    {
      id: 'ma-scenario-2',
      title: 'The Infected USB Drive',
      simulatedUrl: 'https://desktop.example.com',
      video: { videoUrl: '/placeholder-videos/malware-awareness/scenario-2.mp4', videoAvailable: false, thumbnail: '', duration: 32 },
      pauseTimestamp: 12,
      choices: [
        {
          id: 'ma-s2-c1',
          text: 'Plug in the USB drive you found in the parking lot',
          isSafe: false,
          feedbackTitle: 'A classic attack technique',
          feedbackText: 'Unknown USB drives are a well-known way attackers deliver malware directly to a device.',
          consequenceVideo: { videoUrl: '/placeholder-videos/malware-awareness/scenario-2-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 14 },
        },
        {
          id: 'ma-s2-c2',
          text: 'Hand the drive to IT without plugging it in',
          isSafe: true,
          feedbackTitle: 'Correct',
          feedbackText: 'IT can safely inspect unknown media without exposing your device.',
        },
        {
          id: 'ma-s2-c3',
          text: 'Plug it in just briefly to see who it belongs to',
          isSafe: false,
          feedbackTitle: 'Even a brief connection is risky',
          feedbackText: 'Malware can execute the instant a drive is connected — there is no "safe peek."',
        },
      ],
    },
    {
      id: 'ma-scenario-3',
      title: 'A Ransomware Pop-up',
      simulatedUrl: 'https://desktop.example.com',
      video: { videoUrl: '/placeholder-videos/malware-awareness/scenario-3.mp4', videoAvailable: false, thumbnail: '', duration: 28 },
      pauseTimestamp: 10,
      choices: [
        {
          id: 'ma-s3-c1',
          text: 'Pay the ransom shown on screen to unlock your files',
          isSafe: false,
          feedbackTitle: "Paying doesn't guarantee recovery",
          feedbackText: 'Paying funds the attacker and often does not result in files being restored.',
        },
        {
          id: 'ma-s3-c2',
          text: 'Disconnect the device from the network and report it to IT',
          isSafe: true,
          feedbackTitle: 'Right response',
          feedbackText: 'Disconnecting limits the spread while IT investigates and restores from backup.',
        },
      ],
    },
  ]),
}

const safeBrowsingDefaults = {
  id: 'safe-browsing',
  title: 'Safe Browsing',
  surface: 'browser',
  scenarios: withOrder([
    {
      id: 'sb-scenario-1',
      title: 'An Unsecured Wi-Fi Network',
      simulatedUrl: 'https://coffee-shop-wifi.example.com',
      video: { videoUrl: '/placeholder-videos/safe-browsing/scenario-1.mp4', videoAvailable: false, thumbnail: '', duration: 34 },
      pauseTimestamp: 13,
      choices: [
        {
          id: 'sb-s1-c1',
          text: 'Log into your bank account over the open café Wi-Fi',
          isSafe: false,
          feedbackTitle: 'Open networks can be intercepted',
          feedbackText: 'Unsecured Wi-Fi lets others on the same network potentially intercept unencrypted traffic.',
          consequenceVideo: { videoUrl: '/placeholder-videos/safe-browsing/scenario-1-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 15 },
        },
        {
          id: 'sb-s1-c2',
          text: 'Wait until you are on a trusted network, or use a VPN',
          isSafe: true,
          feedbackTitle: 'Safer choice',
          feedbackText: 'A trusted network or VPN protects sensitive traffic from others sharing the same Wi-Fi.',
        },
      ],
    },
    {
      id: 'sb-scenario-2',
      title: 'A Too-Good-To-Be-True Deal',
      simulatedUrl: 'https://mega-deals-today.example.com',
      video: { videoUrl: '/placeholder-videos/safe-browsing/scenario-2.mp4', videoAvailable: false, thumbnail: '', duration: 30 },
      pauseTimestamp: 12,
      choices: [
        {
          id: 'sb-s2-c1',
          text: 'Enter your card details on this unfamiliar site for the 90% off deal',
          isSafe: false,
          feedbackTitle: 'A classic scam pattern',
          feedbackText: 'Extreme discounts on unfamiliar sites are a common tactic to harvest payment details.',
          consequenceVideo: { videoUrl: '/placeholder-videos/safe-browsing/scenario-2-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 14 },
        },
        {
          id: 'sb-s2-c2',
          text: 'Close the site and search for reviews before buying anything',
          isSafe: true,
          feedbackTitle: 'Good instinct',
          feedbackText: 'A quick reputation check can reveal a scam site before you enter any payment details.',
        },
      ],
    },
    {
      id: 'sb-scenario-3',
      title: 'A Browser Extension Prompt',
      simulatedUrl: 'https://video-player-site.example.com',
      video: { videoUrl: '/placeholder-videos/safe-browsing/scenario-3.mp4', videoAvailable: false, thumbnail: '', duration: 26 },
      pauseTimestamp: 9,
      choices: [
        {
          id: 'sb-s3-c1',
          text: 'Install the extension the site says you need to watch the video',
          isSafe: false,
          feedbackTitle: 'Unverified extensions can be malicious',
          feedbackText: 'Extensions demanded by a random site are a common malware delivery method.',
        },
        {
          id: 'sb-s3-c2',
          text: 'Leave the site without installing anything',
          isSafe: true,
          feedbackTitle: 'Correct',
          feedbackText: 'A legitimate video does not require installing an unknown browser extension.',
        },
      ],
    },
  ]),
}

const dataPrivacyDefaults = {
  id: 'data-privacy',
  title: 'Data Privacy',
  surface: 'phone',
  scenarios: withOrder([
    {
      id: 'dp-scenario-1',
      title: 'An App Permission Request',
      video: { videoUrl: '/placeholder-videos/data-privacy/scenario-1.mp4', videoAvailable: false, thumbnail: '', duration: 32 },
      pauseTimestamp: 12,
      choices: [
        {
          id: 'dp-s1-c1',
          text: 'Grant the flashlight app access to your contacts and location',
          isSafe: false,
          feedbackTitle: 'That permission is unnecessary',
          feedbackText: 'A flashlight app has no legitimate reason to need your contacts or location.',
          consequenceVideo: { videoUrl: '/placeholder-videos/data-privacy/scenario-1-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 14 },
        },
        {
          id: 'dp-s1-c2',
          text: 'Deny the request and check if the app still works',
          isSafe: true,
          feedbackTitle: 'Good practice',
          feedbackText: 'Only granting permissions an app actually needs limits what data it can collect.',
        },
      ],
    },
    {
      id: 'dp-scenario-2',
      title: 'Oversharing on Social Media',
      video: { videoUrl: '/placeholder-videos/data-privacy/scenario-2.mp4', videoAvailable: false, thumbnail: '', duration: 30 },
      pauseTimestamp: 11,
      choices: [
        {
          id: 'dp-s2-c1',
          text: 'Post your travel dates and home address publicly',
          isSafe: false,
          feedbackTitle: 'That reveals more than it seems',
          feedbackText: 'Public travel details combined with an address can signal exactly when a home is empty.',
          consequenceVideo: { videoUrl: '/placeholder-videos/data-privacy/scenario-2-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 13 },
        },
        {
          id: 'dp-s2-c2',
          text: 'Share trip photos only after you return, to a private group',
          isSafe: true,
          feedbackTitle: 'Safer sharing habit',
          feedbackText: 'Limiting the audience and timing reduces what a stranger can learn and act on.',
        },
      ],
    },
    {
      id: 'dp-scenario-3',
      title: 'A Data Deletion Request',
      video: { videoUrl: '/placeholder-videos/data-privacy/scenario-3.mp4', videoAvailable: false, thumbnail: '', duration: 26 },
      pauseTimestamp: 9,
      choices: [
        {
          id: 'dp-s3-c1',
          text: 'Ignore the option to request account data deletion',
          isSafe: false,
          feedbackTitle: 'You have a say in this',
          feedbackText: 'Most services are required to honor data deletion requests — it is worth using that right.',
        },
        {
          id: 'dp-s3-c2',
          text: 'Submit a data deletion request for the account you no longer use',
          isSafe: true,
          feedbackTitle: 'Good practice',
          feedbackText: 'Removing data from unused accounts limits what could be exposed in a future breach.',
        },
      ],
    },
  ]),
}

const onlineSafetyDefaults = {
  id: 'online-safety',
  title: 'Online Safety',
  surface: 'phone',
  scenarios: withOrder([
    {
      id: 'os-scenario-1',
      title: "A Stranger's Friend Request",
      video: { videoUrl: '/placeholder-videos/online-safety/scenario-1.mp4', videoAvailable: false, thumbnail: '', duration: 30 },
      pauseTimestamp: 11,
      choices: [
        {
          id: 'os-s1-c1',
          text: 'Accept and share your profile details with the stranger',
          isSafe: false,
          feedbackTitle: 'Be cautious with unknown requests',
          feedbackText: 'Accounts with no mutual connections or history are commonly used to gather personal information.',
          consequenceVideo: { videoUrl: '/placeholder-videos/online-safety/scenario-1-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 13 },
        },
        {
          id: 'os-s1-c2',
          text: 'Decline and adjust your profile visibility settings',
          isSafe: true,
          feedbackTitle: 'Good call',
          feedbackText: 'Limiting who can see your profile reduces exposure to accounts like this one.',
        },
      ],
    },
    {
      id: 'os-scenario-2',
      title: 'An Online Challenge Gone Wrong',
      video: { videoUrl: '/placeholder-videos/online-safety/scenario-2.mp4', videoAvailable: false, thumbnail: '', duration: 28 },
      pauseTimestamp: 10,
      choices: [
        {
          id: 'os-s2-c1',
          text: 'Complete the risky viral challenge to fit in',
          isSafe: false,
          feedbackTitle: 'Peer pressure online is still pressure',
          feedbackText: 'Viral challenges can encourage unsafe behavior — it is okay to opt out.',
          consequenceVideo: { videoUrl: '/placeholder-videos/online-safety/scenario-2-consequence.mp4', videoAvailable: false, thumbnail: '', duration: 12 },
        },
        {
          id: 'os-s2-c2',
          text: "Skip the challenge and mute the group's pressure",
          isSafe: true,
          feedbackTitle: 'Good decision',
          feedbackText: 'Choosing not to participate protects you without needing anyone else\'s approval.',
        },
      ],
    },
    {
      id: 'os-scenario-3',
      title: 'Cyberbullying in a Group Chat',
      video: { videoUrl: '/placeholder-videos/online-safety/scenario-3.mp4', videoAvailable: false, thumbnail: '', duration: 26 },
      pauseTimestamp: 9,
      choices: [
        {
          id: 'os-s3-c1',
          text: 'Join in on the group chat piling on one member',
          isSafe: false,
          feedbackTitle: 'This causes real harm',
          feedbackText: 'Participating amplifies the harm being done to the targeted person.',
        },
        {
          id: 'os-s3-c2',
          text: 'Leave the chat and report it to a trusted adult or moderator',
          isSafe: true,
          feedbackTitle: 'The right move',
          feedbackText: 'Reporting gives someone with authority the chance to step in and stop it.',
        },
      ],
    },
  ]),
}

/** Immutable seed data, keyed by moduleId. Never mutated directly. */
const DEFAULT_CONFIGS = {
  'password-security': passwordSecurityDefaults,
  'phishing-awareness': phishingAwarenessDefaults,
  'malware-awareness': malwareAwarenessDefaults,
  'safe-browsing': safeBrowsingDefaults,
  'data-privacy': dataPrivacyDefaults,
  'online-safety': onlineSafetyDefaults,
}

/**
 * getDefaultScenarioConfig
 * The original authored seed for a module — never mutated. Consumed by
 * src/services/scenarioService.js as the lazy-seed value on a Firestore
 * document's first read, and by useScenario()'s "Reset to Defaults"
 * (intentionally distinct from "Cancel", which reverts to the last
 * *saved* Firestore state, not the original seed).
 * @param {string} moduleId
 * @returns {import('../types/scenarioConfigAdmin.types').AdminModuleScenarioConfig | null}
 */
export function getDefaultScenarioConfig(moduleId) {
  const seed = DEFAULT_CONFIGS[moduleId]
  return seed ? clone(seed) : null
}
