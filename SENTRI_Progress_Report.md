# SENTRI — Progress Report
*Cybersecurity Awareness Training System — Status as of 2026-08-07*

## 1. Completed Modules (Curriculum Content)

All six planned training modules are fully built end-to-end: lesson content, an interactive branching scenario simulation, a one-time ungraded pre-test, and a graded quiz. The six per-module post-tests that used to sit after each quiz have been **replaced by a single end-of-curriculum final assessment** (see section 3). Lesson content for all six is genuinely authored, written per a formal instructional design spec (`SENTRI_Module_Content_Design.md`), with its 25-item quiz-to-lesson alignment matrix spot-checked against the live quiz question bank.

| # | Module | Scenario Simulation | Description |
|---|--------|---------------------|-------------|
| 1 | **Password Security** | Signup cards (live password strength/complexity checker), phishing email verification, account recovery | Teaches unique/strong passwords, credential stuffing risk, MFA, and breach response |
| 2 | **Phishing Awareness** | Inbox triage, fake login portal | Recognizing spoofed senders, urgency tactics, safe verification channels |
| 3 | **Malware Awareness** | Search results with bundled installers, fake alert pop-up, risky download | Ransomware, malicious downloads, unknown USB drives, patching |
| 4 | **Safe Browsing** | Research/search scenario, fake browser update, certificate warning | HTTPS misconceptions, public Wi-Fi risk, scam sites, fake update prompts |
| 5 | **Data Privacy** | Giveaway form, oversharing social post, spam flood | App permissions, data broker risk, oversharing consequences |
| 6 | **Online Safety** | Friend request vetting, chat escalation, report & block | Cyberbullying response, peer pressure online, stranger contact |

Each module's simulation uses a custom "video-pause-interact-branch" engine (not a multiple-choice menu) — students act on real-looking interface elements, get an in-context consequence for risky choices, and always reach the safe outcome before continuing.

The assessment inventory is now **30 pre-test items (5 per module), 30 quiz items (5 per module), and 18 final assessment items** seeded from the pre-test banks. Every item carries a `topic` tag drawn from a single shared taxonomy, which is what makes per-topic mastery reporting and cross-module transfer analysis computable. The live documents were missing those tags until 2026-08-07; see section 4.6.

## 2. Platform Features Completed

**Student side:** real (non-static) dashboard and progress page; curriculum-order module unlocking; pre-test gate (one-time, ungraded, restart-safe if interrupted); lesson viewer with YouTube video slot and a persistent "Required Reading" indicator (must finish every section to unlock the scenario); quiz (server-graded, one attempt by default, always advances regardless of score); **one end-of-curriculum final assessment** unlocked once all six modules are complete, with a before/after comparison shown on completion; **a gamification layer** (points, seven ranks, fifteen badges, daily streaks, class leaderboard); personal decision analytics and a per-module learning-gain panel, now split across three tabs on the Progress page (Overview, Achievements, Leaderboard); a "Module 0" tutorial (frontend-only, always unlocked, not part of the graded curriculum); **a skippable first-run walkthrough** that spotlights real elements on the page; a game-like onboarding animation shown once before each module's scenario; scene-context labels (e.g. "Email Inbox," "Login Page") shown above each scenario.

**Admin side:** account management (create/reset/delete, with cascading data cleanup on delete plus an audit log); Module Configuration (lesson content, quiz questions/settings, scenario branching, assignments); Quiz Manager; **Final Assessment Manager** (`/admin/final-assessment`, reusing the quiz question editor); Scenario Manager with a "View Scenario Flow" diagram; **Analytics dashboard built on the Learning Analytics framework** (cohort learning gain, behaviour, transfer, 30-day activity trend, per-module topic mastery, item analysis with a distractor breakdown), **recomputed nightly on a schedule** and **exportable as CSV or PDF**; **a recorded quiz retry/appeal path**; a first-run walkthrough of its own; real dashboard with recent quiz activity and completion rates.

**Chrome and presentation:** a single inline SVG icon set (`src/components/Icon`) replacing the emoji that used to label navigation, stat cards and buttons; a grouped sidebar rather than one flat column of links; a service worker for static-asset caching and offline resilience; a real favicon and apple-touch-icon.

