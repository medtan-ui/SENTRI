/**
 * quizConfigService.js
 *
 * Authored seed content for the admin Quiz Configuration feature — the
 * initial value every moduleQuizzes/{moduleId} Firestore document is
 * lazily seeded with on its first read (see src/services/quizService.js),
 * and what "Reset to Defaults" reverts a draft to. Real persistence now
 * lives in quizService/Firestore; this file only owns the mock content.
 *
 * There is no student-side Quiz Engine yet — this service only prepares
 * the QuizConfig shape a future one would consume.
 */

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

let choiceCounter = 0
function choice(text) {
  choiceCounter += 1
  return { id: `choice-${choiceCounter}`, text }
}

function question(text, choiceTexts, correctIndex, explanation, difficulty) {
  const choices = choiceTexts.map((t) => choice(t))
  return {
    id: choices[0].id.replace('choice-', 'question-seed-') + `-${text.slice(0, 6)}`,
    text,
    choices,
    correctChoiceId: choices[correctIndex].id,
    explanation,
    difficulty,
  }
}

function withOrder(questions) {
  return questions.map((q, index) => ({ order: index + 1, ...q }))
}

function buildDefaultSettings(passingScore, title) {
  return {
    title,
    settings: {
      passingScore,
      timeLimitMinutes: 15,
      maxAttempts: 3,
      instructions:
        'Answer every question to the best of your ability. You need a passing score to complete this module.',
      available: true,
    },
  }
}

const passwordSecurityDefaults = {
  moduleId: 'password-security',
  ...buildDefaultSettings(80, 'Password Security Knowledge Check'),
  questions: withOrder([
    question(
      'Which of the following is the strongest password?',
      ['password123', 'Tr0ub4dor&3', 'correct-horse-battery-staple-42', 'P@ssw0rd'],
      2,
      'Length and unpredictability matter more than symbol substitution — a long passphrase is harder to crack than a short, "complex" password.',
      'Easy',
    ),
    question(
      'What is credential stuffing?',
      [
        'Reusing leaked username/password pairs against other sites',
        'Guessing a password one character at a time',
        'A type of phishing email',
        'A password recovery technique',
      ],
      0,
      'Credential stuffing automates trying leaked credentials from one breach against many other services, exploiting password reuse.',
      'Medium',
    ),
    question(
      'Why should you enable multi-factor authentication (MFA)?',
      [
        'It replaces the need for a password',
        'It blocks all phishing emails',
        'It adds a second layer of protection beyond your password',
        'It automatically generates strong passwords',
      ],
      2,
      'MFA requires a second factor — like a code or approval on another device — so a stolen password alone is not enough to log in.',
      'Easy',
    ),
    question(
      'What should you do first if a service you use reports a data breach?',
      [
        'Wait to see if you are affected before doing anything',
        'Change your password for that service immediately',
        'Delete your account without changing anything',
        'Ignore it since breaches are common',
      ],
      1,
      'Changing the password right away limits how long a potentially leaked credential remains useful to an attacker.',
      'Medium',
    ),
    question(
      "What makes a passphrase like 'correct horse battery staple' strong?",
      [
        'It uses special characters',
        'It is short and easy to type',
        'It is long and hard to guess despite being memorable',
        'It is based on a single dictionary word',
      ],
      2,
      'Length is the dominant factor in resisting brute-force attacks, and a memorable passphrase avoids the temptation to write it down or reuse it.',
      'Hard',
    ),
  ]),
}

const phishingAwarenessDefaults = {
  moduleId: 'phishing-awareness',
  ...buildDefaultSettings(80, 'Phishing Awareness Knowledge Check'),
  questions: withOrder([
    question(
      'What is the safest way to verify a suspicious payment request email?',
      [
        'Reply to the email asking for confirmation',
        'Call the vendor using a known, trusted phone number',
        'Click the link to see where it leads',
        'Forward it to a coworker for their opinion',
      ],
      1,
      'Verifying through a channel you already trust — not the email itself — confirms whether the request is real.',
      'Easy',
    ),
    question(
      'Which of these is a common sign of a phishing email?',
      [
        'A sender address that does not match the real company',
        'A professional-looking logo',
        'Correct spelling and grammar',
        'An email signature',
      ],
      0,
      'Mismatched sender domains are one of the most reliable signs of a spoofed or phishing email.',
      'Easy',
    ),
    question(
      'What should you do with an unexpected attachment from an unknown sender?',
      [
        'Open it to see what it is',
        'Avoid opening it and report it',
        'Forward it to IT after opening',
        'Save it for later',
      ],
      1,
      'Reporting an unopened suspicious attachment protects both you and anyone else who may have received the same email.',
      'Medium',
    ),
    question(
      'What is a fake login page designed to do?',
      [
        'Speed up your login',
        'Steal your entered credentials',
        'Save your password securely',
        'Verify your identity',
      ],
      1,
      'A convincing lookalike login page exists solely to capture whatever credentials are typed into it.',
      'Medium',
    ),
    question(
      'Why is verifying through a known channel better than replying to a suspicious email?',
      [
        'It is faster',
        'It confirms you are talking to the real organization, not the attacker',
        'It is required by law',
        'It automatically blocks the sender',
      ],
      1,
      'Replying only keeps the conversation with whoever sent the email — which may be the attacker. A known channel bypasses them entirely.',
      'Hard',
    ),
  ]),
}

