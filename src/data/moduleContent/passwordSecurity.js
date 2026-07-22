import { passwordModuleConfig } from '../../features/scenario/configs/passwordModuleConfig'

/**
 * passwordSecurity.js
 * Mock module data for Password Security — the single seam a future
 * Firestore-backed `loadModuleConfig` will read the same shape from.
 * Bundles this module's lesson content with its (already-existing)
 * Scenario Engine config, so the loader can hand both back together.
 */
export const passwordSecurityModuleData = {
  moduleId: 'password-security',
  title: 'Password Security',
  description:
    'Learn what makes a password strong, how attackers actually crack or steal passwords, and the everyday habits that keep your accounts safe.',
  difficulty: 'Beginner',
  previousModuleId: null,

  lesson: {
    objectives: [
      'Understand what makes a password strong',
      'Recognize common password attacks',
      'Apply password best practices to protect your own accounts',
    ],
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content:
          "Passwords are the most common way we prove who we are online, yet many people still use weak or reused passwords that put their accounts at serious risk. In this lesson, you'll learn what makes a password strong, how attackers actually crack passwords, and the habits that keep your accounts safe.",
      },
      {
        id: 'why-it-matters',
        title: 'Why Password Security Matters',
        content:
          'A single compromised password can expose far more than one account. Because many people reuse passwords, attackers who obtain a password from one breached service will often try it against email, banking, and social media accounts too — a technique called credential stuffing.\n\nOnce an attacker gains access to your email account specifically, they can typically reset the passwords for almost every other account you own, since password reset links are usually sent by email. This makes protecting your primary email password one of the highest-priority security habits you can build.',
      },
      {
        id: 'characteristics',
        title: 'Characteristics of Strong Passwords',
        content:
          'A strong password is long, unique, and unpredictable.\n\nLength matters more than complexity — a 16-character passphrase made of random words is usually stronger and easier to remember than an 8-character password full of substituted symbols like "P@ssw0rd!".\n\nUniqueness means never reusing the same password across multiple accounts, so a breach at one service can\'t be used to access your accounts elsewhere.\n\nUnpredictability means avoiding dictionary words, personal information (birthdays, names, pet names), and common patterns like "123456" or keyboard sequences like "qwerty".',
      },
      {
        id: 'common-attacks',
        title: 'Common Password Attacks',
        content:
          'Brute-force attacks try every possible combination of characters until the correct password is found — modern computing power makes short passwords crackable in seconds.\n\nDictionary attacks try common words and known leaked passwords instead of every possible combination, which is much faster against predictable passwords.\n\nCredential stuffing takes username/password pairs leaked from one breach and automatically tries them against many other websites, exploiting password reuse.\n\nPhishing tricks users into typing their password directly into a fake login page controlled by the attacker — no cracking required at all.',
      },
      {
        id: 'summary',
        title: 'Summary',
        content:
          "Password security is one of the simplest and most effective ways to protect your digital life. By choosing long, unique passwords, using a password manager, and enabling multi-factor authentication, you make it dramatically harder for attackers to compromise your accounts.\n\nYou've completed the Password Security lesson. Next, you'll apply what you've learned in an interactive simulation where you'll practice spotting weak passwords and responding to real account security scenarios.",
      },
    ],
    bestPractices: [
      'Enable multi-factor authentication (MFA) wherever it is offered',
      'Use a password manager to generate and store unique passwords',
      'Never reuse the same password across accounts',
      'Favor long passphrases (4-5 random words) over short, complex passwords',
      'Change a password immediately if a service reports a data breach',
    ],
    keyTakeaways: [
      'Strong passwords are long, unique, and unpredictable.',
      'Reusing passwords puts every account tied to that password at risk.',
      'Password managers and multi-factor authentication provide the strongest everyday protection.',
    ],
    references: [
      { id: 'ref-01', title: 'NIST Digital Identity Guidelines', link: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
      { id: 'ref-02', title: 'Have I Been Pwned — check for breached credentials', link: 'https://haveibeenpwned.com' },
    ],
  },

  // Reuses the Scenario Engine's own config verbatim — the engine is not
  // duplicated or reimplemented here, only referenced.
  scenario: passwordModuleConfig,

  // Quiz doesn't exist yet. The shape is reserved so the loader's return
  // value doesn't need to change when a real quiz config is added later.
  quiz: null,
}

export default passwordSecurityModuleData
