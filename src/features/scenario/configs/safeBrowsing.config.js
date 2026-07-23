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
  module_id: 'safe-browsing',
  module_title: 'Safe Browsing',
  coachLevel: 'none',
  scenarios: [
    {
      scenario_id: 'sb-01',
      scenario_order: 1,
      scenario_title: 'Finding Research Sources',
      scenario_description: 'She needs sources for a research paper.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'A search turns up a few places to look.',
      scene: 'ResearchSearchScene',
      choices: [
        {
          scenario_choice_id: 'sb-01-a',
          target: 'sponsored-result',
          choice_text: 'Click the sponsored "10,000 papers free" result',
          is_safe_choice: false,
          outcome_title: 'Sponsored Isn\'t the Same as Trusted',
          consequence_type: 'none',
          feedback_text:
            'A mass "10,000 papers, no sign-up" download from an unfamiliar .xyz domain is a common way to distribute malware or harvest whatever information you enter — a paid placement in search results says nothing about whether a site is legitimate.',
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'sb-01-b',
          target: 'blog-result',
          choice_text: 'Click the blog result with the exact title match',
          is_safe_choice: false,
          outcome_title: 'An Exact Match Can Still Be Bait',
          consequence_type: 'none',
          feedback_text:
            "An unfamiliar blog offering the exact thesis you searched for is a common lure — the specificity is designed to feel like a lucky find, not a red flag. Unknown personal sites hosting full-text academic papers are worth checking before you click, not after.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'sb-01-c',
          target: 'repository-result',
          choice_text: "Click the university's institutional repository",
          is_safe_choice: true,
          outcome_title: 'Straight to a Known Source',
          consequence_type: 'none',
          feedback_text:
            "repository.tip.edu.ph is the university's own domain — a known, verifiable source beats a promising-looking stranger every time, even if it takes one more search result to find.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'sb-02',
      scenario_order: 2,
      scenario_title: 'A Connection Warning',
      scenario_description: 'The browser is warning that this connection is not private.',
      videoAvailable: false,
      material_url: null,
      posterCaption: 'Your browser has stopped to warn you about something.',
      scene: 'CertWarningScene',
      inspectionAction: {
        target: 'view-cert',
        choice_text: 'View certificate details',
        detail_title: 'Certificate does not match this site',
        detail_text: 'Issued to: *.cdn-relay-host.net  ·  Issued by: Unknown CA  ·  Expected: secure-paper-archive.xyz',
      },
      choices: [
        {
          scenario_choice_id: 'sb-02-a',
          target: 'proceed-anyway',
          choice_text: 'Continue to the site anyway',
          is_safe_choice: false,
          outcome_title: 'Someone else is reading this connection.',
          consequence_type: 'data_exposure',
          feedback_text:
            "Proceeding past a certificate warning means the encryption protecting this connection can't be verified — anything sent from here, including anything you type, can potentially be read by whoever is sitting between you and the real site. That warning exists specifically to stop this before it happens.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'sb-02-c',
          target: 'back-to-safety',
          choice_text: 'Go back to safety',
          is_safe_choice: true,
          outcome_title: 'Stopped at the Warning',
          consequence_type: 'none',
          feedback_text:
            "A certificate warning means the browser can't verify who's actually on the other end of this connection. Leaving — instead of clicking past it — is exactly what the warning is there for.",
          feedback_media_url: null,
        },
      ],
    },
    {
      scenario_id: 'sb-03',
      scenario_order: 3,
      scenario_title: 'A Banner on the Page',
      scenario_description: "She's reading an article when a banner appears.",
      videoAvailable: false,
      material_url: null,
      posterCaption: 'Something is asking for attention at the top of the page.',
      scene: 'FakeUpdateScene',
      choices: [
        {
          scenario_choice_id: 'sb-03-a',
          target: 'update-banner',
          choice_text: 'Click UPDATE in the banner',
          is_safe_choice: false,
          outcome_title: 'That Update Was Never From Your Browser',
          consequence_type: 'device_compromise',
          feedback_text:
            "That banner was part of the web page, not your browser — real browsers update themselves automatically or prompt from their own menus, never from a banner inside a site you're visiting. \"Click here to update\" is one of the most common disguises for installing something unwanted.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'sb-03-b',
          target: 'dismiss-and-continue',
          choice_text: 'Close the banner and keep reading',
          is_safe_choice: false,
          outcome_title: 'No Harm This Time, But No Verification Either',
          consequence_type: 'none',
          feedback_text:
            "Closing it caused no harm here, so this isn't a dangerous choice in itself — but dismissing a prompt without ever checking where it actually appeared means you still can't tell a fake update banner from a real one next time. The real browser-settings path (its own menu → Settings → About) takes the same effort and actually verifies something.",
          feedback_media_url: null,
        },
        {
          scenario_choice_id: 'sb-03-c',
          target: 'browser-settings',
          choice_text: "Check for updates through the browser's own menu",
          is_safe_choice: true,
          outcome_title: 'Checked Through the Real Menu',
          consequence_type: 'none',
          feedback_text:
            "The browser's own Settings → About page is the one place that can honestly tell you whether an update is available — and it confirms you're already up to date. Nothing on this page could have told you that.",
          feedback_media_url: null,
        },
      ],
    },
  ],
}

export default safeBrowsingConfig
