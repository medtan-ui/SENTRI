import { onlineSafetyConfig } from '../../features/scenario/configs/onlineSafety.config'

/**
 * onlineSafety.js
 * Mock module data for Online Safety. Scenario content lives in
 * features/scenario/configs/onlineSafety.config.js; lesson content below
 * is authored per SENTRI_Module_Content_Design.md. This module's
 * simulation depicts harm to a person rather than to an account, so its
 * content should be the first reviewed by content validators (see the
 * design doc's tone note).
 */
export const onlineSafetyModuleData = {
  moduleId: 'online-safety',
  title: 'Online Safety',
  description: 'Build safe habits for everyday internet use, from social media to public Wi-Fi and personal device security.',
  difficulty: 'Beginner',
  previousModuleId: null,
  // Paste a YouTube video id (or leave empty) once the lesson video for
  // this module is ready — YouTubePlayer shows a placeholder until then.
  videoId: '',

  lesson: {
    objectives: [
      'Recognize how strangers online build trust before making unsafe requests',
      'Respond to online pressure, harassment, and cyberbullying with clear steps',
      'Preserve evidence and report correctly when something goes wrong',
    ],
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: "Most of what happens online is ordinary and safe. This lesson is about the smaller set of situations where someone is deliberately working to influence you — a stranger who wants access, a group pushing you toward something risky, or a person using a platform to harass.\n\nWhat these situations share is that they build gradually. Recognizing the pattern early is what gives you room to step away comfortably, before any single decision feels difficult.",
      },
      {
        id: 'why-it-matters',
        title: 'Why Online Safety Matters',
        content: "Online interaction removes the signals people normally rely on to assess someone. You cannot see who is actually typing, verify that a photograph belongs to them, or check them against people you both know. Anyone can present themselves as a student your age with mutual interests, because nothing in the interface requires that to be true.\n\nThis is not a reason to distrust everyone online. It is a reason to verify before extending trust, and to keep the pace of a new interaction under your own control.\n\nOne point deserves stating plainly and holds for everything that follows: if someone deceives or targets you, the responsibility is theirs. Manipulation is designed to work, and it succeeds against careful people. Recognizing an attempt sooner is useful, but not recognizing it is not a failure on your part.",
      },
      {
        id: 'how-trust-is-built',
        title: 'How Strangers Build Trust',
        content: "Manipulation online rarely opens with an unreasonable request, because an unreasonable request from a stranger gets refused. It opens with something ordinary and escalates only after each step is accepted.\n\nA typical progression begins with contact that seems plausible — a claimed mutual friend, a shared class, an interest in common. It moves to small personal questions that establish familiarity: where you study, your schedule, who you live with. Rapport is then built over days or weeks, often with genuine warmth, and this is the stage that makes the pattern hard to see, because the interaction is enjoyable and nothing has gone wrong.\n\nThe escalation follows. A request to move the conversation to a different app, usually framed as more private, has a specific effect: it removes the reporting tools, the moderation, and the message history of the original platform. A request to meet alone, in a quiet place, on short notice, is the point at which the pattern becomes unambiguous.\n\nThree responses keep you in control at any stage. Verify before accepting — an account with no mutual connections, created recently, with little history and photographs that appear elsewhere online is worth declining, and reviewing who can see your own profile at the same time. Keep conversations on the platform where you started, since moving off it is a loss of protection, not an increase in privacy. And if you choose to meet someone you know only online, meet in a public place, bring a friend, and tell someone where you are going.\n\nDeclining requires no explanation and no justification. \"No thanks\" is a complete answer, and someone acting in good faith will accept it without pressure.",
      },
      {
        id: 'pressure-and-harassment',
        title: 'Pressure, Harassment, and How to Respond',
        content: "Online peer pressure is as real as its in-person equivalent and is often harder to resist, because it is visible, persistent, and recorded. Viral challenges are the common form — some are harmless, some cause genuine injury, and participation is frequently framed as proof of belonging. You do not need anyone's agreement to opt out. Choosing not to participate protects you, and it does not require approval from the group.\n\nCyberbullying is repeated behavior meant to humiliate or intimidate, and its distinguishing feature is persistence. It follows a person across platforms, arrives at any hour, and leaves a record others can see. If you witness it in a group chat, the right response is to leave the conversation and report it to a moderator or a trusted adult. Joining in extends it. Staying silent inside the group signals that the behavior is acceptable, and responding directly usually escalates it.\n\nIf you are being harassed, the sequence matters more than the speed. Preserve evidence first — screenshot the conversation, the profile, and any usernames and timestamps. Blocking is the correct next step, but doing it before capturing evidence can remove your access to the conversation, and evidence is what makes a report actionable. Then block, then report through the platform, and tell someone you trust: a trusted adult, a school counselor, or a moderator.\n\nA public callout may feel like the fairest response, but it works against you twice. It warns the account to delete itself and start over, and it exposes your own identity and situation to everyone reading the thread.\n\nIn the Philippines, online harassment and related offenses fall under the Cybercrime Prevention Act of 2012 (RA 10175), and the PNP Anti-Cybercrime Group accepts complaints from the public. Preserved screenshots and timestamps are exactly what those reports require.",
      },
      {
        id: 'summary',
        title: 'Summary',
        content: "Online safety comes down to controlling the pace of new interactions and knowing the steps in advance. Verify accounts before accepting them. Keep conversations on platforms with reporting tools. Decline without explanation whenever something feels wrong. When you meet someone from online, meet publicly, with a friend, and tell someone where you are.\n\nIf something does go wrong: screenshot first, then block, then report, then tell someone you trust. And it is worth repeating that if someone deceives you, that is their doing, not yours.\n\nYou've completed the Online Safety lesson. Next, you'll apply it in an interactive simulation involving a friend request from someone you don't recognize.",
      },
    ],
    bestPractices: [
      'Check a profile’s age, mutual connections, and post history before accepting a request from a stranger',
      'Keep conversations on the platform where they started, where reporting tools exist',
      'Decline anything that feels wrong — no explanation is required',
      'Meet someone from online only in a public place, with a friend, and tell someone where you are going',
      'Screenshot evidence before blocking, since blocking can remove access to the conversation',
      'Report harassment to the platform and tell a trusted adult, counselor, or moderator',
    ],
    keyTakeaways: [
      'Manipulation escalates gradually, which is exactly what makes the early stages easy to miss.',
      'Moving a conversation off-platform removes the reporting tools that protect you.',
      'Preserve evidence first, then block, then report — the order matters.',
    ],
    references: [
      { id: 'ref-01', title: 'StopBullying.gov — What Is Cyberbullying', link: 'https://www.stopbullying.gov/cyberbullying/what-is-it' },
      { id: 'ref-02', title: 'StopBullying.gov — How to Report Cyberbullying', link: 'https://www.stopbullying.gov/cyberbullying/how-to-report' },
      { id: 'ref-03', title: 'PNP Anti-Cybercrime Group — report cybercrime in the Philippines', link: 'https://acg.pnp.gov.ph/' },
    ],
  },

  scenario: onlineSafetyConfig,

  quiz: null,
}

export default onlineSafetyModuleData
