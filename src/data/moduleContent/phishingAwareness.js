import { phishingAwarenessConfig } from '../../features/scenario/configs/phishingAwareness.config'

/**
 * phishingAwareness.js
 * Mock module data for Phishing Awareness. Scenario content is fully
 * built (see features/scenario/configs/phishingAwareness.config.js);
 * lesson content for this module has not been authored yet — this is
 * scoped only to the Scenario Engine — so `lesson` is a minimal
 * placeholder just detailed enough for StudentLessonViewerPage to
 * render without crashing if reached, not real lesson copy.
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
    objectives: [],
    sections: [
      {
        id: 'coming-soon',
        title: 'Lesson Content Coming Soon',
        content: "This module's lesson content hasn't been written yet — the interactive simulation is ready to try from Curriculum.",
      },
    ],
    bestPractices: [],
    keyTakeaways: [],
    references: [],
  },

  scenario: phishingAwarenessConfig,

  quiz: null,
}

export default phishingAwarenessModuleData
