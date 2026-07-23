import { dataPrivacyConfig } from '../../features/scenario/configs/dataPrivacy.config'

/**
 * dataPrivacy.js
 * Mock module data for Data Privacy. Scenario content is fully built
 * (see features/scenario/configs/dataPrivacy.config.js); lesson content
 * for this module has not been authored yet — this is scoped only to
 * the Scenario Engine — so `lesson` is a minimal placeholder just
 * detailed enough for StudentLessonViewerPage to render without
 * crashing if reached, not real lesson copy.
 */
export const dataPrivacyModuleData = {
  moduleId: 'data-privacy',
  title: 'Data Privacy',
  description: 'Understand what personal data is collected online and how to limit exposure across apps and services.',
  difficulty: 'Advanced',
  previousModuleId: 'phishing-awareness',
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

  scenario: dataPrivacyConfig,

  quiz: null,
}

export default dataPrivacyModuleData
