# SENTRI — Progress Report
*Cybersecurity Awareness Training System — Status as of 2026-08-03 (updated)*

## 1. Completed Modules (Curriculum Content)

All six planned training modules are fully built end-to-end: lesson content, an interactive branching scenario simulation, a one-time ungraded pre-test, a graded quiz, and — new this session — a one-time post-test that reuses the pre-test's exact item bank so learning gain is actually measurable. Lesson content for all six is genuinely authored, written per a formal instructional design spec (`SENTRI_Module_Content_Design.md`), with its 25-item quiz-to-lesson alignment matrix spot-checked against the live quiz question bank.

| # | Module | Scenario Simulation | Description |
|---|--------|---------------------|-------------|
| 1 | **Password Security** | Signup cards (live password strength/complexity checker), phishing email verification, account recovery | Teaches unique/strong passwords, credential stuffing risk, MFA, and breach response |
| 2 | **Phishing Awareness** | Inbox triage, fake login portal | Recognizing spoofed senders, urgency tactics, safe verification channels |
| 3 | **Malware Awareness** | Search results with bundled installers, fake alert pop-up, risky download | Ransomware, malicious downloads, unknown USB drives, patching |
| 4 | **Safe Browsing** | Research/search scenario, fake browser update, certificate warning | HTTPS misconceptions, public Wi-Fi risk, scam sites, fake update prompts |
| 5 | **Data Privacy** | Giveaway form, oversharing social post, spam flood | App permissions, data broker risk, oversharing consequences |
| 6 | **Online Safety** | Friend request vetting, chat escalation, report & block | Cyberbullying response, peer pressure online, stranger contact |

Each module's simulation uses a custom "video-pause-interact-branch" engine (not a multiple-choice menu) — students act on real-looking interface elements, get an in-context consequence for risky choices, and always reach the safe outcome before continuing.

All 60 assessment items (30 pre/post + 30 quiz) now carry a `topic` tag drawn from a single shared taxonomy, which is what makes per-topic mastery reporting and cross-module transfer analysis computable.

## 2. Platform Features Completed

**Student side:** real (non-static) dashboard and progress page; curriculum-order module unlocking; pre-test gate (one-time, ungraded, restart-safe if interrupted); lesson viewer with YouTube video slot and a persistent "Required Reading" indicator (must finish every section to unlock the scenario); quiz (server-graded, one attempt by default, always advances regardless of score); **post-test with a before/after comparison shown to the student on completion**; personal decision analytics (safe vs. risky choice counts) and a per-module learning-gain panel; a "Module 0" tutorial (frontend-only, always unlocked, not part of the graded curriculum); a game-like onboarding animation shown once before each module's scenario; a dashboard tip pointing new users at Module 0; scene-context labels (e.g. "Email Inbox," "Login Page") shown above each scenario.

**Admin side:** account management (create/reset/delete, with full cascading data cleanup on delete plus an audit log); **per-student section assignment** with section columns and filters on the Accounts table; Module Configuration (lesson content, quiz questions/settings, scenario branching, assignments); Quiz Manager; Scenario Manager with a "View Scenario Flow" diagram; **Analytics dashboard rebuilt around the Learning Analytics framework** (cohort learning gain, behaviour, transfer, 30-day activity trend, per-module topic mastery and item analysis), now **segmentable by class section**, **recomputed nightly on a schedule**, and **exportable as CSV or PDF**; **a recorded quiz retry/appeal path**; real dashboard with recent quiz activity and completion rates.

**Infrastructure:** Firebase Auth (role-based, forced password change + email verification on new accounts), Firestore with security rules enforcing per-role/per-owner access, Cloud Functions (TypeScript, v2) for all graded/authoritative logic, and an automated test suite on **both** ends of the stack.

## 3. Work Completed This Session

Four of the six items on the previous report's Known Gaps list were closed. Gaps 1 (record the videos) and 3 (migrate `firebase-admin` to v14) were explicitly deferred to separate work and are untouched here.

