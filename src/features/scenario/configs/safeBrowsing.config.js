/**
 * safeBrowsing.config.js
 * Module 4's simulation — desktop browser. Mock data only. Same shape
 * as passwordSecurity.config.js; see that file for the full
 * field-by-field JSDoc.
 *
 * coachLevel: 'none' — useScenarioEngine already implements this (a
 * single subtle pulse on every target after 15s idle, no animated
 * coach); no engine change was needed. No scenario here sets
 * `coachTarget` for the same reason: 'none' pulses every target
 * uniformly rather than pointing at one.
 *
 * Scenario 2 adds one field beyond the base schema: `inspectionAction`
 * — a "View certificate"-style action that is explicitly NOT a choice.
 * It never reaches useScenarioEngine's selectChoice; the scene that
 * reads it only ever reveals information locally. Kept out of the
 * `choices` array on purpose, since that array's contract (to the
 * engine) is "things that resolve the scenario."
 *
 * @type {import('./passwordSecurity.config').ModuleScenarioConfig}
 */
export const safeBrowsingConfig = {
  moduleId: 'safe-browsing',
  moduleTitle: 'Safe Browsing',
  coachLevel: 'none',
  scenarios: [
    {
      scenarioId: 'sb-01',
      scenarioOrder: 1,
      scenarioTitle: 'Finding Research Sources',
      scenarioDescription: 'Mia needs sources for her research paper.',
      videoAvailable: true,
      materialUrl: '/videos/module-4/module-4-intro.mp4',
      posterCaption: 'Mia searches for research papers for her project.',
      scene: 'ResearchSearchScene',
      contextPopup: {
        title: "Searching for Research Sources",
        narrative: "Mia is looking for articles for a research paper due soon. Her search returns several links, including free paper downloads and an academic repository. You are now in her browser. Which source will you open?",
      },
      choices: [
        {
          scenarioChoiceId: 'sb-01-a',
          target: 'sponsored-result',
          choiceText: 'Click the sponsored "10,000 papers free" result',
          isSafeChoice: false,
          outcomeTitle: 'Sponsored Isn\'t the Same as Trusted',
          consequenceType: 'none',
          feedbackText:
            'A mass "10,000 papers, no sign-up" download from an unfamiliar .xyz domain is a common way to distribute malware or harvest whatever information you enter — a paid placement in search results says nothing about whether a site is legitimate.',
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-4/module-4-fail-video.mp4',
          consequenceVideoUrl: '/videos/module-4/module-4-after-fail-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'sb-01-b',
          target: 'blog-result',
          choiceText: 'Click the blog result with the exact title match',
          isSafeChoice: false,
          outcomeTitle: 'An Exact Match Can Still Be Bait',
          consequenceType: 'none',
          feedbackText:
            "An unfamiliar blog offering the exact thesis you searched for is a common lure — the specificity is designed to feel like a lucky find, not a red flag. Unknown personal sites hosting full-text academic papers are worth checking before you click, not after.",
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-4/module-4-fail-video.mp4',
          consequenceVideoUrl: '/videos/module-4/module-4-after-fail-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'sb-01-c',
          target: 'repository-result',
          choiceText: "Click the university's institutional repository",
          isSafeChoice: true,
          outcomeTitle: 'Straight to a Known Source',
          consequenceType: 'none',
          feedbackText:
            "repository.tip.edu.ph is the university's own domain — a known, verifiable source beats a promising-looking stranger every time, even if it takes one more search result to find.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'sb-02',
      scenarioOrder: 2,
      scenarioTitle: 'A Banner on the Page',
      scenarioDescription: "While reading an article, a prompt insists that the browser is outdated.",
      videoAvailable: true,
      materialUrl: '/videos/module-4/module-4-scene-2-intro.mp4',
      posterCaption: 'A suspicious browser update alert appears.',
      scene: 'FakeUpdateScene',
      contextPopup: {
        title: "An Update Interrupts the Article",
        narrative: "While Mia is reading an article, a banner appears on the page claiming that her browser is out of date. It offers an UPDATE button so she can continue. You are taking over with the banner still visible. How will you respond to the update request?",
      },
      choices: [
        {
          scenarioChoiceId: 'sb-02-a',
          target: 'update-banner',
          choiceText: 'Click UPDATE in the banner',
          isSafeChoice: false,
          outcomeTitle: 'That Update Was Never From Your Browser',
          consequenceType: 'device_compromise',
          feedbackText:
            "That banner was part of the web page, not your browser — real browsers update themselves automatically or prompt from their own menus, never from a banner inside a site you're visiting. \"Click here to update\" is one of the most common disguises for installing adware and malicious extensions.",
          feedbackMediaUrl: null,
          failVideoUrl: '/videos/module-4/module-4-fail-video.mp4',
          consequenceVideoUrl: '/videos/module-4/module-4-after-fail-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'sb-02-b',
          target: 'dismiss-and-continue',
          choiceText: 'Close the banner and keep reading',
          isSafeChoice: false,
          outcomeTitle: 'No Harm This Time, But No Verification Either',
          consequenceType: 'none',
          feedbackText:
            "Closing it caused no harm here, so this isn't a dangerous choice in itself — but dismissing a prompt without ever checking where it actually appeared means you still can't tell a fake update banner from a real one next time. The real browser-settings path (its own menu → Settings → About) takes the same effort and actually verifies something.",
          feedbackMediaUrl: null,
          consequenceVideoUrl: '/videos/module-4/module-4-after-fail-tutorial.mp4',
        },
        {
          scenarioChoiceId: 'sb-02-c',
          target: 'browser-settings',
          choiceText: "Check for updates through the browser's own menu",
          isSafeChoice: true,
          outcomeTitle: 'Checked Through the Real Menu',
          consequenceType: 'none',
          feedbackText:
            "The browser's own Settings → About page is the one place that can honestly tell you whether an update is available — and it confirms you're already up to date. Nothing on this page could have told you that.",
          feedbackMediaUrl: null,
        },
      ],
    },
  ],
}

export default safeBrowsingConfig
