/**
 * mockConfigData.js
 * Mock content for the Module Configuration page, keyed by the same
 * module ids used in Curriculum Management (src/pages/Admin/Modules/
 * mockModules.js, imported read-only from there — not duplicated here).
 * No Firestore, no backend — everything here is local, static content.
 *
 * Lesson content lives separately in ./LessonEditor/mockLessonContent.js
 * (the Lesson Content Editor manages its own state, independent of the
 * rest of this configuration form).
 */

export const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard']

// Curriculum Management stores difficulty as Beginner/Intermediate/Advanced;
// this page's Overview tab uses Easy/Medium/Hard per spec. This maps one
// to the other purely for the initial value shown when the page opens —
// the two pages don't share a live difficulty value.
export const DIFFICULTY_FROM_CURRICULUM = {
  Beginner: 'Easy',
  Intermediate: 'Medium',
  Advanced: 'Hard',
}


export const MODULE_CONFIG = {
  'password-security': {
    scenario: {
      title: 'The Compromised Account',
      description:
        'Students respond to a simulated account-takeover attempt by identifying weak password practices and applying stronger authentication habits.',
      status: 'Draft',
    },
    quiz: {
      title: 'Password Security Knowledge Check',
      passingScore: 80,
      numberOfQuestions: 10,
    },
  },
  'phishing-awareness': {
    scenario: {
      title: 'Inbox Under Attack',
      description:
        'Students sort a simulated inbox of real and fake emails, identifying phishing attempts before taking any action.',
      status: 'Published',
    },
    quiz: {
      title: 'Phishing Awareness Knowledge Check',
      passingScore: 80,
      numberOfQuestions: 12,
    },
  },
  'malware-awareness': {
    scenario: {
      title: 'The Infected Download',
      description:
        'Students trace how a malware infection spread through a simulated office network after an unsafe download.',
      status: 'Draft',
    },
    quiz: {
      title: 'Malware Awareness Knowledge Check',
      passingScore: 75,
      numberOfQuestions: 10,
    },
  },
  'safe-browsing': {
    scenario: {
      title: 'The Suspicious Website',
      description: 'Students evaluate a series of websites and decide which are safe to enter information into.',
      status: 'Published',
    },
    quiz: {
      title: 'Safe Browsing Knowledge Check',
      passingScore: 80,
      numberOfQuestions: 8,
    },
  },
  'data-privacy': {
    scenario: {
      title: 'The Oversharing App',
      description:
        "Students review a mock app's permission requests and privacy settings, deciding what data should and shouldn't be shared.",
      status: 'Draft',
    },
    quiz: {
      title: 'Data Privacy Knowledge Check',
      passingScore: 85,
      numberOfQuestions: 10,
    },
  },
  'online-safety': {
    scenario: {
      title: 'The Public Wi-Fi Trap',
      description:
        'Students navigate a simulated coffee shop scenario, deciding which online activities are safe over public Wi-Fi.',
      status: 'Published',
    },
    quiz: {
      title: 'Online Safety Knowledge Check',
      passingScore: 75,
      numberOfQuestions: 10,
    },
  },
}