**Infrastructure:** Firebase Auth (role-based, forced password change + email verification on new accounts), Firestore with security rules enforcing per-role/per-owner access, Cloud Functions (TypeScript, v2, Node 22) for all graded/authoritative logic, and an automated test suite on **both** ends of the stack.

## 3. Work Completed Since the 2026-08-03 Report

Four substantial changes and one removal, plus a bug fix in the unlock logic.

### 3.1 Six post-tests became one final assessment

The largest change, and the one with the most reach into the analytics.

Every module used to end with its own post-test re-administering that module's pre-test items minutes after its quiz. Six modules meant eighteen separate assessments per student, two of them per module identical. That is now **one test at the end of the whole curriculum**: 18 items, three drawn from each module's five-item pre-test bank, passing score 75%, two attempts by default, unlocked only when all six modules are complete (re-checked inside the submit transaction, so two tabs cannot both pass a stale read).

Two arguments for it, both defensible on their own:

  - It is far less testing, and the testing that remains is spread rather than stacked.
  - Recall a week after the lesson is better evidence of learning than recall five minutes after reading it.

**The gain claim survives because the item bank is seeded from the same six pre-test banks**, not written fresh — so Hake's *g* still compares one instrument against itself. Two caveats now attach to it and are written into the analytics guide rather than left for a panelist to find: it is a **3-of-5 subset** of the pre-test items (18 of 30), and an admin editing the questions afterward weakens the guarantee, which is why each student's gain is computed and **stored once at submit time** rather than recomputed on read.

**Per-module gain did not have to be given up.** Every final assessment answer row is written to `quizResponses` as `assessmentType: 'posttest'` carrying `sourceModuleId`, the module its item came from. `postScoresByStudent` in `metrics.ts` scores a student's rows for one module, so the module cards still report a pre/post movement even though no per-module post-test exists. This is the reason the change did not cost a single figure on the dashboard.

New backend module (`functions/src/modules/finalAssessment/`), two new callables (`submitFinalAssessment`, `updateFinalAssessment`), two new collections (`finalAssessment/config`, `finalAssessmentProgress/{uid}`) with rules that deny every client write to the results document, one new student page, one new admin page, and the removal of `StudentPostTestPage` and its route.

### 3.2 A gamification layer

Points, seven ranks (Trainee to Vanguard), fifteen badges, daily streaks, and a class leaderboard. New backend module (`functions/src/modules/gamification/`), three callables, three Firestore triggers, and a client component set plus a context provider.

The design decision worth recording is that **nothing increments**. The obvious implementation of "award 20 points for finishing a lesson" is an increment at the moment it happens, and it breaks in four situations this app already has: a retried trigger, an admin-granted quiz retry (which flips `quizCompleted` false then true again), an admin resetting a module, and every student who existed before the feature shipped. Instead `recomputeFromProgress` derives the whole score from a student's six progress rows every time. Run it once or fifty times and the answer is identical, and an account with existing history gets a correct score the first time it runs.

Three things are deliberately *not* derived:

  - **The streak**, because it depends on *when* a student showed up, which no progress document records. Days are Asia/Manila days, on a fixed +08:00 offset (the Philippines has not observed DST since 1978, so the shift is exact rather than an approximation).
  - **Badges**, which are unioned and never revoked. A badge records that something happened; an admin resetting a module does not un-happen the day the student first finished it.
  - **The final assessment's contribution**, which lives in its own collection and so needs its own trigger — without it the "Show Your Work" badge would wait for the student's next completed module step, which after the final assessment is never.

**The leaderboard is a callable, not a collection read.** Students never get blanket read access to each other's records; `getLeaderboard` returns exactly the columns a board needs (name, points, rank, streak, badge count) and nothing else about anyone. A caller who placed outside the returned rows still gets their own standing back, computed with a count aggregation rather than by paging the collection.

An earlier, separate badge system (`userBadges`) was absorbed and retired. Its two badges worth keeping moved into the catalog; the rules match was removed so the collection falls through to the default deny, and any leftover documents are inert.

