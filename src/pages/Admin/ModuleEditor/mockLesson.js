/**
 * mockLesson.js
 * Local mock content for the Module Content Editor — one realistic
 * cybersecurity lesson (Recognizing Phishing Emails). No Firestore.
 */

export const INITIAL_MODULE_TITLE = 'Recognizing Phishing Emails'

export const INITIAL_SECTIONS = [
  {
    id: 'sec-intro',
    title: 'Introduction',
    content:
      "Phishing remains one of the most common and effective cyberattack techniques used against individuals and organizations today. In this lesson, you'll learn how to recognize deceptive emails before they can trick you into revealing sensitive information or installing malicious software.",
    imageName: null,
    imagePreviewUrl: null,
    videoUrl: '',
    attachments: [],
    learningTip:
      'Phishing attacks succeed by exploiting trust and urgency — not technical skill. Awareness is your strongest defense.',
    importantNote:
      'This module assumes no prior technical background. All examples are explained in plain language.',
  },
  {
    id: 'sec-explanation',
    title: 'Explanation',
    content:
      'Phishing is a social engineering attack where a criminal impersonates a trusted entity — such as a bank, employer, or well-known service — to trick a victim into clicking a malicious link, downloading an infected attachment, or providing sensitive information like passwords or credit card numbers.\n\nModern phishing emails often mimic the branding, tone, and formatting of legitimate organizations closely enough to fool even careful readers at a glance.',
    imageName: null,
    imagePreviewUrl: null,
    videoUrl: '',
    attachments: [],
    learningTip:
      "Always check the sender's actual email address, not just the display name — attackers frequently spoof familiar names.",
    importantNote:
      'Phishing is not limited to email. The same techniques appear in SMS (smishing), phone calls (vishing), and social media messages.',
  },
  {
    id: 'sec-example',
    title: 'Real-World Example',
    content:
      'Imagine receiving an email that appears to be from your school\'s IT department with the subject line "Immediate Action Required: Your Account Will Be Suspended." The email asks you to click a link and log in within 24 hours to avoid losing access.\n\nThe link leads to a page that looks identical to your school\'s real login portal, but the URL is subtly different (for example, "tip-edu-ph.com" instead of "tip.edu.ph"). Entering your credentials there sends them directly to the attacker.',
    imageName: null,
    imagePreviewUrl: null,
    videoUrl: '',
    attachments: [],
    learningTip:
      'Hover over links before clicking to preview the actual destination URL — most email clients show this in a tooltip or status bar.',
    importantNote:
      'Legitimate organizations rarely threaten immediate account suspension over email. Urgency is a manipulation tactic, not standard IT practice.',
  },
  {
    id: 'sec-prevention',
    title: 'Prevention Tips',
    content:
      "• Verify the sender's email address carefully, not just the display name.\n• Never click links or download attachments from unexpected or urgent emails.\n• Type known website addresses directly into your browser instead of clicking email links.\n• Enable multi-factor authentication wherever it's available.\n• Report suspicious emails to your IT or security team instead of ignoring or forwarding them.",
    imageName: null,
    imagePreviewUrl: null,
    videoUrl: '',
    attachments: [],
    learningTip:
      'When in doubt, contact the organization directly using a phone number or website you already know to be legitimate — never one provided in the suspicious email.',
    importantNote:
      'No single tip guarantees safety. Combining habits — like MFA plus careful link verification — provides layered protection.',
  },
  {
    id: 'sec-summary',
    title: 'Summary',
    content:
      "Phishing attacks rely on impersonation, urgency, and trust to manipulate victims into acting without thinking carefully. By verifying senders, inspecting links before clicking, and reporting suspicious messages, you significantly reduce your risk of falling victim to these attacks.\n\nYou've now completed the Recognizing Phishing Emails lesson. In the next stage, you'll apply what you've learned in an interactive scenario.",
    imageName: null,
    imagePreviewUrl: null,
    videoUrl: '',
    attachments: [],
    learningTip:
      'Revisit this lesson periodically — phishing techniques evolve constantly, and refreshing your awareness keeps your instincts sharp.',
    importantNote:
      "This concludes the learning content. A scenario and quiz for this module will build on what you've studied here.",
  },
]
