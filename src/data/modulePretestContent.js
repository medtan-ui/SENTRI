/**
 * modulePretestContent.js
 * Authored seed content for each module's pre-test — 5 baseline
 * multiple-choice questions a student answers once, before their first
 * lesson, so their prior knowledge can later be compared against their
 * quiz score. No settings block (no passing score / attempts / time
 * limit): a pre-test has no pass/fail concept, only "completed or not".
 *
 * This is the lazy-seed value src/services/pretestService.js writes into
 * Firestore's modulePretests/{moduleId} on first read — same shape and
 * pattern as src/features/admin/quiz-config/services/quizConfigService.js
 * uses for quiz questions, so once seeded the document is authoritative
 * and this file is never read again for that module.
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

function question(text, choiceTexts, correctIndex, explanation) {
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
  }
}

const MODULE_PRETESTS = {
  'password-security': {
    moduleId: 'password-security',
    title: 'Password Security — Pre-Test',
    questions: [
      question(
        'What generally makes a password stronger?',
        ['Adding a symbol like "!" at the end', 'Being long and unique', 'Being easy to say out loud', 'Using your birth year'],
        1,
        'Length and uniqueness matter far more than a single substituted symbol.',
      ),
      question(
        'Is it safe to reuse the same password across multiple accounts?',
        ['Yes, as long as it is long', 'No — one breach can expose every account that reused it', 'Yes, if the accounts are unrelated', 'Only for unimportant accounts'],
        1,
        'Reusing a password means a single leak can be tried against every other account using it.',
      ),
      question(
        'What does multi-factor authentication (MFA) add?',
        ['A stronger password automatically', 'A second layer of proof beyond your password', 'Faster login times', 'Unlimited password resets'],
        1,
        'MFA requires a second factor — like a code on your phone — so a stolen password alone is not enough to log in.',
      ),
      question(
        'What is "credential stuffing"?',
        ['Guessing passwords one character at a time', 'Trying leaked username/password pairs against other sites', 'A type of firewall', 'A way to recover a forgotten password'],
        1,
        'Credential stuffing automates trying passwords leaked from one breach against many other services.',
      ),
      question(
        'What should you do first if a service you use reports a data breach?',
        ['Nothing, breaches are common', 'Change your password for that service right away', 'Delete the account without changing anything', 'Wait a few months'],
        1,
        'Changing the password immediately limits how long a possibly-leaked credential stays useful to an attacker.',
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
      ),
      question(
        'Which is a common red flag in a phishing email?',
        ['A sender address that does not match the real company', 'A short subject line', 'A company logo', 'A greeting with your name'],
        0,
        'A mismatched sender address is one of the most reliable signs of a spoofed email.',
      ),
      question(
        'Is it safe to click a link in an urgent "verify your account now" email?',
        ['Yes, urgency means it is important', 'No — verify through a separately-trusted channel first', 'Yes, if the email looks professional', 'Only if it has your name in it'],
        1,
        'Urgency is a manipulation tactic — verifying through a channel you already trust is much safer.',
      ),
      question(
        'What should you do with an unexpected attachment from an unknown sender?',
        ['Open it to see what it is', 'Avoid opening it and report it', 'Forward it to a coworker first', 'Save it for later'],
        1,
        'Reporting an unopened suspicious attachment protects you and anyone else who received the same email.',
      ),
      question(
        'Why do phishing emails often create a sense of urgency?',
        ['It is required by email providers', 'To pressure you into acting before you think it through', 'To make the email load faster', 'It has no real purpose'],
        1,
        'Urgency pushes victims to act quickly, before they can carefully evaluate the request.',
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
      ),
      question(
        'What is ransomware?',
        ['Malware that locks your files and demands payment', 'A discount coupon scam', 'Free antivirus software', 'A password manager'],
        0,
        'Ransomware encrypts a victim\'s files and demands payment for the (unguaranteed) key to unlock them.',
      ),
      question(
        'Is downloading free software from an unofficial website risky?',
        ['No, free is always safe', 'Yes — it is often bundled with malware', 'Only on old computers', 'Only if you have no antivirus'],
        1,
        'Unofficial download sources frequently bundle malicious software alongside the free tool being offered.',
      ),
      question(
        'What is one of the best defenses against malware?',
        ['Never restarting your computer', 'Keeping your software and operating system updated', 'Disabling your internet permanently', 'Using the same password everywhere'],
        1,
        'Updates close the security holes that malware relies on to spread.',
      ),
      question(
        'What should you do if you find an unknown USB drive?',
        ['Plug it in to see who owns it', 'Give it to IT without plugging it in', 'Use it for personal storage', 'Format it immediately yourself'],
        1,
        'Unknown USB drives are a known malware delivery method — IT can inspect them safely.',
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
      ),
      question(
        'Is public Wi-Fi safe for logging into sensitive accounts without protection?',
        ['Yes, always', 'No — traffic can potentially be intercepted by others on the network', 'Only at coffee shops', 'Only if the network has a password'],
        1,
        'Open or shared networks make it easier for others on the same Wi-Fi to intercept unencrypted traffic.',
      ),
      question(
        'What is a common warning sign of a scam shopping website?',
        ['Extreme discounts like 90% off on an unfamiliar site', 'A visible contact page', 'Product photos', 'A working search bar'],
        0,
        'Unrealistic discounts on unfamiliar sites are a common tactic used to harvest payment details.',
      ),
      question(
        'What should you do about an unexpected "your browser is out of date" pop-up with a download button?',
        ['Click it immediately to stay safe', 'Avoid clicking it — it is a common malware trick', 'Restart your computer instead', 'Ignore it, it will go away in a week'],
        1,
        'Fake update pop-ups are a common way to trick visitors into downloading malware.',
      ),
      question(
        'What helps protect sensitive logins while using public Wi-Fi?',
        ['A VPN or a trusted, private network', 'A stronger Wi-Fi password only', 'Using an older browser', 'Disabling your antivirus'],
        0,
        'A VPN or trusted network protects sensitive traffic from others who may share the same public Wi-Fi.',
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
      ),
      question(
        'Should an app always be granted every permission it requests?',
        ['Yes, apps need full access to work', 'No — only permissions the app actually needs for its function', 'Yes, if it is a popular app', 'Only on new phones'],
        1,
        'Many apps request more access than they need — granting only what is necessary limits data exposure.',
      ),
      question(
        'What is a risk of oversharing personal details on social media?',
        ['It can give attackers information useful for scams or impersonation', 'It uses more phone storage', 'It slows down the app', 'There is no real risk'],
        0,
        'Details like routines, travel plans, or family info can be pieced together and used against you.',
      ),
      question(
        'Can data collected by a free app ever be sold to other companies?',
        ['No, that would be illegal everywhere', 'Yes — this happens and is a real risk to be aware of', 'Only for banking apps', 'Only if you pay for the app'],
        1,
        'Some apps monetize by selling collected data to third parties like data brokers.',
      ),
      question(
        'What is a good everyday privacy habit?',
        ['Never using any apps at all', 'Periodically reviewing app permissions and privacy settings', 'Sharing your location publicly for convenience', 'Using the same password for every account'],
        1,
        'Regularly auditing permissions and privacy settings limits what apps and services can collect over time.',
      ),
    ],
  },

  'online-safety': {
    moduleId: 'online-safety',
    title: 'Online Safety — Pre-Test',
    questions: [
      question(
        'Is public Wi-Fi equally safe for all everyday browsing?',
        ['Yes, always', 'It is riskier for sensitive tasks like logins or banking', 'It is only unsafe for gaming', 'It is only unsafe on phones'],
        1,
        'Public Wi-Fi is generally fine for casual browsing but riskier for anything sensitive without extra protection.',
      ),
      question(
        'What should you do if you witness cyberbullying in a group chat?',
        ['Join in since others are doing it', 'Leave and report it to a trusted adult or moderator', 'Ignore it completely', 'Share it with more people'],
        1,
        'Reporting gives someone with authority the chance to step in and stop the harm.',
      ),
      question(
        'How should you handle a friend request from a stranger with no mutual connections?',
        ['Accept it to be polite', 'Be cautious — consider declining or reviewing your visibility settings', 'Share your full profile with them right away', 'Ask them for personal details first'],
        1,
        'Being cautious with unknown requests reduces exposure to accounts with no real connection to you.',
      ),
      question(
        'Is peer pressure encountered online less impactful than peer pressure in person?',
        ['Yes, online pressure is not real', 'No — it can push someone toward unsafe choices just as effectively', 'Yes, because you cannot see the other person', 'It only affects adults'],
        1,
        'Peer pressure online can be just as influential as in-person pressure, and just as risky to give in to.',
      ),
      question(
        'What is a good first step if you are being harassed online?',
        ['Respond angrily to defend yourself', 'Report it to a trusted adult or platform moderator', 'Delete all your accounts immediately', 'Keep it to yourself'],
        1,
        'Reporting to a trusted adult or moderator gets help involved rather than escalating things alone.',
      ),
    ],
  },
}

/**
 * getDefaultPretest
 * The authored seed for a module's pre-test — consumed by
 * src/services/pretestService.js as the lazy-seed value on a Firestore
 * document's first read. Never mutated.
 * @param {string} moduleId
 * @returns {{moduleId:string, title:string, questions:Array} | null}
 */
export function getDefaultPretest(moduleId) {
  const seed = MODULE_PRETESTS[moduleId]
  return seed ? JSON.parse(JSON.stringify(seed)) : null
}
