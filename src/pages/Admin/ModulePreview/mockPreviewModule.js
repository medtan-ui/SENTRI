/**
 * mockPreviewModule.js
 * Read-only mock data for the Module Preview page. Reuses the phishing
 * awareness lesson content from the Module Content Editor and the
 * category metadata from Module Management — both imported, neither
 * modified — plus module-level fields (category, difficulty, learning
 * objectives) that don't exist on the section-only editor data.
 */

import { INITIAL_MODULE_TITLE, INITIAL_SECTIONS } from '../ModuleEditor/mockLesson'
import { CATEGORY_META } from '../Modules/mockModules'

export const PREVIEW_MODULE = {
  title: INITIAL_MODULE_TITLE,
  category: 'Phishing',
  difficulty: 'Beginner',
  objectives: [
    'Identify the common characteristics of phishing emails',
    'Explain why phishing attacks succeed even against careful users',
    'Apply verification steps before clicking links or entering credentials',
    'Recognize when and how to report a suspected phishing attempt',
  ],
  sections: INITIAL_SECTIONS,
}

export const PREVIEW_CATEGORY_META = CATEGORY_META[PREVIEW_MODULE.category]