const malwareAwarenessDefaults = {
  moduleId: 'malware-awareness',
  ...buildDefaultSettings(75, 'Malware Awareness Knowledge Check'),
  questions: withOrder([
    question(
      'Why are free downloads from unofficial websites risky?',
      ['They are always slower', 'They are often bundled with malware', 'They cost more later', 'They require an account'],
      1,
      'Unofficial download sources frequently bundle malicious software alongside the free tool being offered.',
      'Easy',
    ),
    question(
      'What should you do if you find an unknown USB drive?',
      [
        'Plug it in to see who owns it',
        'Give it to IT without plugging it in',
        'Use it for personal storage',
        'Throw it away immediately',
      ],
      1,
      'Unknown USB drives are a known malware delivery method — IT can safely inspect them without exposing your device.',
      'Easy',
    ),
    question(
      'What is ransomware?',
      [
        'Software that speeds up your computer',
        'Malware that locks your files and demands payment',
        'A type of antivirus',
        'A firewall setting',
      ],
      1,
      'Ransomware encrypts a victim\'s files and demands payment for the (unguaranteed) key to unlock them.',
      'Medium',
    ),
    question(
      'What is the recommended response to a ransomware pop-up?',
      [
        'Pay immediately to avoid losing files',
        'Disconnect from the network and contact IT',
        'Restart the computer repeatedly',
        'Ignore it and keep working',
      ],
      1,
      'Disconnecting limits further spread while IT investigates and restores from backup.',
      'Medium',
    ),
    question(
      "Why doesn't paying a ransomware demand guarantee your files back?",
      [
        'Attackers are legally required to unlock files',
        'There is no guarantee the attacker will restore access after payment',
        'Payment is always refunded',
        'Ransomware deletes files instead of encrypting them',
      ],
      1,
      'Paying funds the attacker with no enforceable guarantee that access will actually be restored.',
      'Hard',
    ),
  ]),
}

const safeBrowsingDefaults = {
  moduleId: 'safe-browsing',
  ...buildDefaultSettings(80, 'Safe Browsing Knowledge Check'),
  questions: withOrder([
    question(
      'Why is public Wi-Fi risky for sensitive logins?',
      ['It is usually slower', 'Traffic can potentially be intercepted by others on the network', 'It costs more data', 'It blocks secure websites'],
      1,
      'Open networks let others sharing the same Wi-Fi potentially intercept unencrypted traffic.',
      'Easy',
    ),
    question(
      'What should you do before entering payment details on an unfamiliar site?',
      [
        'Trust it if the discount is large',
        "Check reviews and the site's reputation first",
        'Enter details quickly before the deal ends',
        'Ask a friend to enter it for you',
      ],
      1,
      'A quick reputation check can reveal a scam site before any payment details are entered.',
      'Medium',
    ),
    question(
      'What is a warning sign of a scam shopping site?',
      ['Extreme discounts like 90% off on an unfamiliar site', 'A working contact page', 'HTTPS in the address bar', 'Product photos'],
      0,
      'Unrealistic discounts on unfamiliar sites are a common tactic used to harvest payment details.',
      'Easy',
    ),
    question(
      'Why should you be cautious about browser extensions demanded by a random website?',
      [
        'They always slow down your browser',
        'They can be a way to deliver malware',
        'They are always free',
        'They require a restart',
      ],
      1,
      'Extensions demanded by an unrelated site are a common malware delivery method disguised as a requirement.',
      'Medium',
    ),
    question(
      "What is the safest way to access a sensitive account like banking?",
      ['Any public Wi-Fi network', 'A trusted network or a VPN', 'Any browser extension that promises security', 'A shared computer'],
      1,
      'A trusted network or VPN protects sensitive traffic from others who may share the same public Wi-Fi.',
      'Hard',
    ),
  ]),
}

