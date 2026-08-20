# SENTRI: Complete Codebase Guide

*Written from a full read of the repository at commit `09ce937` on 2026-08-20. Every claim here was verified against the actual files, not inferred.*

**Who this is for.** A team member who needs to answer questions about this codebase without having written every line of it. Read Part 1 and Part 7 at minimum. Part 7 is the stack defence, and it is the part you will actually be asked about.

---

## Table of contents

1. [The project in numbers](#part-1-the-project-in-numbers)
2. [Repository map](#part-2-repository-map)
3. [The frontend, layer by layer](#part-3-the-frontend-layer-by-layer)
4. [The backend, layer by layer](#part-4-the-backend-layer-by-layer)
5. [The Firestore Security Rules, line by line](#part-5-the-firestore-security-rules)
6. [Testing](#part-6-testing)
7. [Stack decisions and how to defend them](#part-7-stack-decisions-and-how-to-defend-them)
8. [Known weak spots, and honest answers](#part-8-known-weak-spots-and-honest-answers)
9. [Ten questions and answers](#part-9-ten-questions-and-answers)

---

# Part 1: The project in numbers

| Measure | Value |
|---|---|
| Frontend JavaScript / JSX | ~22,500 lines across 188 files |
| Frontend CSS (CSS Modules) | ~15,500 lines |
| Backend TypeScript | ~6,500 lines across 56 files |
| Test code | ~4,400 lines |
| Firestore Security Rules | 289 lines |
| Firestore collections | 20 |
| Deployed Cloud Functions | 36 |
| Automated tests | 97 frontend, 138 backend unit, 66 backend integration |
| Training modules | 6, plus an ungraded tutorial |
| Interactive scenario scenes | 16 |
| Assessment items | 30 pre-test, 30 quiz, 18 final assessment |

**Two languages, deliberately.** The frontend is JavaScript; the backend is TypeScript. That is not an accident and it is a fair question. See Part 7.

---

# Part 2: Repository map

```
SENTRI/
├── index.html              Vite entry point. Also registers the service worker.
├── vite.config.js          Build config + Vitest config (one file, on purpose)
├── firebase.json           Firebase deploy config (functions + firestore rules)
├── firestore.rules         289 lines of database access control
├── .firebaserc             Project alias -> capstone-c0628
├── .env / .env.example     Firebase web config (public values) + reCAPTCHA key
│
├── public/                 Static assets served as-is
│   ├── sw.js               Service worker (offline static caching)
│   ├── favicon.svg
│   └── logo.png
│
├── src/                    THE FRONTEND
│   ├── main.jsx            React root; mounts App
│   ├── App.jsx             Providers (Auth, Gamification) + Router
│   ├── routes/AppRouter.jsx    All routes + the ProtectedRoute gate chain
│   ├── context/            AuthContext, GamificationContext
│   ├── services/           17 files. The ONLY layer that talks to Firebase.
│   ├── hooks/              15 files. React state wrappers over services.
│   ├── components/         26 shared UI components
│   ├── features/           Self-contained feature areas (scenario, admin editors)
│   ├── pages/              70 files. One folder per route.
│   ├── data/               Authored content (lessons, pre-tests, final assessment)
│   ├── utils/              Pure helpers (CSV export, password policy, time)
│   └── styles/global.css   Design tokens (colours, spacing, breakpoints)
│
├── functions/              THE BACKEND
│   ├── src/
│   │   ├── index.ts        Re-exports every function. The deploy manifest.
│   │   ├── shared/         8 files used by every module
│   │   ├── auth/           Account management
│   │   └── modules/        9 feature modules, each with the same 5 files
│   └── test/
│       ├── unit/           8 suites, no emulator needed
│       └── integration/    5 suites, run against Firestore + Auth emulators
│
└── test/                   Frontend tests (Vitest + React Testing Library)
```

**The one structural idea worth knowing.** Both halves of the codebase are organised the same way: *a layer that talks to the outside world, a layer that holds logic, and a layer that holds nothing but data shapes.* On the frontend that is services / hooks / components. On the backend it is repository / service / controller. If you understand that sentence you can find anything in this repo.

---

# Part 3: The frontend, layer by layer

## The layering rule

```
Pages / Components   (what the user sees)
        ↓  calls
      Hooks          (React state: loading, error, saving, draft)
        ↓  calls
     Services        (the only code that imports Firebase)
        ↓
      Firebase
```

**A component never imports Firebase directly.** If you want to prove the layering is real, `src/services/firebase.js` is imported by other service files and by essentially nothing else. That is the seam: swap Firebase for something else and only `src/services/` changes.

## `src/services/` — the Firebase boundary (17 files)

| File | Responsibility |
|---|---|
| `firebase.js` | Initializes the Firebase app, Auth, Firestore, Functions, App Check. Exports `auth`, `db`, `functions`. |
| `firestoreDoc.js` | Shared low-level helpers: `getOrSeedDoc`, `overwriteDoc`, `mergeDoc`, plus friendly error translation. |
| `authService.js` | Login, logout, registration, password reset, email verification. |
| `adminService.js` | Calls the account-management Cloud Functions. |
| `moduleService.js` / `lessonService.js` / `scenarioService.js` / `quizService.js` / `assignmentService.js` | One per curriculum collection. Read, seed, and save module content. |
| `moduleLoader.js` | Assembles everything one student page needs for one module. |
| `moduleProgressService.js` | A student's progress rows, plus the unlock reconciliation logic. |
| `assessmentService.js` / `finalAssessmentService.js` | Pre-test and final assessment. |
| `analyticsService.js` / `analyticsEventService.js` | Reads aggregates; records activity events. |
| `gamificationService.js` | Points, badges, leaderboard (all via callables). |
| `callableErrors.js` | Turns a raw Cloud Functions error into a message a human can read. |

### Two patterns in this layer worth being able to explain

**1. Lazy seeding (`getOrSeedDoc`).** There is no separate database seed script. The first time anyone opens a module, the service reads the Firestore document; if it does not exist, it writes the authored default from `src/data/` and returns that. Every curriculum collection works this way.

> *Why it is done this way:* a seed script is a second thing that must be run, in the right order, against the right project, and it silently rots when the content changes. Lazy seeding means the content in the repo and the content in the database cannot drift on first use. The tradeoff, which you should state if asked, is that the seed content ships inside the client bundle.

**2. The structural / editable split (`scenarioService.js`).** A scenario document has two kinds of field. **Editable:** every word a student reads (`scenarioTitle`, `choiceText`, `feedbackText`, and so on). **Structural:** the wiring that makes it playable (`scene`, which component renders it; `target`, which clickable element maps to which choice; `isSafeChoice`). On every read, `mergeScenarioConfig` layers the admin's saved text over the code-owned structure and re-applies the structural fields from the authored config.

> *Why:* it makes it impossible for an admin to save a broken simulation. They can rewrite every word; they cannot accidentally point a choice at a button that does not exist. There is also a `contentVersion` field (currently 3) so that if the authored structure changes incompatibly, old stored documents are discarded rather than merged into something inconsistent.

## `src/hooks/` — React state (15 files)

Hooks wrap services with the loading / error / success lifecycle so pages do not repeat it.

The one worth knowing by name is **`useDraftResource.js`**. Every admin editor (module overview, lesson, scenario, quiz, assignments) needs the same behaviour: fetch, hold a draft copy, track whether it is dirty, save, cancel, reset, retry. That is written once here, and each domain hook (`useLesson`, `useScenario`, `useQuiz`) wraps it with its own field-specific update actions and validation.

## `src/features/scenario/` — the simulation engine

This is the most substantial piece of frontend logic in the project, and the part most likely to be asked about because it is what makes SENTRI different from a quiz app.

```
features/scenario/
├── engine/          THE LIVE ENGINE
│   ├── useScenarioEngine.js   The state machine
│   ├── ScenarioEngine.jsx     Orchestrator
│   ├── ScenarioPlayer.jsx     Video / poster before a scene
│   ├── FeedbackPanel.jsx      Post-decision feedback + retry lock
│   ├── ConsequenceOverlay.jsx Illustrated consequence
│   ├── InteractiveTarget.jsx  A clickable hotspot inside a scene
│   └── sceneLabels.js         "Email Inbox", "Login Page" context labels
├── scenes/          16 bespoke scene components, grouped by module
├── frames/          BrowserChrome, PhoneFrame, DesktopChrome, URLInspector
├── configs/         6 config files: the scenarios, choices, and feedback text
├── components/      LoadingScreen only (the rest was the deleted v1 set)
├── styles/sketch.css  The hand-drawn storyboard visual treatment
└── services/scenarioDecisionService.js  Writes decision records
```

### The state machine

```
loading → playing → paused_interactive → resolving → feedback
                          ↑                              │
                          └──────── retry ───────────────┤
                                                         ↓
                                                     advancing
                                                         ↓
                                        next scenario, or complete
```

**What each state means in plain language:**
- `loading` — brief beat before the scene appears
- `playing` — the opening clip or poster. If a real video URL is configured, the engine *waits for the student to press Start* rather than timing out, so a 40-second clip is not cut off after one second
- `paused_interactive` — the scene is live and the student can click. **The clock for time-to-decide starts here**, and restarts on a retry, so a retry is timed from the retry
- `resolving` — the choice landed, brief transition
- `feedback` — explanation, plus the consequence if the choice was risky. The Try Again button is locked for 5 seconds, or until a configured consequence clip finishes
- `advancing` — moving to the next scene

### Three design decisions in this engine that are worth defending

1. **Every attempt is recorded, not just the successful one.** The engine always eventually lets a student reach the safe outcome. If only the final decision were stored, the safe rate would read 100% forever and mean nothing. Storing `attemptNumber` is what makes "did they get it right *first* time" answerable.
2. **Replays record nothing.** If a student re-enters a simulation they already completed, `isReplay` is true and no decision documents are written. The behavioural statistics therefore always describe the first genuine attempt. A clean replay still earns its badge, through a separate `simulationFlawless` flag on the progress record rather than through the analytics.
3. **Scenes never touch Firestore or timers.** A scene component receives everything it needs from the engine hook. That is why adding a seventh module would mean adding scene components and a config file, and changing `ScenarioEngine` not at all.

### A note on this folder's history

This feature was rewritten once, and until 2026-08-20 both generations were still in the tree: a `components/` and `hooks/` implementation kept alive by an unused barrel file at `src/features/scenario/index.js`, alongside the current `engine/` implementation. Two files were named `ScenarioEngine.jsx`, which is confusing to anyone reading the repo cold.

**The old implementation has been deleted.** Twenty-six files went: the barrel, the v1 engine and hook, its type constants, and nine component and CSS pairs. `components/LoadingScreen` was kept, because it is genuinely used by `ScenarioRunnerPage`. Verified before deleting by resolving every import path (the v1 and v2 components shared file names, so a naive text search wrongly suggested the v1 stylesheets were still in use) and by checking for string references; verified after by a clean production build, the full frontend suite still at 97 passing, and a reachability scan reporting **197 files scanned, 197 live, 0 dead**.

The live engine is `engine/` plus `frames/` plus `scenes/`, and it is now the only one.

## `src/pages/` and `src/components/`

Pages are one folder per route, each with a `.jsx` and a `.module.css`. Components are the 26 reusable pieces: `Button`, `Card`, `Modal`, `Input`, `Icon`, `Sidebar`, `Navbar`, `TourGuide`, the `Gamification` set, and the gate components.

**CSS Modules** means `styles.title` in a component compiles to a globally unique class name at build time, so two components can both have a `.title` class without colliding. Shared design tokens (the gold and navy palette, spacing scale, breakpoints) live in `src/styles/global.css` as CSS custom properties.

**`components/Icon`** is a single inline SVG icon set. It replaced emoji used as interface icons, because emoji are rendered by the operating system, so the same character looks different on Windows and macOS, ignores your colour settings, and gets announced by screen readers under its Unicode name.

---

# Part 4: The backend, layer by layer

## The five-file module pattern

Every backend feature module contains exactly the same five files. This is the single most important thing to know about the backend, because once you know it you can navigate any module.

| File | Contains | Rule |
|---|---|---|
| `controllers.ts` | The `onCall` / trigger exports | Thin. Authenticate, validate, delegate. No business logic. |
| `service.ts` | The actual logic | **Never imports the Functions runtime.** Pure-ish, testable. |
| `repository.ts` | Firestore reads and writes | The only file that touches the database. |
| `models.ts` | TypeScript interfaces | Types only. No behaviour. |
| `validators.ts` | Zod schemas for every input | One schema per callable. |

A request flows: **controller → validate → service → repository → Firestore**, and back.

> *Why this structure:* it means business logic can be unit-tested without a database or a Functions emulator, which is exactly why there are 138 backend unit tests that run in ten seconds. `metrics.ts`, which holds every statistical formula, imports nothing and touches nothing, so each formula is tested against fixed inputs.

## The nine modules

| Module | What it owns |
|---|---|
| `auth/` | Account creation, deletion, password reset, registration, audit log |
| `modules/admin/` | Content configuration (lessons, quizzes, scenarios, assignments) |
| `modules/progress/` | Progress records, module unlocking, the quiz retry appeal |
| `modules/quiz/` | Serving the quiz without answers, and grading it |
| `modules/assessment/` | The per-module pre-test |
| `modules/finalAssessment/` | The end-of-curriculum assessment and normalized gain |
| `modules/scenario/` | Recording simulation decisions |
| `modules/analytics/` | Every statistic, the aggregates, the nightly job |
| `modules/gamification/` | Points, ranks, badges, streaks, leaderboard |

## `functions/src/shared/` — used by everything

| File | Purpose |
|---|---|
| `admin.ts` | One Admin SDK instance, guarded against double-init. Exports `db` and `authAdmin`. |
| `withCallable.ts` | **The wrapper every callable goes through.** See below. |
| `authGuards.ts` | `requireAuth`, `requireAdmin`, `resolveTargetUid`. |
| `errors.ts` | `AppError`, a Functions-runtime-agnostic error type. |
| `validation.ts` | `parseOrThrow`, turning a Zod failure into an `AppError`. |
| `constants.ts` | The 20 collection names, the six module ids, roles. |
| `moduleGuards.ts` | "Does this module exist", "what comes next". |
| `logger.ts` | Structured logging with a consistent field shape. |

### `withCallable.ts` — worth understanding properly

Every single callable is wrapped by `defineCallable`. It does four things:

1. **Times the invocation** and writes a structured log line with `function`, `uid`, `moduleId`, `durationMs`, `outcome`, and whether App Check was verified.
2. **Translates `AppError` into `HttpsError`** with the same code and message, so service code never imports the Functions runtime.
3. **Catches anything unexpected**, logs the full error with its stack *server-side only*, and returns a generic `internal` error to the client. **No internal detail, no stack trace, ever crosses the wire.**
4. **Applies App Check enforcement** from a deployment-level environment flag.

> *If asked why a wrapper:* without it, error handling and logging would be copy-pasted into 30-odd functions, and the copy that gets it wrong is the one that leaks a stack trace to a user.

### `authGuards.ts` — one rule that matters

`requireAdmin` looks the caller's role up **fresh from `users/{uid}` in Firestore on every call.** It never trusts a role sent by the client, and it does not rely on a custom claim that could be stale. `resolveTargetUid` prevents a student from passing someone else's user ID to act on their behalf: the caller gets their own uid unless they are an admin.

## Where the interesting logic lives

- **`analytics/metrics.ts` (566 lines).** Every statistical formula: Hake's normalized gain, topic mastery, item difficulty and discrimination, the distractor breakdown, behavioural metrics, transfer analysis. **Pure functions, zero I/O.** This file is the answer to "where does that number come from".
- **`analytics/service.ts` (613 lines).** Fetches raw documents, calls the maths, writes the aggregates. Deliberately split as `readCohortSources → buildCohortDoc → write` so the arithmetic can be tested against fixed inputs.
- **`gamification/catalog.ts` (291 lines).** The reward rulebook as pure data: point values, seven ranks, fifteen badge definitions each expressed as a predicate over a totals object.
- **`gamification/service.ts`.** Points are **recomputed from progress, never incremented.** Run it once or fifty times and the answer is identical. That is what makes it safe against a retried trigger, an admin-granted retry, an admin reset, and accounts that existed before the feature shipped.

## The four Firestore triggers

Triggers are not called by anyone. They watch a collection and fire on write.

| Trigger | Watches | Does |
|---|---|---|
| `updateLearningAnalytics` | `scenarioDecisionRecords` | Rolls one decision into that student's safe/risky totals |
| `updateGamificationOnBehaviour` | `learningAnalytics` | Recomputes rewards |
| `updateGamificationOnProgress` | `moduleProgress` | Recomputes rewards, advances streak |
| `updateGamificationOnFinalAssessment` | `finalAssessmentProgress` | Recomputes rewards |

The first two form a chain: one decision write triggers an analytics update, which triggers a rewards update. One click, two automatic server-side steps.

Plus one scheduled function: `scheduledAnalyticsAggregation`, at 02:00 Asia/Manila, sharing its code path with the admin's manual Refresh All.

---

# Part 5: The Firestore Security Rules

289 lines. This is the file most likely to get a direct question, because it *is* the security model for everything the browser touches.

## The two helper functions

```
isAdmin()          → reads users/{uid} and checks role == 'admin'
isRealModuleId(id) → is this one of the six real module ids
```

`isRealModuleId` exists to scope the lazy-seed exception. A student may create a module document that does not exist yet, but only for one of six known ids, never an arbitrary document.

## The access pattern, collection by collection

| Collection | Read | Write | Why |
|---|---|---|---|
| `users` | Own profile only | **Nobody** | Accounts are created and changed only by Cloud Functions. |
| `auditLogs` | **Nobody** | **Nobody** | Read through an admin-only callable. The record of a deletion must outlive it. |
| `modules` | Any signed-in user | Admin | Order and status. Nothing sensitive. |
| `moduleLessons`, `moduleScenarios` | Any signed-in user | Admin | Nothing answer-bearing. |
| `moduleQuizzes`, `modulePretests`, `finalAssessment` | **Admin only** (plus a not-found read) | Admin | **These carry the answer key.** |
| `moduleProgress` | Own row, or admin | Own row, create/update only, never delete | The student's browser marks their own lesson read. |
| `scenarioDecisionRecords` | Own | Create own; update **only** `feedbackViewed` | A decision is immutable once written. |
| `quizAttempts`, `quizResponses` | Admin | **Nobody** | The evidence learning gain is computed from. |
| `analyticsEvents` | **Nobody** | **Nobody** | Written by a callable only. |
| `moduleAnalytics`, `learningAnalytics`, `cohortAnalytics` | Admin | **Nobody** | Derived aggregates. |
| `studentAnalytics` | Own, or admin | **Nobody** | |
| `gamification` | Own, or admin | **Nobody** | A student able to write here could award themselves a rank. |
| everything else | **Deny** | **Deny** | Explicit default deny at the bottom. |

## Four rule decisions worth being able to explain

**1. Why is `allow write: if false` on so many collections?**
Because those collections are written only by Cloud Functions through the Admin SDK, which bypasses these rules entirely. Closing them to clients is not a restriction on the app; it is a statement that no browser has any business writing them. Anything holding a grade or a research figure is in this group.

**2. Why can students read `modules` but not `moduleQuizzes`?**
`modules` holds order and status. `moduleQuizzes` holds `correctChoiceId` next to every question. The student's quiz page calls `getQuizForStudent`, a Cloud Function that strips the answer and the explanation server-side.

**3. What is `resource == null` doing in the item-bank read rules?**
It permits a read that can only ever observe "this document does not exist". That is what makes the lazy seed reachable: a client has to observe not-found before it knows to create the seed. It can never return real content, so it leaks nothing.

**4. Why can a student update `feedbackViewed` but nothing else on a decision record?**
`request.resource.data.diff(resource.data).affectedKeys().hasOnly(['feedbackViewed'])` restricts the update to exactly that one field. The student needs to record that they dismissed the feedback panel. They must not be able to go back and change whether their choice was safe.

**5. Why is the leaderboard a callable instead of opening `gamification` for reads?**
Opening the collection would expose every classmate's full record, including their totals, to satisfy a view that shows five names and five numbers. `getLeaderboard` returns exactly the columns a board needs: nickname, points, rank, streak, badge count.

---

# Part 6: Testing

| Suite | Count | Runs against | Command |
|---|---|---|---|
| Frontend (Vitest + React Testing Library) | 97 | jsdom | `npm test` |
| Backend unit (Jest) | 138 | nothing, pure functions | `npm test` in `functions/` |
| Backend integration (Jest) | 66 | Firestore + Auth emulators | `npm run test:integration` |

**Frontend tests reuse `vite.config.js`**, so they resolve modules and transform JSX and CSS Modules exactly the way the real build does. There is no second toolchain to drift.

**The integration suites** cover the end-to-end assessment flow, the progress flow, account management including the cascading delete, the final assessment flow, and a suite that loads the **real `firestore.rules` file** and asserts against it. That last one matters: it means the security rules are tested, not just written.

**One testing principle used here worth quoting.** When the cascading-delete bug was fixed, the fix was verified by *temporarily reverting it* and confirming the new test failed with exactly one orphaned collection, then restoring it. A test that has never been seen to fail is not evidence of anything.

---

# Part 7: Stack decisions and how to defend them

This is the section to rehearse.

## Why React?

- **Component reuse is the actual argument here.** The scenario decision overlay, the interactive hotspot, the feedback panel: written once, reused across all 16 scenes. In a page-per-screen approach that is 16 copies.
- **The app is stateful in a way that suits it.** A simulation has a state machine, a timer, a target registry, and a decision history all live at once. React's model of state driving what renders fits that directly.
- **A single-page application does not reload between screens**, which matters when a student is mid-simulation.
- **Practical:** the largest ecosystem and documentation base of any frontend framework, which matters for a student team that has to learn while building.

> *If asked "why not Vue or Angular?"* Either would work. React was chosen for ecosystem size and because the team could get help fastest. Angular brings dependency injection and RxJS, which is more framework than a project this size needs. This is a defensible preference, not a technical necessity, and saying so is stronger than inventing a reason.

## Why Vite instead of Create React App?

CRA is effectively unmaintained. Vite starts a dev server in under a second regardless of project size, because it serves native ES modules in development instead of bundling first. It also produces the production build, and it is the same config file the test runner uses.

## Why Firebase?

The honest, strong answer is **integration**, not any single feature:

- **Authentication** with email verification and password reset, working, not built from scratch. Rolling your own auth is where student projects leak credentials.
- **Firestore** with real-time updates and offline persistence.
- **Cloud Functions** for trusted server-side logic, with no server to provision or patch.
- **Security Rules** as a declarative access layer enforced by the database itself, not by application code that can be bypassed.
- **Cloud Scheduler** for the nightly job.
- **A free tier** a student project can actually run on: 50,000 Firestore reads per day, 2 million function invocations per month.

> *If asked "why not a traditional stack, MySQL and PHP, or Node and Express?"* You would have to build authentication, session management, password reset, and an access-control layer yourself, then find hosting and keep it patched. Every one of those is a place to introduce a vulnerability. Firebase provides them as audited, managed services. The tradeoff is vendor lock-in, and the honest mitigation is that the frontend's Firebase dependency is confined to `src/services/`.

> *If asked about the NoSQL limitation:* Firestore has no joins and limited aggregate queries. That is precisely why the analytics layer pre-computes summaries rather than querying live. It is a design consequence of the database choice, and it was designed for rather than fought against.

## Why is the backend TypeScript when the frontend is JavaScript?

Be straight about this one; a panelist may read it as inconsistency.

**The defensible reason:** the backend is where correctness is not optional. It grades assessments, computes learning gain, and enforces access control. A typo in a field name there produces a wrong research number silently. TypeScript catches that at compile time, which is why `tsc --noEmit` is part of the workflow. The frontend's failure modes are visible: a broken component does not render, and you see it immediately.

**The honest addition:** Cloud Functions' own tooling defaults to TypeScript, and the frontend was started first in plain JavaScript. If starting over, using TypeScript throughout would be the better call. Saying that is much stronger than pretending it was a master plan.

## Why CSS Modules rather than Tailwind or a component library?

CSS Modules scope class names automatically, so `styles.title` in one component cannot collide with `.title` in another. There is no runtime cost and nothing to configure. A component library like Material UI would have imposed its own visual identity, and the design uses a specific gold and navy palette. Design tokens live in `global.css` as custom properties so the palette is defined once.

## Why Zod for validation?

Every callable's input is parsed against a schema before the handler runs. Without it, each function would hand-check its own inputs, and the one that forgets is the vulnerability. Zod also infers the TypeScript type from the schema, so the validation and the type cannot disagree.

## Why the repository / service / controller split?

So that business logic can be tested without a database. That is not theoretical: it is why 138 backend tests run in ten seconds with no emulator. `metrics.ts` is pure mathematics with no I/O, so every statistical formula is unit-testable against fixed inputs, which is what lets you claim the numbers are correct.

---

# Part 8: Known weak spots, and honest answers

Volunteering these is far stronger than being caught by them. Every one has a real answer.

**1. The seed content, including answer keys, ships in the client bundle.**
The live item bank is protected: rules deny students a direct read, and three Cloud Functions strip the answers. But `src/data/modulePretestContent.js` and the default quiz content are imported by client services and therefore appear in the built JavaScript. Verified: `dist/assets/quizService-*.js` contains the quiz items and keys.
*Say:* "Grading integrity is guaranteed, because grading is server-side and no client can write a score. Absolute secrecy of the default seed content is not, and moving the seed server-side is the known fix."

**2. App Check is implemented but disabled.**
Every callable supports it and every log line records whether a request was attested. It ships off because enforcing it without a reCAPTCHA site key would lock out every user. The rollout order is documented.
*Say:* "It is a deliberate configuration decision, not missing work. The code path is complete and tested."

**3. Progress flags are client-writable.**
A student's browser writes their own `moduleProgress` row, because it is the only thing that knows they finished reading. A determined student could rush ahead.
*Say:* "Pacing is not protected; research data is. Scores, attempts, per-question responses, analytics, and gamification are all `allow write: if false` and written only by Cloud Functions. Also, the unlock flag self-heals against curriculum order on the next read."

**4. ~~There is dead code in `src/features/scenario/`.~~ RESOLVED 2026-08-20.**
A superseded first-generation scenario implementation was still in the tree, kept alive by an unused barrel file. All 26 files were deleted after verifying by import-path resolution that nothing live referenced them, and the build and full test suite were re-run to confirm. A reachability scan now reports zero unreachable files.
*Say, only if asked why the feature folder looks rewritten:* "It was. The first implementation was replaced by the current engine, and the old files were removed once we confirmed nothing referenced them."

**5. `firebase-admin` is held at v13.**
v14 removes the namespaced API this backend uses throughout. Migrating is mechanical but touches every repository file.
*Say:* "A deliberate deferral. It is a wide, behaviour-neutral change with no current benefit, and it is better done on its own than bundled with feature work."

**6. `firebase.json` has no hosting block.**
`firebase deploy` currently ships functions and rules only. **Confirm before the defense where the web app is actually served from**, because the architecture diagram implies a deployed site.

---

# Part 9: Ten questions and answers

**1. "Walk me through what happens when a student submits a quiz."**
The browser calls the `submitQuiz` callable with question-to-choice answers, never a score. `withCallable` logs and times it. `requireAuth` confirms the session. Zod validates the shape. The service reads the quiz from Firestore, including the answer key that never left the server, grades it, and opens a Firestore transaction. Inside the transaction it re-checks the attempt allowance, writes the score and completion, and unlocks the next module. After the transaction commits, it writes one row per answered question for item analysis, deliberately outside the transaction so an analytics failure cannot lose a graded submission.

**2. "Where is your business logic?"**
`functions/src/modules/*/service.ts`. Never in the browser. Any logic in the frontend is presentation: what to show, when to enable a button.

**3. "What is a Cloud Function, in your own words?"**
A piece of server code that runs on Google's infrastructure without us managing a server. Two kinds here: *callables*, which the app invokes by name and waits for; and *triggers*, which nobody calls and which run automatically when a document changes.

**4. "How do you prevent a student from cheating?"**
Grading is server-side; the client sends answers, never a score. The answer key is stripped before questions are sent. Scores, attempts, responses, analytics, and gamification are `allow write: if false`, so no client can write them even outside the app. Points are recomputed from progress rather than incremented, so they cannot be inflated. And simulation replays record nothing, so behavioural statistics cannot be padded by retrying.

**5. "Why 20 collections instead of fewer, bigger ones?"**
Firestore has a 1 MB document limit and charges per document read. Putting every student's responses inside their user document would hit the limit and mean reading everything to get anything. The split follows access patterns: things queried together live together.

**6. "What happens if Firebase goes down?"**
The app degrades rather than dying. Firestore's offline persistence serves cached data, and the service worker keeps the interface loaded. Writes queue and sync when the connection returns. Grading needs the network, because it must.

**7. "How would you add a seventh module?"**
Add its entry to the fixed module list in `shared/constants.ts` and `firestore.rules`, author its lesson content and pre-test bank in `src/data/`, write its scene components under `features/scenario/scenes/`, register them in `sceneRegistry.js`, and add a config file. `ScenarioEngine` itself does not change.

**8. "Why is your CSS almost as large as your JavaScript?"**
Because the simulations are the product. Sixteen scenes each convincingly imitate a real interface: an email client, a browser with a certificate warning, a phone, a social feed. That fidelity is what makes the training work, and it is mostly CSS.

**9. "What is the hardest bug you fixed?"**
A good true answer: `quizResponses` was missing from the cascading account delete. Deleting a student left every per-question answer in the corpus, where it kept feeding item difficulty and topic mastery indefinitely. Nothing on screen revealed it; the totals looked plausible and the statistics were quietly wrong. It was fixed, and the fix verified by reverting it and confirming the new test failed. The same class of bug had happened twice more, with `gamification` and `finalAssessmentProgress`, so the test was rewritten to sweep every collection from a single declared list rather than spot-check.

**10. "If you rebuilt this, what would you change?"**
TypeScript on the frontend too. Seed content on the server rather than in the client bundle. And the analytics aggregation designed for incremental updates from the start rather than full recomputation, which is fine at class size but would not scale to thousands of students.

---

*Companion documents: `SENTRI_Diagram_Defense_Guide.md`, `SENTRI_Presentation_Guide.md`, `SENTRI_Analytics_Guide.md`, `SENTRI_Figure_Descriptions.md`, `SENTRI_Paper_Alignment_Review.md`.*
