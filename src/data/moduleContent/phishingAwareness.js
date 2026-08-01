import { phishingAwarenessConfig } from '../../features/scenario/configs/phishingAwareness.config'

/**
 * phishingAwareness.js
 * Mock module data for Phishing Awareness. Scenario content lives in
 * features/scenario/configs/phishingAwareness.config.js; lesson content
 * below is authored per SENTRI_Module_Content_Design.md.
 */
export const phishingAwarenessModuleData = {
  moduleId: 'phishing-awareness',
  title: 'Phishing Awareness',
  description: 'Recognize deceptive emails, messages, and websites designed to steal credentials or personal information.',
  difficulty: 'Beginner',
  previousModuleId: 'password-security',
  // Paste a YouTube video id (or leave empty) once the lesson video for
  // this module is ready — YouTubePlayer shows a placeholder until then.
  videoId: '',

  lesson: {
    objectives: [
      'Recognize the signals that identify a message as a phishing attempt',
      'Explain how fake login pages capture credentials',
      'Verify suspicious requests through channels an attacker does not control',
    ],
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: "Phishing is an attempt to trick you into handing over information voluntarily — usually a password, sometimes money, sometimes a verification code. It does not exploit a flaw in your device or your software. It exploits the reasonable assumption that a message which looks official is official.\n\nThat distinction matters. Antivirus software cannot stop you from typing your password into a convincing form. In this lesson you'll learn what phishing messages have in common, how a fake login page actually works, and the one verification habit that defeats nearly all of them.",
      },
      {
        id: 'why-it-matters',
        title: 'Why Phishing Awareness Matters',
        content: "Phishing is the most common way ordinary accounts get compromised, because it scales cheaply. Sending fifty thousand messages costs an attacker almost nothing, and a response rate well under one percent still makes it profitable.\n\nStudents are a deliberate target rather than incidental collateral. A school email address is publicly guessable from a name, and it is tied to enrollment records, grades, and increasingly to financial accounts and e-wallets. Attackers also know the academic calendar — messages about missing submissions, enrollment holds, and scholarship deadlines arrive precisely when you are most likely to react quickly instead of carefully.\n\nThe pressure is the point. Every phishing message is engineered to make you act before you evaluate.",
      },
      {
        id: 'anatomy',
        title: 'How to Read a Suspicious Message',
        content: "Phishing messages are unusual in that they leave consistent, checkable evidence. Five signals cover the overwhelming majority.\n\nThe sender's address, not the display name. A message can display \"Registrar's Office\" while originating from any address at all. What matters is the domain — the part after the @ symbol. An address ending in a domain that is not your school's real one is decisive, no matter how correct the rest looks.\n\nManufactured urgency. Deadlines measured in hours, threats of suspension, warnings that an account will be closed. Legitimate institutions do send time-sensitive notices, but they rarely make the deadline shorter than the time you would need to verify the message independently.\n\nA link whose text does not match its destination. Written link text is decorative. Hovering over a link on a computer, or holding it on a phone, reveals where it actually leads.\n\nA generic greeting. \"Dear Student\" or \"Dear Valued Customer\" from an organization that knows your name and student number suggests a message sent in bulk to a purchased list.\n\nAn attachment you did not expect. Particularly documents with unusual file extensions, which is covered in more depth in the Malware Awareness module.\n\nOne signal is a reason to slow down. Two or more is effectively conclusive.",
      },
      {
        id: 'common-tactics',
        title: 'Common Phishing Tactics',
        content: "Credential harvesting is the most frequent goal. You are sent to a page that copies a real login screen — often pixel for pixel, since the attacker can simply download the original page's design. Whatever you type is transmitted straight to the attacker, and the page then usually forwards you to the genuine site so that nothing appears to have gone wrong. The only reliable defense is checking the address bar before you type, because the page itself is designed to be indistinguishable.\n\nMalicious attachments deliver malware rather than steal credentials directly. If you receive an unexpected attachment from an unknown sender, do not open it to find out what it is. Report it and delete it — reporting an unopened attachment also protects everyone else who received the same message.\n\nReplying to ask is the trap most people fall into, because it feels cautious. It is not. Your reply goes to whoever sent the message, which may be the attacker, and it confirms that your address is live, monitored, and answered by a real person. That makes you a more valuable target, not a safer one.\n\nSpear phishing is the personalized variant — a message that names your professor, your section, or a course you are actually enrolled in. Details like these are often available publicly or from a previous breach. Personalization is evidence of research, not evidence of legitimacy.\n\nThe defense across all four is the same: verify through a channel the sender does not control. Call the office using a number from the official website, ask your professor in person or through the official course platform, or type the institution's address into your browser yourself. Any channel you obtain independently bypasses the attacker entirely. Any channel supplied by the suspicious message — its links, its phone numbers, its reply address — may lead right back to them.",
      },
      {
        id: 'summary',
        title: 'Summary',
        content: "Phishing works on attention rather than technology, which means the countermeasure is a habit rather than a tool. Check the sender's domain. Treat urgency as a warning sign rather than an instruction. Verify through a channel you found yourself. Report suspicious messages instead of replying to them.\n\nYou've completed the Phishing Awareness lesson. Next, you'll apply it in an interactive simulation where a message about a missing submission arrives in your inbox and you decide how to handle it.",
      },
    ],
    bestPractices: [
      'Check the sender’s full email address, not just the display name',
      'Hover over links to preview the destination before clicking',
      'Verify unexpected requests by contacting the organization through a number or website you looked up yourself',
      'Report suspicious messages instead of replying to them',
      'Never open unexpected attachments from unknown senders',
      'Type the address of important sites yourself rather than following emailed links',
    ],
    keyTakeaways: [
      'A mismatched sender domain is one of the most reliable signs of a phishing attempt.',
      'A fake login page exists for one purpose: to capture whatever you type into it.',
      'Verifying through a channel you found yourself is the only check an attacker cannot fake.',
    ],
    references: [
      { id: 'ref-01', title: 'CISA — Recognize and Report Phishing', link: 'https://www.cisa.gov/secure-our-world/recognize-and-report-phishing' },
      { id: 'ref-02', title: 'PNP Anti-Cybercrime Group — report cybercrime in the Philippines', link: 'https://acg.pnp.gov.ph/' },
    ],
  },

  scenario: phishingAwarenessConfig,

  quiz: null,
}

export default phishingAwarenessModuleData
