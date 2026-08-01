import { dataPrivacyConfig } from '../../features/scenario/configs/dataPrivacy.config'

/**
 * dataPrivacy.js
 * Mock module data for Data Privacy. Scenario content lives in
 * features/scenario/configs/dataPrivacy.config.js; lesson content below
 * is authored per SENTRI_Module_Content_Design.md.
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
    objectives: [
      'Identify which pieces of personal information carry the most risk when exposed',
      'Evaluate app permission requests against what an app actually needs to function',
      'Apply your rights under the Data Privacy Act to limit what organizations hold about you',
    ],
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: "Personal data is anything that identifies you or can be combined with something else to identify you — your name, mobile number, birthday, home address, student number, photographs, and location history among them.\n\nMost of it is not taken. It is given, in small amounts, across many separate moments: a permission granted without reading, a form filled in for a giveaway, a post that mentions more than it needed to. In this lesson you'll learn which pieces carry the most risk, how they are collected, and what the law entitles you to do about it.",
      },
      {
        id: 'why-it-matters',
        title: 'Why Data Privacy Matters',
        content: "Individual pieces of information feel harmless in isolation, and mostly they are. The risk comes from aggregation. Your birthday alone is trivia. Your birthday combined with your full name and mobile number is enough to pass identity verification at many banks and telecoms, because those are precisely the details used to confirm that a caller is who they claim to be.\n\nIn the Philippines this has become sharper since the SIM Registration Act. Mobile numbers are now tied to verified legal identity, which means a leaked number is no longer just a channel for spam — it is an identifier linked to a real person, and it is correspondingly more valuable to resell.\n\nYou also have specific legal rights here. The Data Privacy Act of 2012, Republic Act No. 10173, gives you the right to be informed about what an organization collects, to access what it holds about you, to correct inaccuracies, and to object to processing and request erasure. The National Privacy Commission enforces these rights and accepts complaints from individuals. These are enforceable entitlements, not courtesies.",
      },
      {
        id: 'what-carries-risk',
        title: 'Which Information Carries the Most Risk',
        content: "Not all personal data is equally sensitive, and treating everything as equally dangerous is not a workable strategy. The useful question is what someone could do with a specific piece.\n\nYour birthday is an identity verification factor, used routinely to confirm identity by phone. Your mobile number is now tied to your registered legal identity and is the delivery channel for account verification codes. Your home address is physical location information. Government and student ID images contain several identifiers at once, which is why a photo of an ID is far more consequential than any single field on it. Location data, including the metadata embedded in photographs, reveals patterns — where you live, where you study, and when you are away from both.\n\nBy contrast, a first name, a profile photo, or the city you live in are ordinarily low-risk and are not worth restricting.\n\nCombinations deserve particular attention. Publicly posting travel dates alongside a home address announces a specific window during which a specific residence is empty. Neither piece is dangerous alone; together they are an invitation.\n\nOne useful default: if a piece of information is used to verify your identity somewhere, treat it with the same care as a password.",
      },
      {
        id: 'how-data-is-collected',
        title: 'How Your Data Gets Collected',
        content: "App permissions are the most routine collection point. The test is whether the requested access has any connection to what the app does. A photo editor needs your photos and camera. A flashlight app has no functional reason to want your contacts — that request exists to collect the data, not to make the app work. Denying an unnecessary permission almost always leaves the app fully usable, and you can grant it later if something actually breaks.\n\nOnline forms collect through incentives. Giveaways, prize claims, and free-sample signups typically request far more than the stated purpose requires. A raffle needs a name and one way to contact a winner. It does not need your home address, your birthday, and your phone number. When a form asks for more than its purpose justifies, the excess is the actual product being harvested, and it is often resold to marketers and scammers.\n\nOversharing is collection without a collector. Posts, stories, and photo metadata accumulate into a detailed picture available to anyone who looks, including people you have never met. Limiting who can see what you share reduces how much a stranger can learn and act on.\n\nBreaches at services you once used are the collection point people forget. An account you abandoned years ago still holds whatever you gave it, and that data is exposed if the service is breached. Requesting deletion of unused accounts is one of the few privacy actions that reduces risk permanently rather than incrementally.",
      },
      {
        id: 'summary',
        title: 'Summary',
        content: "Data privacy is calibration rather than concealment. The goal is not to share nothing — it is to share in proportion to what a purpose actually requires, and to be deliberate about the specific pieces that unlock other things.\n\nDeny permissions that have no connection to an app's function. Give forms only what their stated purpose needs. Limit who can see personal posts. Delete accounts you no longer use. Know that RA 10173 gives you the right to ask any organization what it holds about you, and to require its deletion.\n\nYou've completed the Data Privacy lesson. Next, you'll apply it in an interactive simulation where a giveaway post asks you to claim a prize.",
      },
    ],
    bestPractices: [
      'Deny app permissions that have no connection to what the app actually does',
      'Give online forms only the information their stated purpose genuinely requires',
      'Review who can see your posts, and avoid combining travel plans with location details',
      'Never post photographs of government or student IDs, even partially covered',
      'Request deletion of accounts and services you no longer use',
      'Exercise your rights under RA 10173 to ask an organization what data it holds about you',
    ],
    keyTakeaways: [
      'A permission request unrelated to an app’s function exists to collect data, not to make the app work.',
      'Individual details are low-risk alone but identify you precisely when combined.',
      'Deleting unused accounts is one of the few privacy actions that permanently reduces your exposure.',
    ],
    references: [
      { id: 'ref-01', title: 'National Privacy Commission — Data Privacy Act of 2012 (RA 10173)', link: 'https://privacy.gov.ph/data-privacy-act/' },
      { id: 'ref-02', title: 'National Cybersecurity Alliance — StaySafeOnline privacy guidance', link: 'https://www.staysafeonline.org/' },
    ],
  },

  scenario: dataPrivacyConfig,

  quiz: null,
}

export default dataPrivacyModuleData