**Gap 5 — the legacy mock-data admin pages are gone.** `ModuleContentEditor` (`/admin/modules/editor`) and `ModulePreviewPage` (`/admin/modules/preview`) predated Module Configuration, read local mock content, and were reachable only by typing the URL. Pointing them at Firestore would have produced a second, competing lesson editor; they were removed instead, along with their routes, their mock fixtures, and the now-orphaned `CATEGORY_META` export they were the last consumer of. Module Configuration is the single lesson/scenario/quiz authoring surface.

**Gap 4 — a suppressed discrimination index now explains itself.** Item discrimination *D* is still, correctly, withheld below 10 attempts, where a 27% upper/lower split is noise. What changed is that "n/a" was indistinguishable from a bug. `itemAnalysis` now carries `attemptCount` and `minAttemptsForDiscrimination` on every item, and the dashboard reads `D: pending (4/10)` with a hover explaining how many more attempts it needs. The CSV export writes the shortfall in its own columns and leaves the *D* cell blank rather than `0` — a `0` would claim the item does not discriminate, which is a far stronger statement than "we cannot tell yet". The underlying gap (it needs a real cohort's data) is a fact about statistics, not a defect, and stays true.

**Gap 6 — the three "not started" enhancements are done.**

**6a. Cohort segmentation by section.** Accounts carry an optional `section` (a class group like `BSIT-3A`), settable by a student at registration and by an admin from the account page. `aggregateCohortAnalytics` takes an optional section and writes that group's rollup to its own `cohortAnalytics/section__<key>` document, so segmented and whole-class reports coexist rather than overwriting each other. The Analytics page gained a section picker; the Accounts table gained a Section column, a section filter, and section-aware search.

Three design decisions worth recording:

  - **Sections are matched on a normalized key, not the raw string.** `BSIT-3A`, `bsit 3a`, and `BSIT_3A` are one section, not three, while the label a human typed is preserved for display. The rule lives in one file per side of the stack (`functions/src/shared/sections.ts`, `src/utils/sections.js`) and both sides' test suites assert it against the same inputs, because a drift between them would silently show one section's numbers under another's name.
  - **Filtering happens against the account roster, in memory, not as a Firestore query.** Progress, quiz, decision, and response documents carry a uid but deliberately no section: sections get reassigned, and denormalizing one onto every telemetry row would make historic rows lie the moment a student moves. The roster is the one authority on who is in which group, and a section rollup reads it once.
  - A student with no section still counts in the whole-cohort rollup. Being unassigned is normal, not a reason to disappear from the class report.

**6b. Scheduled aggregation.** `scheduledAnalyticsAggregation` runs at 02:00 Asia/Manila and recomputes all six modules, the whole-cohort rollup, and one rollup per section in use. Before this, the dashboard's honest state on any morning was "as of whenever an admin last clicked Refresh". The scheduled run and the manual "Refresh All" share one code path (`aggregateAllAnalytics`), so the two can't drift in what they cover, and one unconfigured module can't turn the nightly pass into a silent no-op. On-demand refresh is deliberately kept — a schedule is the floor, not a replacement for wanting the current figure *now*, mid-defense. Deploying it needs the Cloud Scheduler API enabled once (noted in the README).

Reading is split from computing here (`readCohortSources` → `buildCohortDoc` → write) specifically so the nightly pass does **one** read of the underlying collections no matter how many sections exist. The obvious implementation — call `aggregateCohortAnalytics` once per section — would re-read every progress, quiz, decision, and response document per section, so four sections would mean five identical full-collection reads to produce five documents from the same data. That is a real Firestore cost and a real quota, for no benefit. `buildCohortDoc` is now pure, which is also what makes one read able to produce every group's rollup.

**6c. Exportable reports.** Five CSV exports from the Analytics page — cohort summary, module breakdown, topic mastery, item analysis, and the 30-day activity trend — plus a print stylesheet and a "Print / Save as PDF" button. Both paths are dependency-free: the CSV writer is thirty lines of RFC 4180 escaping (with a UTF-8 BOM so Excel on Windows doesn't mangle accented names), and the PDF path is the browser's own print dialog, which makes "Save as PDF" a real PDF export without shipping a PDF engine in the bundle. Filenames carry the section and the date, so repeated exports don't overwrite each other.

The exports **serialize** the server-computed aggregates; they never recompute anything. The moment an export derived a statistic itself, the exported figure and the on-screen figure would be two derivations of the same number, free to disagree — and the exported one is the one that ends up in the paper.

### A data-integrity defect found and fixed

Checking what happens when a test account is deleted turned up a real bug, present since the previous session: **`quiz_responses` was missing from the cascading delete.**

That collection holds one row per answered question and was added for item analysis. Because it was never added to `deleteStudentData`, deleting a student left every one of their per-question answers in the corpus, where it kept feeding topic mastery, item difficulty, and discrimination indefinitely. Nothing on screen revealed this. The account was gone from the roster, the totals looked plausible, and the item statistics were quietly wrong forever, with no way to tell which rows belonged to whom.

Two changes:

  - `quiz_responses` added to the cascade. Verified by temporarily reverting the one-line fix and confirming the new test fails with exactly one orphaned row, then restoring it. A test that has never been seen to fail is not evidence of anything.
  - **The cohort rollups now recompute on delete too.** The six module summaries already did, for exactly this reason; the cohort card is an equally cached singleton and was inconsistently left to go stale until the nightly job. `aggregateAllCohortScopes` was factored out so the delete path, the nightly job, and "Refresh All" all share it.

The new test (`accountManagement.test.ts`) sweeps **every** uid-bearing collection rather than spot-checking a few, since the failure mode here is precisely "somebody added a collection and forgot this list". It also asserts the audit log survives, which it must: the record that a deletion happened should outlive the deletion.

`deleteUserAccount` was redeployed with the fix.

### Retained for context — the previous session's work

The items below are numbered against *that* session's gap list, not the current one, and their figures are as-of-then. Nothing in this block changed this session.

**1. Lesson content is now genuinely admin-editable.** The `moduleLessons` collection used to store a model nothing read (a single `lessonContent` blob), while the student Lesson Viewer read hardcoded local files. The collection now stores the *student's* shape — video id, objectives, ordered reading sections, best practices, key takeaways, references — seeded from the real authored content in `src/data/moduleContent/`. `services/moduleLoader.js` reads it on the student path, so saving in the Lesson Content Editor changes what students see. The editor was rebuilt to match: sections are added, reordered, and removed directly, and the preview mirrors the viewer's own order.

**2. Scenario configuration reaches students.** Same problem, harder shape. `moduleScenarios` now stores the Scenario Engine's own `ModuleScenarioConfig`, and the admin editor edits that model directly with no translation layer. The important design decision is a **structural/editable split**: every word a student reads is admin-editable, but the wiring that makes a scenario playable — which scene component renders it, which interactive target maps to which choice, which choice is safe — is code-owned, shown read-only, and re-applied from the authored config on every read. A saved document therefore *cannot* produce an unplayable simulation, even after a future code change renames or rewires a scenario. The admin preview was rebuilt on the engine's real overlays rather than a parallel set of look-alike components.

**3. Video slots are drop-in.** Both the lesson video and each scenario's opening clip are now admin-editable fields accepting a pasted YouTube link (or a bare id, or a direct video file URL). `ScenarioPlayer` learned to render a YouTube embed as well as an inline `<video>`. Recording the videos and pasting their links is now genuinely the only remaining step — no code change.

**4. App Check is wired end-to-end and gated on a flag.** The client half already existed. Every callable now passes `enforceAppCheck`, driven by `APPCHECK_ENFORCED` in the functions environment (documented in the new `functions/.env.example`), and every invocation logs `appCheck: verified|absent` even while enforcement is off — so the rollout can be verified against real traffic before the flag is flipped, rather than locking users out blind. It ships **off**, because turning it on before a reCAPTCHA site key exists would break every user.

**5. Platform maintenance done.** Cloud Functions moved to the Node.js 22 runtime (Node 20 is decommissioned 2026-10-30), `firebase-functions` 5.1 → 7.3, `firebase-admin` 12 → 13, `@types/node` → 22. `firebase-admin` was deliberately held at 13 rather than 14: v14 removes the namespaced API this backend is written against, and that migration is a separate piece of work with no current benefit.

**6. Frontend test suite added.** Vitest + React Testing Library, sharing the app's own Vite config so tests resolve and transform modules exactly as the real build does. 64 tests covering the new integration seams (`loadModuleConfig`'s layering and its fallback behaviour under a Firestore failure, the lesson and scenario merge contracts), the assessment form's behaviour, and the pure validation/derivation logic.

**7. The Learning Analytics framework is implemented.** All of it:

  - **Post-test** — a new one-time assessment after each module's quiz, reusing the pre-test item bank so a normalized gain is interpretable. Reachable from the quiz result screen and from the Progress page.
  - **Server-side grading for both bookends** — a new `submitAssessment` callable. Grading moved off the client because per-question responses have to land somewhere no client can write, and because a post-test compared against a client-computed pre-test score is a gain anyone could manufacture.
  - **`quiz_responses`** — one document per answered question across pre-test, quiz, and post-test, carrying topic, correctness, and time spent.
  - **Duration capture** — `analyticsEvents.durationMs` (whole activities), `quiz_responses.durationMs` (single questions), `scenario_decision_records.duration_ms` (single decisions). Unmeasured durations are stored as `null`, never `0`, so they are excluded from averages rather than dragging them down.
  - **Kirkpatrick Level 3** — `attempt_number` on decision records makes **first-attempt safe rate** computable, which matters because the engine always eventually lets a student through, so an eventual-success rate would read 100% forever. Plus consequence trigger rate, time-to-decide, and the **fast-wrong vs slow-wrong** split.
  - **Normalized gain** — Hake's *g*, averaged per student rather than computed from cohort averages, with unpaired students and perfect pre-tests excluded rather than silently counted as zero gain.
  - **Item analysis** — classical difficulty (p-value) and discrimination index D on a 27% upper/lower split, with D suppressed below 10 attempts where the split is noise. Low-discrimination items are flagged in the dashboard as candidates for rewriting.
  - **Transfer analysis** — behavioural (first-attempt safe rate, early curriculum vs. late) and item-level (a topic deliberately measured in two modules; `public-wifi` appears in both Safe Browsing and Online Safety specifically so this is computable).

**8. Remaining enhancements delivered.** Trend/time-series analytics (30-day activity chart, CSS-only so it can't fail on a projector); cohort/class-level reporting via a new `aggregateCohortAnalytics` callable and dashboard card; an admin-grantable **quiz retry/appeal path** (`grantQuizRetry` — one extra attempt, requires a written reason, records the granting admin, leaves lesson/simulation progress intact, and can only ever raise the recorded score); and a mobile responsive polish pass with the app's three breakpoints now written down as a convention in `global.css`.

**Two real defects were found and fixed by the new tests**, which is the clearest argument for having written them:
  - The scenario validator required *exactly* one safe choice per scenario. Password Security's sign-up scenario legitimately has two (unique-and-strong vs. unique-but-weak passwords, with different feedback), so the rule would have marked that module permanently invalid and unsaveable. Corrected to *at least* one — zero is the real defect, since the engine only advances on a safe choice.
  - The backend's admin validators were still enforcing the old lesson and scenario shapes, so `updateLessonContent` and `updateScenarioConfiguration` would have rejected the very documents the app now writes.

## 4. Verification

Everything below was run to completion on the current tree:

| Check | Result |
|---|---|
| Frontend production build | passes |
| Frontend test suite (Vitest + RTL) | **82 passed** (was 64) |
| Cloud Functions typecheck + build | clean |
| Backend unit tests | **91 passed** (was 81) |
| Backend integration tests (Firestore + Auth emulators) | **70 passed** (was 56) |

**243 automated tests across both ends of the stack**, up from 201. The 42 added this session cover the new seams specifically:

  - **`functions/test/integration/cohortSegmentation.test.ts` (11 tests)** — the claim that matters most, and the one no unit test can make: two students in two sections, given deliberately different pre/post results, and each section's document must report only its own while the whole-cohort document reports both. Also covers matching a section however its label was typed, an unassigned student still counting class-wide, a section move being audit-logged with its before/after, clearing a section back to null, and non-admin callers being rejected on both new callables. One test drives the nightly job's body directly: it must cover every section without being told which ones exist, and modules that can't be aggregated must not take the cohort work down with them.
  - **`test/reporting.test.js` (18 tests)** and **`functions/test/unit/sections.test.ts` (10 tests)** — the section-key and document-id rules, written against identical inputs on both sides on purpose, since these two files are a deliberate duplication and their failure mode is silent. Plus CSV escaping (a section label containing a comma must not split a column), and the report builders' rule that an unmeasurable statistic exports as blank and never as `0`.

The pre-existing suites are unchanged and still pass, including the end-to-end assessment flow (pre-test → lesson → simulation → quiz → post-test → retry appeal) and the security-rules suite that loads the real `firestore.rules`.

### Deployed to production

`firebase deploy --only functions` and `firebase deploy --only firestore:rules` both completed against `capstone-c0628`. Three of the "create" operations in that deploy were **not** from this session:

  - `submitAssessment` — server-side grading for the pre-test and post-test
  - `grantQuizRetry` — the recorded retry/appeal path
  - `aggregateCohortAnalytics` — the cohort rollup

All three were written in the previous session and had never been deployed. The features they back were therefore not actually live until now, whatever the last report implied, and the `cohortAnalytics` / `quiz_responses` security rules they depend on went up in the same pass. Worth recording plainly: code that passes locally and code that is running are two different claims, and only the second one matters to a panelist clicking through the app.

New this session and now live: `setUserSection`, `listSections`, and `scheduledAnalyticsAggregation`.

### Verified against the live deployment

  - **Every new callable is up and correctly guarded.** `listSections`, `setUserSection`, `aggregateCohortAnalytics`, `submitAssessment`, and `grantQuizRetry` each answer an unauthenticated request with `401 UNAUTHENTICATED` and the app's own "You must be signed in." message, which is `requireAuth` running through `withCallable` in production rather than a generic platform rejection.
  - **`scheduledAnalyticsAggregation` refuses direct HTTP with 403.** Correct: a scheduled function should be invocable by Cloud Scheduler and nothing else.
  - **The registration page's new Section field renders correctly** in a real headless browser against the dev server: optional (no required marker), the app's own input and helper-text styling, `maxlength` 40, `aria-describedby` wired to the helper line, and its client-side validation rejecting `BSIT#3A` before any round trip. Zero console errors on the page.

  - **The admin Analytics page was driven end to end in a real headless browser** against the live project: admin sign-in, page load, section picker present, all five CSV buttons and the Print / Save as PDF button present, "Refresh Cohort" clicked (hitting the freshly deployed `aggregateCohortAnalytics` callable for real), the per-module heading and all six module cards rendered, and a Cohort Summary CSV actually downloaded and its contents read back. **Zero console errors** on the page.

**What the live dashboard currently shows:** 1 student in scope, 0 completed modules, and 0% or "not yet measurable" on every learning metric. This is the system correctly reporting an empty cohort, not a fault. Every figure on the page is waiting on the same input: students going through modules with both a pre-test and a post-test on record. Until that exists, the analytics are verified as *working* but not as *populated*, and the two should not be confused in the write-up.

A consequence worth noting: the new `D: pending (n/10)` state cannot be seen on screen yet either, because item analysis only lists items once responses exist. It is covered by tests and by the CSV export's column layout, but it has not been visually confirmed.

## 5. Known Gaps / Future Work

**No item on this list is unfinished code.** Every remaining entry is a manual check, a decision already taken, or a fact about data that only time and a real cohort can change. Items 1 and 3 are being handled as separate pieces of work. The backend is deployed and live as of this update.

1. **No real video content yet.** Every lesson and scenario has a working, fullscreen-capable video slot that is admin-editable end to end. Recording the videos and pasting their links into Module Configuration is the only remaining step — no code change required. *(Deferred to separate work this session.)*
2. **App Check enforcement ships off, by decision.** This is no longer an open gap; it is a choice not to enable a feature, recorded so nobody later reads it as neglected work. The code path is complete and tested on both ends (`enforceAppCheck` on every callable, `appCheck: verified|absent` on every log line, `initializeAppCheck` behind a site-key check on the client), and the rollout sequence is written down in `functions/.env.example` should that decision ever change. Nothing has to be removed for the app to run without it: with no site key set, App Check simply stays uninitialized and every call goes through unattested. The security posture this leaves is the one already in place — Firebase Auth plus the Firestore rules, with all authoritative logic behind admin-only callables.
3. **`firebase-admin` is held at v13.** v14 removes the namespaced API (`admin.firestore()`, `admin.auth()`) that this backend uses throughout. Migrating to the modular API is a mechanical but wide change across every repository file, worth doing on its own rather than bundled with feature work. *(Deferred to separate work this session.)*
4. **Item discrimination still needs a real cohort.** Difficulty is reported from the first response onward; *D* remains suppressed below 10 attempts, where an upper/lower split is noise rather than signal. The dashboard and the CSV export now say exactly how far short each item is (`D: pending (4/10)`) instead of a bare `n/a`, so this reads as "waiting for data" rather than as a defect — but the data itself only arrives when a class has been through.
5. **The cohort is empty, so the dashboard reports zeros.** The single largest gap between this system and a defensible result set, and it is not a software problem. Nothing in Awareness Improvement exists until students have *both* a pre-test and a post-test on record; behaviour and transfer need completed simulations; item discrimination needs 10 attempts per assessment; cross-module transfer needs decisions in at least two modules. For a defense demo, a handful of students taken end to end through two modules populates almost everything on the page. One student through one module populates nothing.

6. **Cloud Scheduler.** `scheduledAnalyticsAggregation` deployed successfully, which means the Cloud Scheduler API was already enabled or was enabled as part of that deploy. Its first run is 02:00 Asia/Manila; nothing depends on it having run, since every aggregate is still recomputable on demand.

   **Cost, since that is the deciding factor here:** this is one Cloud Scheduler job, and the first three per billing account are free. It fires once a day, against a free tier of 2,000,000 function invocations a month. Each run does a full read of the progress, quiz, decision, and response collections, so on a class-sized dataset it is on the order of a few thousand Firestore reads against a free tier of 50,000 reads *per day*. In other words the nightly job is expected to cost nothing, and the recompute it performs is the same one an admin already triggers by hand from the Analytics page. If even that is unwanted, deleting the `scheduledAnalyticsAggregation` export from `functions/src/index.ts` removes the schedule and leaves everything else working, since on-demand refresh was deliberately kept rather than replaced.

**Deliberate scope boundaries, recorded so they aren't mistaken for oversights:**

  - **The per-module cards are not section-filtered.** `moduleAnalytics` documents are keyed by module id alone. A per-section variant would double the aggregate documents to answer a question the cohort card's own module breakdown already answers per section. The heading on the page says so rather than leaving an admin to assume the filter reaches further than it does.
  - **A deleted student stays in a cohort rollup until the next recompute.** Deleting an account already recomputes all six `moduleAnalytics` documents immediately; the cohort rollups catch up on the next nightly run or the next manual refresh, within a day at worst.

---
*Generated from direct codebase inspection, a full local verification run (build, typecheck, 243 automated tests across both ends of the stack), a production deploy of the Cloud Functions and Firestore rules to `capstone-c0628`, and a browser-driven walkthrough of the live admin Analytics page. Not cross-checked against the original capstone paper, which was not available in this session. Updated 2026-08-03 after a session that closed Known Gaps 4, 5, and 6. Gaps 1 and 3 were deferred to separate work by request; App Check enforcement was declined by decision rather than deferred.*

*See also: `SENTRI_Analytics_Guide.md`, which explains what every figure on the Analytics page means, how it is derived, and what it deliberately refuses to claim.*
