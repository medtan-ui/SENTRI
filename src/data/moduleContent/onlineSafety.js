import { onlineSafetyConfig } from '../../features/scenario/configs/onlineSafety.config'

/**
 * onlineSafety.js
 * Mock module data for Online Safety. Scenario content is fully built
 * (see features/scenario/configs/onlineSafety.config.js); lesson content
 * for this module has not been authored yet — this is scoped only to
 * the Scenario Engine — so `lesson` is a minimal placeholder just
 * detailed enough for StudentLessonViewerPage to render without
 * crashing if reached, not real lesson copy.
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

  scenario: onlineSafetyConfig,

  quiz: null,
}

export default onlineSafetyModuleData
