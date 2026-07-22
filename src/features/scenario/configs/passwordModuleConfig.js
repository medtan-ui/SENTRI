/**
 * passwordModuleConfig.js
 *
 * Example ModuleScenarioConfig (see ../types/scenario.types.js) — demonstrates
 * the shape the Scenario Engine expects. Placeholder content only, meant to
 * show how a future module wires into the engine. Not imported by any route
 * or page yet: building the real Password Security simulation is a separate,
 * later task.
 *
 * Every other module (Phishing Awareness, Malware Awareness, Safe Browsing,
 * Data Privacy, Online Safety) should only ever require a sibling file like
 * this one — never a change to the engine itself.
 *
 * @type {import('../types/scenario.types').ModuleScenarioConfig}
 */
export const passwordModuleConfig = {
  id: 'password-security',
  title: 'Password Security',
  surface: 'browser',
  scenarios: [
    {
      id: 'scenario-1',
      title: 'A Suspicious Reset Email',
      simulatedUrl: 'https://mail.example.com/inbox',
      video: {
        videoUrl: '/placeholder-videos/password-security/scenario-1.mp4',
        videoAvailable: false,
        thumbnail: '/placeholder-thumbnails/password-security/scenario-1.jpg',
        duration: 40,
      },
      pauseTimestamp: 16,
      choices: [
        {
          id: 'scenario-1-choice-a',
          text: "Click the link in the email to reset your password right now",
          isSafe: false,
          feedbackTitle: 'That link could be a trap',
          feedbackText:
            "The sender's address didn't match the real service. Clicking unfamiliar reset links is one of the most common ways attackers steal login credentials.",
          consequenceVideo: {
            videoUrl: '/placeholder-videos/password-security/scenario-1-consequence.mp4',
            videoAvailable: false,
            thumbnail: '/placeholder-thumbnails/password-security/scenario-1-consequence.jpg',
            duration: 18,
          },
        },
        {
          id: 'scenario-1-choice-b',
          text: "Go to the service's site yourself by typing the address, instead of clicking the email link",
          isSafe: true,
          feedbackTitle: 'Good instinct',
          feedbackText:
            'Typing the address yourself sidesteps fake login pages entirely. When in doubt, verify through a source you trust rather than a link you were sent.',
        },
        {
          id: 'scenario-1-choice-c',
          text: 'Delete the email and take no further action',
          isSafe: false,
          feedbackTitle: 'Better than clicking, but not the safest option',
          feedbackText:
            "Deleting it avoids the immediate risk, but reporting suspicious emails to IT helps flag the same attack for everyone else who received it.",
          // No consequenceVideo — ConsequencePlayer falls back to its
          // generic warning placeholder for this choice.
        },
      ],
    },
    {
      id: 'scenario-2',
      title: 'Setting Up a New Account',
      simulatedUrl: 'https://portal.example.com/signup',
      video: {
        videoUrl: '/placeholder-videos/password-security/scenario-2.mp4',
        videoAvailable: false,
        thumbnail: '/placeholder-thumbnails/password-security/scenario-2.jpg',
        duration: 35,
      },
      pauseTimestamp: 12,
      choices: [
        {
          id: 'scenario-2-choice-a',
          text: 'Reuse the same password you already use for your email account',
          isSafe: false,
          feedbackTitle: 'One breach, many accounts',
          feedbackText:
            'If this new service is ever breached, attackers will try that same password against your email and every other account you own.',
          consequenceVideo: {
            videoUrl: '/placeholder-videos/password-security/scenario-2-consequence.mp4',
            videoAvailable: false,
            thumbnail: '/placeholder-thumbnails/password-security/scenario-2-consequence.jpg',
            duration: 15,
          },
        },
        {
          id: 'scenario-2-choice-b',
          text: 'Generate a new, unique password with a password manager',
          isSafe: true,
          feedbackTitle: 'Exactly right',
          feedbackText:
            'A unique password per account means a breach anywhere else can never be used to unlock this one.',
        },
      ],
    },
    {
      id: 'scenario-3',
      title: 'A Login Alert',
      simulatedUrl: 'https://accounts.example.com/security',
      video: {
        videoUrl: '/placeholder-videos/password-security/scenario-3.mp4',
        videoAvailable: false,
        thumbnail: '/placeholder-thumbnails/password-security/scenario-3.jpg',
        duration: 30,
      },
      pauseTimestamp: 10,
      choices: [
        {
          id: 'scenario-3-choice-a',
          text: 'Ignore the "new device sign-in" alert — it\'s probably nothing',
          isSafe: false,
          feedbackTitle: "Don't dismiss login alerts",
          feedbackText:
            "Unrecognized sign-in alerts are one of the earliest signs of a compromised account. Ignoring them gives an attacker more time inside your account.",
          // No consequenceVideo for this one either — placeholder path.
        },
        {
          id: 'scenario-3-choice-b',
          text: 'Change your password immediately and review active sessions',
          isSafe: true,
          feedbackTitle: 'Quick action limits the damage',
          feedbackText:
            'Changing your password and signing out other sessions immediately shuts down an attacker who may already be inside your account.',
        },
      ],
    },
  ],
}

export default passwordModuleConfig
