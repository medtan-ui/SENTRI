/**
 * modulePretestContent.js
 * Authored seed content for each module's pre-test — 8 baseline
 * multiple-choice questions a student answers once, before their first
 * lesson, so their prior knowledge can be compared against the same
 * instrument re-administered at the end of the curriculum.
 *
 * No settings block (no passing score / attempts / time limit): a
 * pre-test has no pass/fail concept, only "completed or not".
 *
 * These items are also where the end-of-curriculum final assessment's
 * question bank is seeded from (see src/data/finalAssessmentContent.js).
 * That reuse is the point: a normalized learning gain is only meaningful
 * when the before and after measurements use the same instrument. There
 * used to be a per-module post-test doing the same job six times, minutes
 * after each lesson; it was replaced by one test at the end.
 *
 * ── Topic tagging ────────────────────────────────────────────────────
 * Every item carries a `topic`. That is what makes per-topic mastery and
 * item analysis possible: the analytics layer groups responses by topic
 * to report which specific ideas moved between pre and post, rather than
 * only reporting a single module-level score.
 *
 * Note that 'public-wifi' appears in *both* Safe Browsing and Online
 * Safety. That overlap is intentional and load-bearing: it is the one
 * topic measured in two different modules, which is what makes
 * cross-module transfer analysis computable at all.
 *
 * This is the lazy-seed value src/services/assessmentService.js seeds into
 * Firestore's modulePretests/{moduleId} on first read, so once seeded the
 * document is authoritative and this file is never read again for that
 * module.
 */

let choiceCounter = 0
function choice(text) {
  choiceCounter += 1
  return { id: `pretest-choice-${choiceCounter}`, text }
}

// Rotates each question's choice order by an incrementing offset before
// assigning ids, so the correct answer doesn't cluster at the same
// position across every question (all 30 were authored with the correct
// answer mostly at index 1) — the rotation preserves each choice's actual
// text, it only changes display order, so content stays accurate.
let rotationCounter = 0
function rotate(arr, offset) {
  const n = arr.length
  const shift = ((offset % n) + n) % n
  return arr.slice(shift).concat(arr.slice(0, shift))
}

function question(text, choiceTexts, correctIndex, explanation, topic) {
  const offset = rotationCounter % choiceTexts.length
  rotationCounter += 1
  const rotatedTexts = rotate(choiceTexts, offset)
  const rotatedCorrectIndex = ((correctIndex - offset) % choiceTexts.length + choiceTexts.length) % choiceTexts.length
  const choices = rotatedTexts.map((t) => choice(t))
  return {
    id: `pretest-${choices[0].id}`,
    text,
    choices,
    correctChoiceId: choices[rotatedCorrectIndex].id,
    explanation,
    topic,
  }
}

/**
 * Human-readable labels for every topic used above, so the analytics
 * dashboard can name a topic without re-deriving it from a slug.
 */
export const TOPIC_LABELS = {
  'password-strength': 'Password strength',
  'password-reuse': 'Password reuse',
  mfa: 'Multi-factor authentication',
  'credential-attacks': 'Credential attacks',
  'breach-response': 'Breach response',

  'phishing-basics': 'What phishing is',
  'phishing-red-flags': 'Phishing red flags',
  'link-verification': 'Verifying links',
  'attachment-handling': 'Handling attachments',
  'social-engineering-tactics': 'Social engineering tactics',

  'malware-basics': 'What malware is',
  ransomware: 'Ransomware',
  'download-sources': 'Trusted download sources',
  patching: 'Updates and patching',
  'removable-media': 'Removable media',

  'https-misconceptions': 'HTTPS misconceptions',
  'public-wifi': 'Public Wi-Fi risk',
  'scam-sites': 'Recognizing scam sites',
  'fake-updates': 'Fake update prompts',
  'network-protection': 'Protecting network traffic',

  'privacy-basics': 'What data privacy is',
  'app-permissions': 'App permissions',
  oversharing: 'Oversharing online',
  'data-brokers': 'Data collection and brokers',
  'privacy-habits': 'Everyday privacy habits',

  cyberbullying: 'Responding to cyberbullying',
  'stranger-contact': 'Contact from strangers',
  'peer-pressure': 'Online peer pressure',
  'harassment-response': 'Responding to harassment',
}

