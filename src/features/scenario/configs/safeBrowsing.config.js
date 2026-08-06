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
      scenarioDescription: 'She needs sources for a research paper.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'A search turns up a few places to look.',
      scene: 'ResearchSearchScene',
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
      scenarioTitle: 'A Connection Warning',
      scenarioDescription: 'The browser is warning that this connection is not private.',
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'Your browser has stopped to warn you about something.',
      scene: 'CertWarningScene',
      inspectionAction: {
        target: 'view-cert',
        choiceText: 'View certificate details',
        detail_title: 'Certificate does not match this site',
        detail_text: 'Issued to: *.cdn-relay-host.net  ·  Issued by: Unknown CA  ·  Expected: secure-paper-archive.xyz',
      },
      choices: [
        {
          scenarioChoiceId: 'sb-02-a',
          target: 'proceed-anyway',
          choiceText: 'Continue to the site anyway',
          isSafeChoice: false,
          outcomeTitle: 'Someone else is reading this connection.',
          consequenceType: 'data_exposure',
          feedbackText:
            "Proceeding past a certificate warning means the encryption protecting this connection can't be verified — anything sent from here, including anything you type, can potentially be read by whoever is sitting between you and the real site. That warning exists specifically to stop this before it happens.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'sb-02-c',
          target: 'back-to-safety',
          choiceText: 'Go back to safety',
          isSafeChoice: true,
          outcomeTitle: 'Stopped at the Warning',
          consequenceType: 'none',
          feedbackText:
            "A certificate warning means the browser can't verify who's actually on the other end of this connection. Leaving — instead of clicking past it — is exactly what the warning is there for.",
          feedbackMediaUrl: null,
        },
      ],
    },
    {
      scenarioId: 'sb-03',
      scenarioOrder: 3,
      scenarioTitle: 'A Banner on the Page',
      scenarioDescription: "She's reading an article when a banner appears.",
      videoAvailable: false,
      materialUrl: null,
      posterCaption: 'Something is asking for attention at the top of the page.',
      scene: 'FakeUpdateScene',
      choices: [
        {
          scenarioChoiceId: 'sb-03-a',
          target: 'update-banner',
          choiceText: 'Click UPDATE in the banner',
          isSafeChoice: false,
          outcomeTitle: 'That Update Was Never From Your Browser',
          consequenceType: 'device_compromise',
          feedbackText:
            "That banner was part of the web page, not your browser — real browsers update themselves automatically or prompt from their own menus, never from a banner inside a site you're visiting. \"Click here to update\" is one of the most common disguises for installing something unwanted.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'sb-03-b',
          target: 'dismiss-and-continue',
          choiceText: 'Close the banner and keep reading',
          isSafeChoice: false,
          outcomeTitle: 'No Harm This Time, But No Verification Either',
          consequenceType: 'none',
          feedbackText:
            "Closing it caused no harm here, so this isn't a dangerous choice in itself — but dismissing a prompt without ever checking where it actually appeared means you still can't tell a fake update banner from a real one next time. The real browser-settings path (its own menu → Settings → About) takes the same effort and actually verifies something.",
          feedbackMediaUrl: null,
        },
        {
          scenarioChoiceId: 'sb-03-c',
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