### 3.3 Section segmentation was removed

The cohort segmentation delivered on 2026-08-03 has been taken back out: no `section` field on accounts, no `setUserSection` / `listSections` callables, no per-section cohort documents, no section picker on Analytics, no section column or filter on Accounts, and no `sections.ts` / `sections.js` key-normalization pair. `cohortAnalytics` is one document again (`current`), and `buildCohortDoc` is a plain function of its sources rather than a function of sources and a scope.

Recording this plainly because the previous report argues at length for a feature that no longer exists: **that section of the 2026-08-03 report is now history, not documentation.** What survived the removal is the shape it forced — reading is still split from computing (`readCohortSources` → `buildCohortDoc` → write), which is now justified by keeping the arithmetic testable against fixed inputs rather than by the per-section read cost it was originally for.

### 3.4 Field naming was migrated to camelCase throughout

`quiz_responses` → `quizResponses`, `scenario_decision_records` → `scenarioDecisionRecords`, and every `snake_case` field on a scenario config, decision record or progress document (`is_safe_choice` → `isSafeChoice`, `pretestScore` → `preTestScore`, and so on). This touched the Firestore rules, the six scenario config files, the scene components, the admin validators and models, the analytics metrics and repository, and the client services.

It is a wide, mechanical change with no behavioural intent, and its risk is exactly that: a missed rename is silent, because a query on a field that no longer exists returns zero rows rather than an error. The rules file, the delete cascade, and the aggregation queries were the three places that mattered, and all three moved together with the writers.

### 3.5 A stale-unlock bug in module reordering

`isUnlocked` is written once, at seed time or when the previous module is completed, and was never revisited. That is correct as long as curriculum order never changes — but an admin **can** reorder modules from ModulesPage, and that only ever writes to the `modules` collection, never to any student's progress documents. So unlocking a module by moving it to position 1 and then moving it back left it unlocked forever.

`reconcileUnlock` now compares one module's stored flag against what the *current* order implies and self-heals the stored value, so a given drift only has to correct itself once. A module the student has any real progress on is left exactly as stored: reordering must never look like it took something away that was already started. The admin-facing variant reconciles for display only and never writes, since an admin's client has no permission to update another student's progress document anyway.

### 3.6 Smaller items

  - **The first-run walkthrough** (`TourGuide`) spotlights real elements found by `data-tour` attributes rather than by CSS class names, which are hashed at build time and would silently stop matching. A step whose target is missing *or* CSS-hidden at the current viewport is dropped from the run rather than spotlighting nothing — that second condition was a fix this session, after hidden navbar chips under 480px produced a zero-size spotlight. "Seen" lives in localStorage, not on the profile: a walkthrough being watched is not worth a schema field, and the worst case of losing it is a 30 second tour a student can skip in one click.
  - **The emoji-to-SVG icon pass.** Emoji are drawn by the OS, so the same glyph is flat and orange on Windows and glossy and blue on macOS; they ignore `color`, they do not sit on a text baseline, and a screen reader announces them by Unicode name next to a label that already says the same thing. Replaced across navigation, stat cards and buttons. **Module identity icons are deliberately kept as emoji**: those are authored content, chosen per module in Module Configuration.
  - **The student dashboard is shorter.** It carried six stacked blocks, three of which answered "what do I do next" (a "What's Next" list, a "Module Progress" bar list, and the module grid that already showed both with the buttons attached). The redundant panels were removed rather than restyled, and the space now carries the rewards row.
  - **A service worker** caching static assets, skipping non-GET requests and any Firebase or googleapis host, falling back to `index.html` when offline. Registered only over HTTPS.
  - **Scope wording corrected** in the README: the audience is non-IT college students at TIP Manila, not K-12.

### 3.7 A second cascading-delete miss, found and fixed

`gamification` was added with the reward layer and not added to `deleteStudentData`. Deleting a student left their points document behind, and because the leaderboard is a straight ordered read of that collection, the deleted student **stayed on the board** — and recreating the same person produced a second row under the same name. Fixed, along with a defensive delete of the retired `userBadges` document.

