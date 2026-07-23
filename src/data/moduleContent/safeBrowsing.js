import { safeBrowsingConfig } from '../../features/scenario/configs/safeBrowsing.config'

/**
 * safeBrowsing.js
 * Mock module data for Safe Browsing. Scenario content is fully built
 * (see features/scenario/configs/safeBrowsing.config.js); lesson content
 * for this module has not been authored yet — this is scoped only to
 * the Scenario Engine — so `lesson` is a minimal placeholder just
 * detailed enough for StudentLessonViewerPage to render without
 * crashing if reached, not real lesson copy.
 */
export const safeBrowsingModuleData = {
  moduleId: 'safe-browsing',
  title: 'Safe Browsing',
  description: 'Identify malicious websites, verify secure connections, and avoid drive-by downloads while browsing.',
  difficulty: 'Intermediate',
  previousModuleId: 'online-safety',
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

  scenario: safeBrowsingConfig,

  quiz: null,
}

export default safeBrowsingModuleData