/** Exported so the final assessment can assemble its item bank from these
 * same six banks — see src/data/finalAssessmentContent.js for why that
 * matters to the normalized-gain claim. Treat as read-only; every consumer
 * deep-copies before handing it out. */
export const MODULE_PRETESTS = {
  'password-security': {
    moduleId: 'password-security',
    title: 'Password Security — Pre-Test',
    questions: [
      question(
        'What generally makes a password stronger?',
        ['Adding a symbol like "!" at the end', 'Being long and unique', 'Being easy to say out loud', 'Using your birth year'],
        1,
        'Length and uniqueness matter far more than a single substituted symbol.',
        'password-strength',
      ),
      question(
        'Is it safe to reuse the same password across multiple accounts?',
        ['Yes, as long as it is long', 'No — one breach can expose every account that reused it', 'Yes, if the accounts are unrelated', 'Only for unimportant accounts'],
        1,
        'Reusing a password means a single leak can be tried against every other account using it.',
        'password-reuse',
      ),
      question(
        'What does multi-factor authentication (MFA) add?',
        ['A stronger password automatically', 'A second layer of proof beyond your password', 'Faster login times', 'Unlimited password resets'],
        1,
        'MFA requires a second factor — like a code on your phone — so a stolen password alone is not enough to log in.',
        'mfa',
      ),
      question(
        'What is "credential stuffing"?',
        ['Guessing passwords one character at a time', 'Trying leaked username/password pairs against other sites', 'A type of firewall', 'A way to recover a forgotten password'],
        1,
        'Credential stuffing automates trying passwords leaked from one breach against many other services.',
        'credential-attacks',
      ),
      question(
        'What should you do first if a service you use reports a data breach?',
        ['Nothing, breaches are common', 'Change your password for that service right away', 'Delete the account without changing anything', 'Wait a few months'],
        1,
        'Changing the password immediately limits how long a possibly-leaked credential stays useful to an attacker.',
        'breach-response',
      ),
      question(
        'Why is a multi-word passphrase like "sunset-coffee-bridge-winter" strong against brute-force attacks?',
        ['It uses dictionary words that are easy to guess', 'Its substantial length creates exponentially more combinations for attackers to test', 'It requires an internet connection to decrypt', 'It expires automatically after 30 days'],
        1,
        'Length provides exponential combinatorial strength against automated password-cracking software.',
        'password-strength',
      ),
      question(
        'Why is using an authenticator app generally more secure than receiving 2FA codes via SMS text message?',
        ['Authenticator apps do not need phone batteries', 'SMS messages can be intercepted or stolen through SIM swapping attacks', 'SMS text messages cost money to send', 'Authenticator apps can only be used on computers'],
        1,
        'SMS-based 2FA is susceptible to SIM-swapping and carrier interception, whereas app-based TOTP tokens remain stored securely on your device.',
        'mfa',
      ),
      question(
        'What is the main security advantage of using a reputable password manager?',
        ['It allows you to use one simple password everywhere', 'It generates and securely stores unique, complex passwords for every single service', 'It eliminates the need for two-factor authentication', 'It prevents all phishing websites automatically'],
        1,
        'Password managers solve password reuse by creating and remembering distinct, high-entropy passwords for all your accounts.',
        'password-reuse',
      ),
    ],
  },

  'phishing-awareness': {
    moduleId: 'phishing-awareness',
    title: 'Phishing Awareness — Pre-Test',
    questions: [
      question(
        'What is phishing?',
        ['A firewall misconfiguration', 'A fraudulent attempt to trick someone into revealing sensitive information', 'A type of antivirus scan', 'A slow internet connection'],
        1,
        'Phishing impersonates a trusted sender to trick you into giving up credentials or clicking a malicious link.',
        'phishing-basics',
      ),
      question(
        'Which is a common red flag in a phishing email?',
        ['A sender address that does not match the real company', 'A short subject line', 'A company logo', 'A greeting with your name'],
        0,
        'A mismatched sender address is one of the most reliable signs of a spoofed email.',
        'phishing-red-flags',
      ),
      question(
        'Is it safe to click a link in an urgent "verify your account now" email?',
        ['Yes, urgency means it is important', 'No — verify through a separately-trusted channel first', 'Yes, if the email looks professional', 'Only if it has your name in it'],
        1,
        'Urgency is a manipulation tactic — verifying through a channel you already trust is much safer.',
        'link-verification',
      ),
      question(
        'What should you do with an unexpected attachment from an unknown sender?',
        ['Open it to see what it is', 'Avoid opening it and report it', 'Forward it to a coworker first', 'Save it for later'],
        1,
        'Reporting an unopened suspicious attachment protects you and anyone else who received the same email.',
        'attachment-handling',
      ),
      question(
        'Why do phishing emails often create a sense of urgency?',
        ['It is required by email providers', 'To pressure you into acting before you think it through', 'To make the email load faster', 'It has no real purpose'],
        1,
        'Urgency pushes victims to act quickly, before they can carefully evaluate the request.',
        'social-engineering-tactics',
      ),
      question(
        'What distinguishes "spear phishing" from ordinary mass phishing emails?',
        ['Spear phishing only targets government agencies', 'Spear phishing is tailored with specific personal or organizational details to deceive a targeted individual', 'Spear phishing never contains links or attachments', 'Spear phishing is sent exclusively through physical postal mail'],
        1,
        'Spear phishing leverages researched personal or job-related information to make fraudulent communications appear genuine.',
        'social-engineering-tactics',
      ),
      question(
        'How can you safely inspect the true destination of a hyperlink in an email before clicking it?',
        ['Click it and quickly close the browser tab', 'Hover your cursor over the link to preview the actual destination URL in the status bar or tooltip', 'Right-click and bookmark the link', 'Reply to the sender asking where it leads'],
        1,
        'Hovering allows you to inspect the real destination domain without triggering any network requests to the target server.',
        'link-verification',
      ),
      question(
        'Which attachment file extension typically presents the highest immediate risk of executing malware?',
        ['A plain text file (.txt)', 'An executable or macro script file (.exe, .scr, or .vbs)', 'An image file (.png)', 'An audio file (.mp3)'],
        1,
        'Executable binaries and script extensions can directly run malicious instructions on your operating system upon opening.',
        'attachment-handling',
      ),
    ],
  },

  'malware-awareness': {
    moduleId: 'malware-awareness',
    title: 'Malware Awareness — Pre-Test',
    questions: [
      question(
        'What is malware?',
        ['Software that speeds up your computer', 'Malicious software designed to damage, steal, or hold data hostage', 'A built-in Windows tool', 'A type of web browser'],
        1,
        'Malware is a broad category covering viruses, ransomware, trojans, and spyware.',
        'malware-basics',
      ),
      question(
        'What is ransomware?',
        ['Malware that locks your files and demands payment', 'A discount coupon scam', 'Free antivirus software', 'A password manager'],
        0,
        'Ransomware encrypts a victim\'s files and demands payment for the (unguaranteed) key to unlock them.',
        'ransomware',
      ),
      question(
        'Is downloading free software from an unofficial website risky?',
        ['No, free is always safe', 'Yes — it is often bundled with malware', 'Only on old computers', 'Only if you have no antivirus'],
        1,
        'Unofficial download sources frequently bundle malicious software alongside the free tool being offered.',
        'download-sources',
      ),
      question(
        'What is one of the best defenses against malware?',
        ['Never restarting your computer', 'Keeping your software and operating system updated', 'Disabling your internet permanently', 'Using the same password everywhere'],
        1,
        'Updates close the security holes that malware relies on to spread.',
        'patching',
      ),
      question(
        'What should you do if you find an unknown USB drive?',
        ['Plug it in to see who owns it', 'Give it to IT without plugging it in', 'Use it for personal storage', 'Format it immediately yourself'],
        1,
        'Unknown USB drives are a known malware delivery method — IT can inspect them safely.',
        'removable-media',
      ),
      question(
        'What is spyware designed to do without the computer owner\'s knowledge?',
        ['Speed up hard drive performance', 'Quietly monitor keystrokes, browsing habits, and credentials to send to an attacker', 'Display harmless desktop wallpaper notifications', 'Optimize operating system battery health'],
        1,
        'Spyware stealthily tracks sensitive user inputs, web sessions, and saved passwords to exfiltrate to malicious operators.',
        'malware-basics',
      ),
      question(
        'Why is applying operating system and software security patches promptly so critical?',
        ['Patches always add new graphical themes', 'Patches fix discovered security flaws before attackers can exploit them', 'Software companies disable devices that miss an update', 'Patches clean all temporary browser cookies'],
        1,
        'Unpatched software leaves known security holes open to exploitation by automated malware tools.',
        'patching',
      ),
      question(
        'Why are isolated, offline backups essential for recovering from a ransomware infection?',
        ['Offline backups load web pages faster', 'Ransomware cannot reach or encrypt storage media physically disconnected from the network', 'Cloud backups are always corrupted by firewalls', 'Offline backups delete the virus automatically'],
        1,
        'An offline (air-gapped) backup guarantees a clean, unencrypted copy of your critical data that the malware could not access.',
        'ransomware',
      ),
    ],
  },

  'safe-browsing': {
    moduleId: 'safe-browsing',
    title: 'Safe Browsing — Pre-Test',
    questions: [
      question(
        'Does seeing "HTTPS" and a padlock mean a website is completely safe?',
        ['Yes, always', 'No — it only means the connection is encrypted, not that the site is trustworthy', 'It means the site is government-approved', 'It means the site has no ads'],
        1,
        'HTTPS encrypts the connection, but attackers can obtain valid certificates for malicious sites too.',
        'https-misconceptions',
      ),
      question(
        'Is public Wi-Fi safe for logging into sensitive accounts without protection?',
        ['Yes, always', 'No — traffic can potentially be intercepted by others on the network', 'Only at coffee shops', 'Only if the network has a password'],
        1,
        'Open or shared networks make it easier for others on the same Wi-Fi to intercept unencrypted traffic.',
        'public-wifi',
      ),
      question(
        'What is a common warning sign of a scam shopping website?',
        ['Extreme discounts like 90% off on an unfamiliar site', 'A visible contact page', 'Product photos', 'A working search bar'],
        0,
        'Unrealistic discounts on unfamiliar sites are a common tactic used to harvest payment details.',
        'scam-sites',
      ),
      question(
        'What should you do about an unexpected "your browser is out of date" pop-up with a download button?',
        ['Click it immediately to stay safe', 'Avoid clicking it — it is a common malware trick', 'Restart your computer instead', 'Ignore it, it will go away in a week'],
        1,
        'Fake update pop-ups are a common way to trick visitors into downloading malware.',
        'fake-updates',
      ),
      question(
        'What helps protect sensitive logins while using public Wi-Fi?',
        ['A VPN or a trusted, private network', 'A stronger Wi-Fi password only', 'Using an older browser', 'Disabling your antivirus'],
        0,
        'A VPN or trusted network protects sensitive traffic from others who may share the same public Wi-Fi.',
        'network-protection',
      ),
      question(
        'What does a browser certificate error such as "Your connection is not private" typically warn you about?',
        ['Your monitor display resolution is too low', 'The web server identity cannot be verified or the connection might be intercepted', 'The website has too many animated images', 'Your home Wi-Fi router is turned off'],
        1,
        'Certificate errors indicate potential man-in-the-middle attacks, invalid encryption, or expired domain credentials.',
        'https-misconceptions',
      ),
      question(
        'What is "typosquatting" (URL hijacking)?',
        ['Registering misspelled variants of popular domain names to mislead visitors to fake sites', 'Typing a search query too quickly in a search engine', 'Purchasing domain names for non-profit organizations', 'A tool used by web designers to test typography'],
        1,
        'Attackers register common spelling errors of popular sites (e.g., paypa1.com or examp1e.com) to catch accidental mistypes.',
        'scam-sites',
      ),
      question(
        'Why should you avoid accessing sensitive accounts on open, password-free public Wi-Fi hotspots without a VPN?',
        ['Public Wi-Fi networks disconnect every five minutes', 'Unencrypted local network traffic can be monitored or spoofed by other devices on the same access point', 'Public Wi-Fi charges hidden fees per website visited', 'Search engines block all searches on public Wi-Fi'],
        1,
        'Open access points allow malicious peers on the same wireless network to analyze broadcast packets or launch spoofing attacks.',
        'public-wifi',
      ),
    ],
  },

  'data-privacy': {
    moduleId: 'data-privacy',
    title: 'Data Privacy — Pre-Test',
    questions: [
      question(
        'What is data privacy primarily concerned with?',
        ['Making apps load faster', 'Protecting personal information from unauthorized access or misuse', 'Increasing storage space', 'Blocking all advertising'],
        1,
        'Data privacy is about controlling who can access, use, or misuse your personal information.',
        'privacy-basics',
      ),
      question(
        'Should an app always be granted every permission it requests?',
        ['Yes, apps need full access to work', 'No — only permissions the app actually needs for its function', 'Yes, if it is a popular app', 'Only on new phones'],
        1,
        'Many apps request more access than they need — granting only what is necessary limits data exposure.',
        'app-permissions',
      ),
      question(
        'What is a risk of oversharing personal details on social media?',
        ['It can give attackers information useful for scams or impersonation', 'It uses more phone storage', 'It slows down the app', 'There is no real risk'],
        0,
        'Details like routines, travel plans, or family info can be pieced together and used against you.',
        'oversharing',
      ),
      question(
        'Can data collected by a free app ever be sold to other companies?',
        ['No, that would be illegal everywhere', 'Yes — this happens and is a real risk to be aware of', 'Only for banking apps', 'Only if you pay for the app'],
        1,
        'Some apps monetize by selling collected data to third parties like data brokers.',
        'data-brokers',
      ),
      question(
        'What is a good everyday privacy habit?',
        ['Never using any apps at all', 'Periodically reviewing app permissions and privacy settings', 'Sharing your location publicly for convenience', 'Using the same password for every account'],
        1,
        'Regularly auditing permissions and privacy settings limits what apps and services can collect over time.',
        'privacy-habits',
      ),
      question(
        'Which of the following is categorized as sensitive Personally Identifiable Information (PII)?',
        ['Your favorite movie genre', 'Your government ID number, banking credentials, and medical history', 'The current weather forecast in your city', 'A public library open hours schedule'],
        1,
        'Sensitive PII comprises data that directly identifies an individual and presents serious identity theft or fraud risks if compromised.',
        'privacy-basics',
      ),
      question(
        'What hidden metadata (EXIF data) is frequently stored in digital photos taken on smartphones?',
        ['The brand of printer connected to the phone', 'Precise GPS location coordinates and timestamp information', 'The names of everyone appearing in the photo', 'The home Wi-Fi password of the user'],
        1,
        'EXIF tags embedded in smartphone photos often store accurate geographic coordinates and device timestamps, revealing where you were.',
        'oversharing',
      ),
      question(
        'What is the main function of third-party tracking cookies across multiple websites?',
        ['Storing the website color scheme', 'Constructing detailed behavioral profiles of your browsing habits across different web domains', 'Speeding up internet connection bandwidth', 'Encrypting your computer hard drive'],
        1,
        'Third-party tracking cookies follow users across diverse websites to aggregate personal interests and consumer profiles.',
        'data-brokers',
      ),
    ],
  },

  'online-safety': {
    moduleId: 'online-safety',
    title: 'Online Safety — Pre-Test',
    questions: [
      // Tagged 'public-wifi' on purpose — the same topic Safe Browsing
      // measures. This single shared item is what lets the analytics
      // layer ask whether a Safe Browsing idea transferred to a later,
      // differently-framed module.
      question(
        'Is public Wi-Fi equally safe for all everyday browsing?',
        ['Yes, always', 'It is riskier for sensitive tasks like logins or banking', 'It is only unsafe for gaming', 'It is only unsafe on phones'],
        1,
        'Public Wi-Fi is generally fine for casual browsing but riskier for anything sensitive without extra protection.',
        'public-wifi',
      ),
      question(
        'What should you do if you witness cyberbullying in a group chat?',
        ['Join in since others are doing it', 'Leave and report it to a trusted adult or moderator', 'Ignore it completely', 'Share it with more people'],
        1,
        'Reporting gives someone with authority the chance to step in and stop the harm.',
        'cyberbullying',
      ),
      question(
        'How should you handle a friend request from a stranger with no mutual connections?',
        ['Accept it to be polite', 'Be cautious — consider declining or reviewing your visibility settings', 'Share your full profile with them right away', 'Ask them for personal details first'],
        1,
        'Being cautious with unknown requests reduces exposure to accounts with no real connection to you.',
        'stranger-contact',
      ),
      question(
        'Is peer pressure encountered online less impactful than peer pressure in person?',
        ['Yes, online pressure is not real', 'No — it can push someone toward unsafe choices just as effectively', 'Yes, because you cannot see the other person', 'It only affects adults'],
        1,
        'Peer pressure online can be just as influential as in-person pressure, and just as risky to give in to.',
        'peer-pressure',
      ),
      question(
        'What is a good first step if you are being harassed online?',
        ['Respond angrily to defend yourself', 'Report it to a trusted adult or platform moderator', 'Delete all your accounts immediately', 'Keep it to yourself'],
        1,
        'Reporting to a trusted adult or moderator gets help involved rather than escalating things alone.',
        'harassment-response',
      ),
      question(
        'What is "catfishing" in the context of online relationships and social platforms?',
        ['Catching fish using specialized digital sensors', 'Fabricating a false online identity to deceive, exploit, or emotionally manipulate another person', 'Reporting abusive spam comments on social media', 'Setting up multiple email addresses for school'],
        1,
        'Catfishing involves adopting a deceptive online persona with stolen photos or false information to manipulate victims.',
        'stranger-contact',
      ),
      question(
        'Why should you remember that "private" group messages and photos can easily become public?',
        ['Computers delete all group chats after twenty-four hours', 'Any chat participant can take screenshots, download media, or forward messages to anyone outside the group', 'Messaging apps automatically publish group chats to web search engines', 'Private chats can only be viewed on desktop computers'],
        1,
        'Recipients have full capability to copy, screenshot, or distribute content you shared, eliminating any guarantee of secrecy.',
        'cyberbullying',
      ),
      question(
        'What is an effective way to protect your personal safety on online gaming platforms?',
        ['Giving out your home address so other players can send gifts', 'Using a pseudonym, keeping voice lobbies friend-only, and never sharing your school or location', 'Allowing all players to view your phone number in your profile', 'Clicking any game credit links posted by unfamiliar players in lobby chats'],
        1,
        'Maintaining pseudonymity and withholding identifying details keeps gaming accounts and real-world safety protected.',
        'stranger-contact',
      ),
    ],
  },
}

/**
 * getDefaultPretest
 * The authored seed for a module's pre-test — consumed by
 * src/services/assessmentService.js as the lazy-seed value on a Firestore
 * document's first read. Never mutated.
 * @param {string} moduleId
 * @returns {{moduleId:string, title:string, questions:Array} | null}
 */
export function getDefaultPretest(moduleId) {
  const seed = MODULE_PRETESTS[moduleId]
  return seed ? JSON.parse(JSON.stringify(seed)) : null
}