This is the same failure mode as the `quiz_responses` miss recorded in the previous report, and it had by then happened twice. The class of bug is "somebody added a collection and forgot the list". It turned out to have happened a third time, with `finalAssessmentProgress`; both that fix and a rewrite of the test so the list is declared once rather than spot-checked are in section 4.2.

### Retained for context — earlier sessions' work

Unchanged since the previous report unless noted:

  - **Lesson and scenario content are genuinely admin-editable end to end.** `moduleLessons` and `moduleScenarios` store the student-facing shapes, seeded from the authored content, and the student path reads them. The scenario editor enforces a **structural/editable split**: every word a student reads is editable, but the wiring that makes a scenario playable (which scene component renders it, which target maps to which choice, which choice is safe) is code-owned, shown read-only, and re-applied on every read, so a saved document cannot produce an unplayable simulation.
  - **Video slots are drop-in.** Lesson and scenario video fields accept a pasted YouTube link, a bare id, or a direct file URL. Recording the videos remains the only step, with no code change.
  - **App Check is wired end to end and ships off**, behind `APPCHECK_ENFORCED`, with `appCheck: verified|absent` logged on every invocation so a rollout can be verified against real traffic before enforcement is flipped on.
  - **Platform maintenance.** Node 22 runtime, `firebase-functions` 7.3, `firebase-admin` 13, `@types/node` 22.
  - **The Learning Analytics framework**: server-side grading, per-question responses, duration capture (unmeasured durations stored as `null`, never `0`), Kirkpatrick Level 3 via first-attempt safe rate and the fast-wrong vs slow-wrong split, Hake's normalized gain averaged per student, classical item analysis with discrimination suppressed below 10 attempts, and transfer analysis both behavioural and item-level.
  - **The quiz retry/appeal path** (`grantQuizRetry`): one extra attempt, requires a written reason, records the granting admin, leaves lesson and simulation progress intact, and can only ever raise the recorded score.

## 4. Gap Closure Pass, 2026-08-07

Five of the ten Known Gaps in the previous revision were actual code. All five are closed below, plus a sixth defect the browser walkthrough turned up in the live data. The other five were never code and carry forward unchanged into section 6.

**4.1 The four failing integration tests are fixed, and the coverage they were standing in for now exists.** They tested the per-module post-test through `submitAssessment`, whose schema had been narrowed to `pretest` alone. Rather than patch them, the file was split along the seam the product change created:

  - `assessmentFlow.test.ts` keeps the module-level loop (pre-test, quiz, retry appeal). One test remains pointed at the removed path, asserting that `submitAssessment` genuinely rejects a post-test — that narrowing is a contract a stale client would hit, so it is checked rather than assumed. A second test now asserts that a module gain reads **null** rather than 0 for a student with no final assessment yet, which is the honest state for most of a cohort most of the time.
  - **`finalAssessmentFlow.test.ts` is new**, covering the end-to-end path the old tests no longer could: the gate holding until all six modules are complete, refusal while the assessment is closed, server-side grading, the gain computed against the six-pre-test average and frozen at submit time, one row per item attributed to its `sourceModuleId`, the attempt allowance, and the per-module gain and per-topic movement recovered from the final assessment. It deliberately uses `malware-awareness`, the one module no other suite writes to, because `aggregateModuleAnalytics` reads across every student and a shared module would make the numbers depend on test execution order.

**4.2 `finalAssessmentProgress` added to the delete cascade**, and the test that should have caught it rewritten. The collections are now declared once as data and both seeded and asserted from that declaration, so covering a new one is a single list entry rather than three edits someone can do two of. A new guard test asserts the seeding actually happened, because every other assertion in that block is "this document is gone", which passes trivially against a document that was never written. **The fix was confirmed to fail before it went in**: reverting the one line produced exactly one failure, naming `finalAssessmentProgress`.