const dataPrivacyDefaults = {
  moduleId: 'data-privacy',
  ...buildDefaultSettings(85, 'Data Privacy Knowledge Check'),
  questions: withOrder([
    question(
      'Why should a flashlight app not need access to your contacts?',
      [
        'It needs contacts to work properly',
        'That permission has no legitimate connection to its function',
        'All apps need contacts access',
        'It improves battery life',
      ],
      1,
      "A flashlight app has no legitimate reason to need your contacts — that request goes beyond the app's actual function.",
      'Easy',
    ),
    question(
      'What is a risk of posting travel dates and your address publicly?',
      ['It signals when your home may be empty', 'It uses too much data', 'It slows down your phone', 'It violates copyright'],
      0,
      'Combining public travel details with an address can indicate exactly when a home is unoccupied.',
      'Medium',
    ),
    question(
      'What should you do with app permission requests that seem unnecessary?',
      [
        'Always accept them',
        'Deny them and see if the app still works',
        'Uninstall the app immediately without checking',
        'Ignore the prompt',
      ],
      1,
      'Only granting permissions an app actually needs limits what data it can collect.',
      'Easy',
    ),
    question(
      'What is one benefit of requesting data deletion from unused accounts?',
      ['It speeds up the app', 'It limits what could be exposed in a future breach', 'It is required every month', 'It changes your password automatically'],
      1,
      'Removing data from accounts you no longer use limits what a future breach could expose.',
      'Medium',
    ),
    question(
      'Why is limiting your audience when sharing photos a good privacy habit?',
      [
        'It reduces what a stranger can learn and act on',
        'It makes photos load faster',
        'It is required by most platforms',
        'It improves photo quality',
      ],
      0,
      'Limiting who can see personal photos and their timing reduces what an unknown viewer can learn and act on.',
      'Hard',
    ),
  ]),
}

const onlineSafetyDefaults = {
  moduleId: 'online-safety',
  ...buildDefaultSettings(75, 'Online Safety Knowledge Check'),
  questions: withOrder([
    question(
      'What should you do with a friend request from a stranger with no mutual connections?',
      [
        'Accept it to be polite',
        'Decline and review your profile visibility settings',
        'Share your full profile with them',
        'Ask them for personal information first',
      ],
      1,
      'Declining and tightening visibility settings reduces exposure to accounts with no real connection to you.',
      'Easy',
    ),
    question(
      'Why is it okay to skip a risky viral challenge?',
      [
        'Challenges are illegal',
        'Choosing not to participate protects you without needing anyone else\'s approval',
        'It is required by platform rules',
        'It has no real risk anyway',
      ],
      1,
      'Opting out of unsafe viral trends is always a valid choice, regardless of peer pressure.',
      'Medium',
    ),
    question(
      'What is the right response to seeing cyberbullying in a group chat?',
      [
        'Join in since everyone else is',
        'Leave and report it to a trusted adult or moderator',
        'Ignore it completely',
        'Share it with more people',
      ],
      1,
      'Reporting gives someone with authority the chance to step in and stop the harm being done.',
      'Easy',
    ),
    question(
      'Why can peer pressure online still be harmful even though it is not in person?',
      [
        'It can encourage unsafe behavior just like in-person pressure',
        'Online pressure is not real',
        'It only affects adults',
        'It has no lasting effect',
      ],
      0,
      'Peer pressure online can push someone into unsafe choices just as effectively as in-person pressure.',
      'Medium',
    ),
    question(
      'What is a good first step if you are being harassed online?',
      [
        'Respond angrily to defend yourself',
        'Report it to a trusted adult or platform moderator',
        'Delete all your accounts',
        'Keep it to yourself',
      ],
      1,
      'Reporting to a trusted adult or moderator gets help involved rather than escalating the situation alone.',
      'Hard',
    ),
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
 * getDefaultQuizConfig
 * The original authored seed for a module's quiz — never mutated.
 * Consumed by src/services/quizService.js as the lazy-seed value on a
 * Firestore document's first read, and by useQuiz()'s "Reset to
 * Defaults" (distinct from "Cancel", which reverts to the last *saved*
 * Firestore state, not the original seed).
 * @param {string} moduleId
 * @returns {import('../types/quizConfigAdmin.types').QuizConfig | null}
 */
export function getDefaultQuizConfig(moduleId) {
  const seed = DEFAULT_CONFIGS[moduleId]
  return seed ? clone(seed) : null
}
