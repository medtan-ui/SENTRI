/**
 * mockLessonContent.js
 * Seed content for the Lesson Content Editor, keyed by the same module
 * ids used across Curriculum Management / Module Configuration. Local
 * mock data only — no Firestore.
 */

export const LESSON_CONTENT = {
  'password-security': {
    introduction:
      'Passwords remain the first line of defense for nearly every online account. This lesson covers what makes a password strong, why reuse is dangerous, and how tools like password managers make good habits easy to maintain.',
    objectives: [
      'Understand what makes a password strong',
      'Recognize common password attacks',
      'Apply password best practices in daily use',
    ],
    lessonContent:
      'A strong password is long, unique, and unpredictable — length matters more than complexity alone. A 16-character passphrase built from random words is often stronger and easier to remember than an 8-character password full of substituted symbols.\n\nReusing the same password across multiple accounts means a single breach can compromise everything tied to it. Attackers routinely take leaked credentials from one breach and try them against other popular services — a technique called credential stuffing.\n\nPassword managers solve this by generating and storing a unique password for every account, so you only need to remember one master password. Multi-factor authentication (MFA) adds a second layer of protection, requiring a code or approval from a separate device even if a password is stolen.',
    realWorldExample:
      'In 2023, a major streaming service reported that thousands of accounts were compromised — not through a breach of their own systems, but because users had reused passwords leaked from an unrelated data breach years earlier. Attackers used automated tools to try millions of leaked username/password pairs against the login page, successfully accessing any account that reused a compromised password.',
    bestPractices: [
      'Enable multi-factor authentication (MFA)',
      'Use a password manager',
      'Never reuse passwords across accounts',
      'Use passphrases of 4-5 random words instead of short complex passwords',
    ],
    keyTakeaways: [
      'Strong passwords protect accounts from unauthorized access.',
      'Never share or reuse passwords across services.',
      'Password managers and MFA together provide layered protection.',
    ],
    references: [
      { id: 'ref-01', title: 'NIST Digital Identity Guidelines', link: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
      { id: 'ref-02', title: 'Have I Been Pwned — check for breached credentials', link: 'https://haveibeenpwned.com' },
    ],
  },
  'phishing-awareness': {
    introduction:
      'Phishing emails are designed to look legitimate while tricking you into giving up credentials or clicking malicious links. This lesson teaches you to spot the warning signs before you become a victim.',
    objectives: [
      'Identify common characteristics of phishing emails',
      'Understand why phishing attacks succeed',
      'Apply verification steps before clicking links or entering credentials',
    ],
    lessonContent:
      "Phishing attacks impersonate trusted senders — banks, employers, or well-known services — to create a false sense of urgency. Common signs include mismatched sender addresses, generic greetings, spelling errors, and links that don't match the claimed destination.\n\nAttackers often pressure victims to act quickly, before they have time to think critically about the request. Modern phishing emails increasingly mimic real branding and tone closely enough to fool even careful readers at a glance.\n\nSpear phishing takes this further by targeting a specific person using information gathered from social media or previous breaches, making the message feel personally relevant and harder to dismiss.",
    realWorldExample:
      "An employee receives an email that appears to be from the IT department with the subject \"Immediate Action Required: Your Account Will Be Suspended.\" The email asks them to click a link and log in within 24 hours. The link leads to a page that looks identical to the real login portal, but the URL is subtly different. Entering credentials there sends them directly to the attacker.",
    bestPractices: [
      "Check the sender's actual email address, not just the display name",
      'Hover over links before clicking to preview the real destination',
      'Contact the organization directly using a known number or website',
      'Report suspicious emails instead of just deleting them',
    ],
    keyTakeaways: [
      'Phishing relies on urgency and impersonation, not technical skill.',
      'Always verify a request through a separate, trusted channel.',
      'Reporting phishing attempts helps protect the whole organization.',
    ],
    references: [
      { id: 'ref-01', title: 'CISA — Avoiding Social Engineering and Phishing Attacks', link: 'https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks' },
      { id: 'ref-02', title: 'Anti-Phishing Working Group', link: 'https://apwg.org' },
    ],
  },
  'malware-awareness': {
    introduction:
      'Malware includes viruses, ransomware, trojans, and spyware — malicious software designed to damage, steal, or hold your data hostage. This lesson explains how infections spread and how to avoid them.',
    objectives: [
      'Distinguish between common types of malware',
      'Recognize how malware typically spreads',
      'Respond correctly to a suspected infection',
    ],
    lessonContent:
      'Most malware infections start with a user action: opening an infected attachment, downloading pirated software, or clicking a malicious ad. Once installed, malware can log keystrokes, encrypt files for ransom, or quietly steal data in the background.\n\nRansomware in particular has become one of the most damaging forms of malware, locking victims out of their own files until a ransom is paid — with no guarantee the files will actually be restored. Keeping software updated closes the security holes that malware relies on to spread.',
    realWorldExample:
      "A staff member downloads a 'free' version of paid design software from an unofficial website. The installer secretly bundles ransomware, which encrypts every file on the shared network drive overnight. By morning, the entire department is locked out of years of project files, and the attacker demands payment in cryptocurrency to restore access.",
    bestPractices: [
      'Only download software from official, trusted sources',
      'Keep your operating system and applications updated',
      'Back up important files regularly',
      "Don't open attachments from unknown or unexpected senders",
    ],
    keyTakeaways: [
      'Malware often spreads through a single careless click.',
      'Regular backups are the best defense against ransomware.',
      'Keeping software updated closes the gaps malware exploits.',
    ],
    references: [
      { id: 'ref-01', title: 'CISA — Ransomware Guidance', link: 'https://www.cisa.gov/stopransomware' },
      { id: 'ref-02', title: 'No More Ransom Project', link: 'https://www.nomoreransom.org' },
    ],
  },
  'safe-browsing': {
    introduction:
      'Not every website is safe to visit or enter information into. This lesson covers how to recognize malicious sites and browse the web with confidence.',
    objectives: [
      'Recognize signs of an unsafe website',
      'Understand what HTTPS does and does not guarantee',
      'Avoid common browsing traps like pop-ups and fake downloads',
    ],
    lessonContent:
      "A secure connection (indicated by HTTPS and a padlock icon) encrypts data between your browser and the website, but it doesn't guarantee the site itself is trustworthy — attackers can obtain valid certificates too. Malicious sites often use lookalike domains, pop-up warnings, or fake download buttons to trick visitors.\n\nBrowser extensions and outdated software can also introduce risk even on otherwise legitimate sites, since a compromised extension can intercept data on every page you visit.",
    realWorldExample:
      "A student searches for a free PDF converter and clicks the first result. The site displays a fake \"Your browser is out of date\" warning with a prominent download button. Clicking it downloads a program that installs adware and a browser hijacker, redirecting search results to sponsored, sometimes malicious, pages.",
    bestPractices: [
      "Look for HTTPS, but don't rely on it alone to judge trustworthiness",
      'Type known website addresses directly instead of following links blindly',
      'Avoid clicking pop-ups or unexpected download prompts',
      'Keep your browser and extensions up to date',
    ],
    keyTakeaways: [
      'HTTPS encrypts a connection but does not guarantee the site is safe.',
      'Unexpected pop-ups and download prompts are common attack vectors.',
      'Careful URL checking prevents most drive-by malware downloads.',
    ],
    references: [
      { id: 'ref-01', title: 'Google Safe Browsing', link: 'https://safebrowsing.google.com' },
      { id: 'ref-02', title: 'EFF — Surveillance Self-Defense', link: 'https://ssd.eff.org' },
    ],
  },
  'data-privacy': {
    introduction:
      "Every app and website you use collects some amount of personal data. This lesson helps you understand what's being collected and how to limit your exposure.",
    objectives: [
      'Understand what personal data is commonly collected online',
      'Review and adjust privacy settings across apps and services',
      'Apply data minimization habits in everyday use',
    ],
    lessonContent:
      'Personal data collection ranges from account details to location history and browsing behavior. This data can be used for legitimate purposes like personalization, but it can also be sold, leaked, or misused by third parties.\n\nMany apps request far more access than they need to function — a flashlight app requesting contact list access, for example. Understanding privacy settings and permissions lets you control what you share and with whom, rather than accepting defaults that favor data collection.',
    realWorldExample:
      "A student installs a popular mobile game that requests access to contacts, microphone, and precise location — none of which the game needs to function. Months later, a data broker report reveals the game's developer sold location data to third parties, allowing an unrelated company to build a detailed map of the student's daily movements.",
    bestPractices: [
      'Review app permissions and disable anything not essential',
      'Adjust privacy settings on social media to limit public visibility',
      'Periodically audit which apps and services have account access',
      'Understand the difference between data collection and data selling',
    ],
    keyTakeaways: [
      'Most apps request more data access than they actually need.',
      'Privacy settings are rarely set to the most protective option by default.',
      'Small, regular privacy audits reduce long-term data exposure.',
    ],
    references: [
      { id: 'ref-01', title: 'EFF — Privacy Basics', link: 'https://www.eff.org/issues/privacy' },
      { id: 'ref-02', title: 'Data Privacy Framework (US)', link: 'https://www.dataprivacyframework.gov' },
    ],
  },
  'online-safety': {
    introduction:
      'From social media to public Wi-Fi, everyday internet use comes with everyday risks. This lesson covers foundational habits for staying safe online.',
    objectives: [
      'Identify risks specific to public Wi-Fi and shared networks',
      'Practice safe social media sharing habits',
      'Maintain good device security hygiene',
    ],
    lessonContent:
      'Public Wi-Fi networks are often unencrypted, making it easier for attackers on the same network to intercept traffic — including passwords entered on non-secure pages. Oversharing on social media can expose information useful to attackers, such as answers to security questions or your daily routine.\n\nGood device hygiene rounds out a safe everyday online presence: screen locks, updated software, and cautious app installs all reduce the number of ways an attacker could gain access to your accounts or devices.',
    realWorldExample:
      "While working from a coffee shop, a freelancer connects to the shop's open Wi-Fi and logs into a client's project management tool without a VPN. An attacker running a packet-sniffing tool on the same network captures the login session, later using it to access confidential client files.",
    bestPractices: [
      'Use a VPN when connecting to public Wi-Fi for anything sensitive',
      'Limit personal details shared publicly on social media',
      'Keep devices locked and software updated',
      'Set up device tracking and remote wipe in case of loss or theft',
    ],
    keyTakeaways: [
      'Public Wi-Fi should not be trusted with sensitive logins without a VPN.',
      'Oversharing online can give attackers what they need for social engineering.',
      'Basic device hygiene prevents many common everyday attacks.',
    ],
    references: [
      { id: 'ref-01', title: 'StaySafeOnline — National Cybersecurity Alliance', link: 'https://staysafeonline.org' },
      { id: 'ref-02', title: 'FTC — Online Safety Tips', link: 'https://consumer.ftc.gov/features/protect-your-online-privacy' },
    ],
  },
}