**4.3 The distractor breakdown is now presentable.** It was a raw-id list with inline CSS and no export. Now:

  - Each choice shows **the text a student actually read**. Resolving an id to its wording needs the item bank, which only the server can reach, so `aggregateModuleAnalytics` assembles a lookup from the module's pre-test, its quiz, and the final assessment's items for that module, and passes it into `itemAnalysis`. Cost is three document reads per module, eighteen for a nightly pass, against the full-collection reads it already does. `metrics.ts` stays pure: the lookup is an argument, not a query.
  - **The key is marked, and it is taken from the response rows rather than the bank.** Every answer row records the key it was graded against. An item edited after students answered it therefore still reports against the key that was in force, instead of retroactively marking a different choice correct.
  - Text resolution is **best-effort by design**. An item deleted or rewritten since it was answered falls back to its id and still reports its count and share, because the counts come from the rows and are authoritative regardless.
  - Proper stylesheet, with the bar dropped at narrow widths (the same call the topic rows already made) and the key marked with a label rather than colour alone, so it survives a greyscale print.
  - **A sixth CSV export, Distractor Analysis**, one row per choice. A separate table rather than extra columns, because items have different numbers of choices and packing them across fixed columns would either truncate or leave most cells empty. Sorting it to find a row where "Is key" is no and "Times chosen" beats the keyed row is the fastest way to find a badly worded item.

**4.4 CSV vocabulary aligned with the screen.** "Average post-test score (%)" became "Average final assessment score (%)", "Students with a paired pre/post" became "Students with both a pre-test and a final assessment", the topic columns follow, and the Assessment column now renders the stored `posttest` as "Final assessment". The stored value is deliberately unchanged: pre/post item analysis compares identical items through that type, and renaming it would touch every query for a cosmetic gain.

**4.5 `timeLimitMinutes` removed entirely**, on the reading of the paper alignment review's B11 ("do not describe a timed assessment"). It was stored, validated and editable on both the module quiz (15 min) and the final assessment (30 min), and read by nothing: no countdown, no server-side cutoff, and the student was never even shown it. An admin could set a limit that did nothing.

Removed from both zod schemas, both TypeScript models, the quiz config seed, the final assessment seed, the JSDoc typedef, and both admin editors. **No data migration is needed**: neither schema is strict, so a client still sending the field is accepted and the value is dropped, which quietly cleans it out of stored documents on first save. The Quiz Summary card's "Estimated Completion Time" stays — it is an authoring aid, and its docblock now says so rather than describing itself as distinct from a limit that no longer exists.

### 4.6 The live item banks had no topic tags at all

Found by the browser walkthrough, not by any test: exporting Topic Mastery from the live project produced a header row and nothing else.

Reading all twelve banks directly confirmed it. **`modulePretests` and `moduleQuizzes`, all six modules, 5 questions each, zero `topic` fields** — 60 untagged items. The dashboard had been saying so on its face the whole time, labelling every item `pretest · untagged`. The authored content tags all 60, so this was never a content gap: the live documents were seeded from an older revision, and `getOrSeedDoc` only writes when a document is *missing*, so they could never pick the tags up on their own.

What it cost, none of it visible while the cohort is empty and all of it invisible-but-wrong once it isn't:

  - **Per-topic mastery could not be computed at all** — the feature that turns "the class scored 72%" into "the class still thinks HTTPS means trustworthy".
  - **Item-level cross-module transfer could not be computed.** It rests entirely on `public-wifi` appearing in two modules' banks, and it appeared in neither.
  - **The asymmetry was the dangerous part.** The final assessment was seeded later and *does* carry topics on all 18 items. So the "after" rows would have had topics and the "before" rows would not, and a topic gain needs both halves. It would have sat permanently null rather than obviously broken — a whole cohort run producing nothing, with no error anywhere.

**Fixed by backfill, deliberately surgical.** Both collections allow `update: if isAdmin()`, so this ran as the signed-in admin through the app's own Firebase instance rather than needing a temporary Cloud Function. Each live question was matched to an authored one by **normalized question text**, and written back with exactly one field added. Nothing else was touched, so an admin edit to wording, an explanation, or a correct answer would have survived; an unmatched or ambiguous question would have been reported and skipped rather than guessed at.

A dry run reported **60 of 60 matched, 0 unmatched, 0 ambiguous** — itself the evidence that these banks were untouched originals. Applied, then verified independently: all 60 tagged, every question's `correctChoiceId` still points at one of its own choices, no question lost its text, and **`public-wifi` now spans safe-browsing + online-safety**, so item-level transfer is computable for the first time.

**One residual, stated precisely.** `quizResponses.topic` is copied from the bank *at submit time*, so the five response rows already on record from the existing test account stay untagged. Topic Mastery therefore still exports empty today. Every future submission carries its topic — the chain is bank → `submitAssessment` → row, and the middle link is covered by `assessmentFlow.test.ts` asserting exactly that copy. Deleting the test account would purge the stale rows, and the delete cascade that does it is now correct (section 4.2).

## 5. Verification

Everything below was run to completion on the current tree, after the changes above:

| Check | Result | Before this pass |
|---|---|---|
| Frontend production build | passes | passes |
| Frontend test suite (Vitest + RTL) | **96 passed** | 91 passed |
| Cloud Functions typecheck (`tsc --noEmit`) | clean | clean |
| Backend unit tests (Jest) | **138 passed** | 133 passed |
| Backend integration tests (Firestore + Auth emulators) | **66 passed** | 55 passed, **4 failed** |

**300 automated tests, all passing.** The suite is green for the first time since the final assessment landed.

The 17 added here are all on the seams the gap closure touched: 5 on the choice distribution in `analytics.metrics.test.ts` (counting, key derivation, labelling, unanswered items, and the empty case), 5 on `distractorRows` and the assessment naming in `test/reporting.test.js`, 8 in the new `finalAssessmentFlow.test.ts`, plus the cascade seeding guard.

### Deployed to production

`firebase deploy --only functions` completed against `capstone-c0628` — 36 functions updated, deploy reported complete. This carries the delete-cascade fix, the choice-text lookup in the aggregation, and both schema changes. `firestore.rules` was not touched by this pass and did not need redeploying.

Previously verified live and unchanged: `submitFinalAssessment`, `updateFinalAssessment`, `getMyGamification`, `recordDailyVisit`, `getLeaderboard`, the three gamification triggers, and the nightly `scheduledAnalyticsAggregation`. `setUserSection` and `listSections` remain correctly absent.

**One operational note:** the answer distribution is computed at aggregation time, so it appears on a module only once that module has been re-aggregated since this deploy. Click Refresh All on the Analytics page, or wait for the 02:00 nightly job.

### Browser walkthrough against the live project, 2026-08-07

Driven headless against `capstone-c0628` with a real admin sign-in. **Zero console errors across every page and every interaction.**

| Checked | Result |
|---|---|
| Admin sign-in, dashboard, grouped sidebar, SVG icon set | renders |
| First-run tour | 5 live steps, 4 correctly spotlit on real elements, unmounts on "Get started" |
| Final Assessment Manager | **no time-limit field**, exactly 2 number inputs, 18 seeded questions, labels are Title / Passing Score / Attempts Allowed / Instructions |
| Analytics: six CSV buttons incl. **Distractor Analysis** | present |
| Analytics: "Avg. final assessment", no stale "Avg. post-test", no removed section picker | correct |
| **Refresh All** against live data | completed in ~20s, no errors |
| **"Where the answers went"** | **renders against real response data**, with real choice text and the key marked |
| `D: pending (1/10)` | renders |
| CSV exports (cohort, topic, item, distractor) | all download; new vocabulary correct; distractor rows carry real choice text |

Two things this pass found, one fixed and one open:

**Fixed: the admin tour still described a removed feature.** Step 4 read "Accounts and class sections … assign students to sections", and step 5 promised "per-section rollups". Sections were removed on 2026-08-06. The copy was corrected, the Content step now also names Final Assessment, and the tour was re-run in the browser to confirm.

**Fixed: the live item banks carried no topic tags at all.** Sixty untagged questions across twelve documents, silently disabling per-topic reporting. See section 4.6.

### Still not verified

The student half. It needs an account that has finished all six modules and taken the final assessment, and no such account exists — creating one writes real data to the cohort. So the final assessment page in its available and completed states, the leaderboard with real entries, and the rank/streak/badge components against real data all remain unclicked.

## 6. Known Gaps / Future Work

The five code gaps from the previous revision were closed on 2026-08-07 (section 4), and the live defect the browser walkthrough turned up was fixed the same day (section 4.6). Nothing on this list is unfinished code.

1. **No real video content yet.** Every lesson and scenario has a working, fullscreen-capable, admin-editable video slot. Recording the videos and pasting their links is the only remaining step, with no code change required.

2. **App Check enforcement ships off, by decision.** Not an open gap; a choice recorded so nobody later reads it as neglected work. The code path is complete on both ends and the rollout sequence is written down in `functions/.env.example`. With no site key set, App Check stays uninitialized and every call goes through unattested. The security posture that leaves is the one already in place: Firebase Auth plus the Firestore rules, with all authoritative logic behind admin-only callables.

3. **`firebase-admin` is held at v13.** v14 removes the namespaced API (`admin.firestore()`, `admin.auth()`) this backend uses throughout. A mechanical but wide change, worth doing on its own rather than bundled with feature work.

4. **Item discrimination still needs a real cohort.** Difficulty is reported from the first response onward; *D* stays suppressed below 10 attempts, where an upper/lower split is noise. The dashboard and CSV say exactly how far short each item is (`D: pending (4/10)`), so this reads as "waiting for data" rather than as a defect.

5. **The cohort is empty, and the final assessment made that harder, not easier.** Under the old design a post-test landed after module one, so a partial run produced a gain. Now nothing does: **the entire Awareness Improvement section stays empty until a student finishes all six modules and takes the final assessment.** Behaviour, transfer, topic mastery and completion still fill in from module one onward. For a defense demo this means a handful of students taken all the way through, not partway. This is the single largest gap between the system and a defensible result set, and it is not a software problem.

6. **The paper still contradicts the system in places.** Tracked separately in `SENTRI_Paper_Alignment_Review.md`, not here. Two of its findings were affected by this pass: B11 (time limits configured but never enforced) is now resolved in the code's favour, since the field no longer exists to describe. Everything else in that document stands.

**Deliberate scope boundaries, recorded so they aren't mistaken for oversights:**

  - **The service worker caches aggressively and versions by hand** (`sentri-v1`). A deploy that changes an asset filename is fine, since Vite hashes them; a deploy that changes `index.html` alone relies on the cache-first fallback being refreshed. Not a problem at this scale, but it is a manual bump if it ever misbehaves.
  - **The leaderboard is public within the class**, which the paper's ethics section will need to reconcile (see `SENTRI_Paper_Alignment_Review.md`, item B6). The code is defensible here: no scores or analytics are exposed, only display name, points, rank, streak and badge count, and the board is served by a callable rather than by opening the collection.
  - **Assessments are untimed, now by decision rather than by omission.** See section 4.5. Nothing counts down anywhere in the system, and there is no longer a setting that implies otherwise.
  - **Choice text on the answer distribution is best-effort, not guaranteed.** An item edited or deleted after it was answered shows its raw id. The alternative would be denormalizing every choice's wording onto every response row, which would make historic rows lie the moment an admin fixed a typo. The counts are what matter and they come from the rows.

---
*Generated from direct codebase inspection, a full local verification run (build, typecheck, 300 automated tests across both ends of the stack, all passing), a production deploy of the Cloud Functions to `capstone-c0628`, and a headless browser walkthrough of the live admin UI signed in as a real administrator. Updated 2026-08-07 for the final assessment, the gamification layer, the removal of section segmentation, the camelCase field migration, the module-reorder unlock fix, a pass that closed all five code-level Known Gaps, and the walkthrough that verified them and turned up the untagged item banks.*

*See also: `SENTRI_Analytics_Guide.md`, which explains what every figure on the Analytics page means and what it deliberately refuses to claim; and `SENTRI_Paper_Alignment_Review.md`, which is a separate review of where the capstone paper and the built system currently disagree.*
