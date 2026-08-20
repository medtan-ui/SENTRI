# SENTRI: Diagram Correction Sheet

*Checked 2026-08-19 against commit `09ce937`. Four diagrams: ERD, Use Case, Activity, System Architecture. Every item below says exactly what to write, what shape it is, what it connects to, and what the connector is, so you can redraw without going back to the code.*

*Priority key: **P1** a panelist will catch it and it is wrong. **P2** it is stale or inconsistent. **P3** it is an improvement, not an error.*

---

## Second verification pass, 2026-08-20 (System Architecture only)

Re-checked after the caption and trigger-box fixes. Both real defects from the first pass are resolved: **the Cloud Firestore caption duplication is gone**, and **`learningAnalytics` was added** to the trigger box, so all three actual triggers (`updateGamificationOnProgress`, `updateGamificationOnFinalAssessment`, `updateGamificationOnBehaviour`) are now represented.

Two small leftovers in that same box's text, both cosmetic: `finalAsssessmentProgress` still carries the extra `s` (should be `finalAssessmentProgress`), and `"learningAnalytics. and"` has a stray period where a comma belongs — reads as `"moduleProgress, learningAnalytics. and finalAsssessmentProgress"`, should be `"moduleProgress, learningAnalytics, and finalAssessmentProgress"`.

**Newly caught, missed in every earlier pass:** the figure's own title is misspelled — `"SENTRI: Web-based Cybersecurity Awarenes Training System"` is missing an `s` (`Awarenes` → `Awareness`). Worth a global find-and-check across all four figures in case the same typo was copy-pasted into the others' titles.

The Path B scope note from the first pass is still technically open — the arrow still originates only from the trigger box — but it is now a much smaller issue than before, since the box is honestly and specifically labeled as the trigger mechanism rather than looking like an arbitrary pick. Lowest-effort close, no new lines: append `" — every callable's authoritative writes use this same path"` to the existing Path B label text. Optional.

---

## Verification pass, 2026-08-20

Checked the redrawn versions of all four diagrams against this sheet and against the code. Status by diagram:

**ERD — fully and correctly applied.** All 12 `moduleScenarios` snake_case renames done, all five new attributes present (`simulationFlawless`, `contentVersion`, `consequenceVideoUrl`, `badgeDistribution`, `gamification.userId`), `timeLimitMinutes` removed, `finalAssessment` — `finalAssessmentProgress` connector added with correct 1—M cardinality. Two cosmetic items still open, neither urgent: `badgeDistribution` is missing the `[]` its sibling arrays (`topicMastery[]`, `moduleBreakdown[]`) carry, and the `«derived»` stereotype pass (§1F) wasn't done. Double-check by eye whether the `Modules.prerequisite` self-loop (§1D) actually got drawn — it wasn't clearly resolvable from the exported image.

**Use Case — applied, two arrow directions worth a personal double-check.** Every added use case, rename, and merge from §2A–2E is present, and the reversed include arrow (§2F, Complete Scenario-Based Activity → Make Scenario Decision) is fixed. Not independently verifiable from the exported image: the arrowhead direction on the two new `«include»` pairs (`Manage User Accounts` → `Create Account, Reset Password, Disable Account, Delete Account`, and `Manage Modules and Content` → `Edit Lesson Content, Configure Scenario Branching, Manage Quiz Questions`) and on the `«extend»` pair (`Log In` / `Change Temporary Password`). Rule to check by eye: `«include»` points from the base use case into the thing it contains; `«extend»` points the opposite way, from the extension back to the base. Cloud Scheduler actor deliberately not added — settled as fine in conversation, see §2C.

**Activity — applied, two typos to fix, four admin actions still open.** The merge diamond replaced the black bar (§3B), the replay decision branch is in (§3C, full version), and the gamification recompute step is in (§3D). Two spelling fixes needed: "Grade Final **Assessemnt**" → "Assessment", and "simulation**Flwaless**" → "simulationFlawless". The four Admin-lane additions from §3F (Configure Final Assessment, Refresh Analytics, Export Analytics, View Audit Logs) and the Grade Quiz note from §3G are not yet added — still open, low priority, your call. Nightly-aggregation node (§3E) skipped, consistent with skipping the Use Case actor.

**System Architecture — one real defect, one factual gap, and a legitimate clutter problem.** See the dedicated note below.

### System Architecture: the caption duplication (fix this one regardless of anything else)

The Cloud Firestore box's caption now reads "...scenario decision records, progress records, completion status, **scenario decision records, progres records, completion status**, gamification records, and analytics aggregates" — the §4B replacement text was appended after the original ending instead of replacing it, so the phrase repeats and the second copy has a typo ("progres"). Collapse to one clean list.

### System Architecture: the gamification-trigger box undercounts and mislabels

The new box reads "Firestore moduleProgress and **finalAsssessmentProgress** writes recompute gamification" (typo: extra `s`). More importantly, it's only two of the three actual triggers — `functions/src/modules/gamification/controllers.ts` defines `updateGamificationOnProgress` (on `moduleProgress`), `updateGamificationOnFinalAssessment` (on `finalAssessmentProgress`), **and `updateGamificationOnBehaviour` (on `learningAnalytics`)** — the last one is what lets a flawless simulation run reach the gamification recompute at all, since that's the collection a scenario decision's safe/risky tally lands in. Fix: "moduleProgress, finalAssessmentProgress, and learningAnalytics writes recompute gamification," or shorten to "Progress, assessment, and behaviour writes recompute gamification" if space is tight.

Separately, the `Path B` arrow now originates *only* from this small trigger box. That visually says only the trigger-driven recompute bypasses Security Rules, when the real fact Path B exists to show is broader: every callable's authoritative write — `submitQuiz`, `submitAssessment`, `deleteUserAccount`, `aggregateCohortAnalytics`, all of it — goes through the Admin SDK the same way. Don't add a second arrow for this (see the decluttering note below) — instead either widen the arrow's visual origin to the whole "Cloud Functions for Firebase" box rather than the small sub-box, or keep it as is and add one short parenthetical: "(shown via the gamification trigger — every callable's writes use the same path)".

### On "cramped" — you're right, and here's where to cut without losing anything from §4

This diagram picked up two multi-line inline labels (the Path A caption, the item-banks label) plus a new box, on top of an already-dense three-tier layout. Four concrete de-clutter moves, none of which give up a correction already made:

1. **Move both Path captions' detail into a footnote.** Arrow labels become short — `Path A (Rules-enforced)*` and `Path B (Admin SDK, bypasses Rules)**` — with the full sentences ("Item banks excluded: ...", "all graded and authoritative writes") printed once as `*`/`**` notes under the figure instead of inline on the arrows. Same information, far less line-clutter in the middle of the diagram.
2. **Fix the Cloud Firestore caption by shortening it, not just de-duplicating it.** Since the ERD already enumerates all 20 collections precisely, this box doesn't need to re-list them. Replace with something like "Cloud Firestore — 20 collections: account & module config, progress & assessment records, gamification, analytics aggregates (full list in Figure 3.x, the ERD)." Fixes the duplication bug and cuts the longest text block in the figure at the same time.
3. **Service Worker was always the lowest-priority addition on this whole sheet (§4F, P3)** — it doesn't participate in the Path A/B story or the data flow at all, it's an orthogonal offline-caching concern with a single dangling connector. If space is still tight after 1–2, cutting it back out of this figure (mentioning it in prose instead) is a legitimate trade, not a loss of anything load-bearing.
4. **Merge the two YouTube arrows into one**, drawn from the Presentation Tier's boundary rather than from two separate inner boxes, carrying the same combined label. Same information, one fewer line crossing the figure.

---

## Diagram 1: Entity Relationship Diagram

Good news first: all 20 collections are present and the box names match `functions/src/shared/constants.ts` exactly. The problems are attribute-level plus a few missing and mislabelled connectors.

### 1A. Attributes to DELETE

| Entity | Delete | Why |
|---|---|---|
| `finalAssessment` | `timeLimitMinutes,` from inside `settings{ }` | Removed from the codebase on 2026-08-07. Nothing counts down anywhere. |

The corrected `settings{ }` line reads:

```
settings{ passingScore, instructions,
          available, attemptsAllowed }
```

### 1B. Attributes to RENAME (P1, `moduleScenarios` only)

Every field in this box is snake_case. The database migrated to camelCase. Twelve renames, all inside the `moduleScenarios` entity:

| Currently written | Change to |
|---|---|
| `scenario_id` | `scenarioId` |
| `scenario_order` | `scenarioOrder` |
| `scenario_title` | `scenarioTitle` |
| `scenario_description` | `scenarioDescription` |
| `material_url` | `materialUrl` |
| `scenario_choice_id` | `scenarioChoiceId` |
| `choice_text` | `choiceText` |
| `is_safe_choice` | `isSafeChoice` |
| `outcome_title` | `outcomeTitle` |
| `consequence_type` | `consequenceType` |
| `feedback_text` | `feedbackText` |
| `feedback_media_url` | `feedbackMediaUrl` |

`scene`, `videoAvailable`, `posterCaption`, `coachTarget`, `postCompletionReflection`, `moduleId`, `moduleTitle`, `coachLevel` are already correct. Leave them.

### 1C. Attributes to ADD

| Entity | Add this line | Put it | Why |
|---|---|---|---|
| `moduleProgress` | `simulationFlawless` | directly under `simulationCompleted` | New. Set when a run finishes with no risky choice, replays included. It is what lets a clean replay earn its badge without contaminating the decision records. |
| `moduleScenarios` | `contentVersion` | directly under `coachLevel` | New. Stale-content guard: a document at an older version is discarded rather than layered over the current config. |
| `moduleScenarios` | `consequenceVideoUrl` | inside `choices{ }`, after `feedbackMediaUrl` | New. The clip the feedback panel plays after a risky choice. |
| `cohortAnalytics` | `badgeDistribution[]` | directly under `completionTrend[]` | New. How many students hold each badge and what share of the roster that is. |
| `gamification` | `userId` | as the **first** attribute, above `displayName` | Currently missing entirely, and it is the foreign key to Users. A panelist reading the box cannot see what it joins on. |

### 1D. Relationships to FIX

**`finalAssessment` is an orphan.** It is the only entity on the page with no connector at all, which reads as an oversight even though it is a singleton.

- Draw: `finalAssessment` **1** ————— **M** `finalAssessmentProgress`
- Label the line: `is attempted in`
- Connector: one-to-many, crow's foot (or the M) on the `finalAssessmentProgress` end.
- Add a stereotype under the entity title: `«singleton: finalAssessment/config»`

**Add the Modules self-relationship (P2).** `Modules.prerequisite` points at another module id and nothing draws it.

- Draw: a recursive line from `Modules` back to `Modules`
- Label: `prerequisite`
- Connector: **0..1** to **0..1** (a module has at most one prerequisite and is the prerequisite of at most one module)

**Relabel the Path-B-style relationships.** Nothing to change in the ERD here, but see Diagram 4 item 4D.

### 1E. Full relationship list to check against

Verify each of these exists and carries the right cardinality. This is the authoritative set.

| From | Connector | To | Reads as |
|---|---|---|---|
| Users | 1 — M | moduleProgress | one row per student per module, six per student |
| Users | 1 — 1 | gamification | one reward document per student |
| Users | 1 — 1 | studentAnalytics | one summary per student |
| Users | 1 — 1 | finalAssessmentProgress | one final assessment record per student |
| Users | 1 — M | quizAttempts | |
| Users | 1 — M | quizResponses | one row per answered question |
| Users | 1 — M | scenarioDecisionRecords | one row per decision, retries included |
| Users | 1 — M | analyticsEvents | |
| Users | 1 — M | learningAnalytics | one per student per module |
| Users | 1 — M | auditLogs | as `actorUid`; a second line for `targetUid` is optional |
| Modules | 1 — 1 | moduleLessons | keyed by moduleId |
| Modules | 1 — 1 | moduleQuizzes | keyed by moduleId |
| Modules | 1 — 1 | modulePretests | keyed by moduleId |
| Modules | 1 — 1 | moduleScenarios | keyed by moduleId |
| Modules | 1 — 1 | moduleAssignments | keyed by moduleId |
| Modules | 1 — 1 | moduleAnalytics | keyed by moduleId |
| Modules | 1 — M | moduleProgress | |
| Modules | 1 — M | quizAttempts | |
| Modules | 1 — M | quizResponses | |
| Modules | 1 — M | scenarioDecisionRecords | |
| Modules | 1 — M | analyticsEvents | |
| Modules | 1 — M | learningAnalytics | |
| Modules | 0..1 — 0..1 | Modules | prerequisite, recursive |
| finalAssessment | 1 — M | finalAssessmentProgress | new, see 1D |
| cohortAnalytics | none | | singleton aggregate, see 1F |

### 1F. One presentation change worth making (P3)

Five boxes are **computed caches**, not transactional entities: `cohortAnalytics`, `moduleAnalytics`, `studentAnalytics`, `learningAnalytics`, and `gamification`. Every value in them is derived and recomputable from the raw collections.

- Give those five a **dashed border**, or add the stereotype `«derived»` under each title.
- Add one legend box, shape: plain rectangle, bottom-left of the figure:
  `«derived» = aggregate recomputed from the raw collections (nightly at 02:00 Asia/Manila, on demand, and on account deletion). Not a second source of truth.`

This pre-answers the obvious question, which is why `moduleAnalytics.avgScore` appears to duplicate what is already in `quizAttempts`. `cohortAnalytics` having no connector then reads as deliberate rather than forgotten.

### 1G. Anticipated question: "Why does this ERD have nested attributes instead of separate entities?"

A panelist trained on relational modeling (3NF, every repeating group gets its own table) will ask this. It has a real, technical answer — it is not a shortcut or a diagramming convenience.

**The one-sentence answer:** Cloud Firestore is a NoSQL *document* database, not a relational one. A Firestore document is natively a JSON-like tree — a field's value can be a map (`{ }`) or an array (`[ ]`) of maps, not only a scalar. So a curly-brace or bracket attribute in this ERD is not an abstraction over several tables; it is an accurate drawing of one field inside one physical document. There is no join to normalize toward, because Firestore has no join operation.

**The heuristic behind every embed-vs-collection decision in this schema**, stated as a rule you can apply live to any attribute they point at:

> Embed it as a nested attribute if it is only ever created, read, and updated *as one unit with its parent* — same actor, same moment, same document read. Promote it to its own top-level collection if it needs to be queried, filtered, or aggregated *independently, across many parents* — or if a different actor writes it at a different time than the parent.

**Worked from your own schema, so you have concrete examples ready, not just the abstract rule:**

| Nested (embedded) | Why | Separate collection instead | Why |
|---|---|---|---|
| `finalAssessment.questions[].choices[]` | A question's choices are never read, edited, or queried on their own — always fetched as one document, "give me this assessment," and every choice comes along for free. Splitting them out would cost one extra document read per choice for zero benefit. | `quizResponses` | Needs a query like "every answer to this specific question, across every student" for item difficulty and discrimination. That is a cross-parent aggregate query, which is exactly what a top-level collection with a `where` filter is for. |
| `moduleScenarios.scenarios[].choices[]` | Same reasoning — a scenario's choices are structural to that scenario, authored and read together, never independently. | `scenarioDecisionRecords` | An admin authors the scenario once; many different students write a decision against it, independently, over time. Different actor, different cadence, and analytics needs to query across students. |
| `gamification.totals{}` | One bundle of derived counts, always computed and read together as a single snapshot for one student. Nobody queries "every student's `simulationsCompleted` value" as its own operation. | `moduleProgress` (a whole collection, not nested in `Users`) | Written independently by many different backend flows (lesson complete, quiz submit, admin reset) without touching the account profile, and queried per-module for analytics — "every student's progress on `phishing-awareness`." |
| `moduleLessons.sections[]`, `bestPractices[]`, `keyTakeaways[]` | Ordered content blocks, always rendered together in the Lesson Viewer and always edited together in the admin Lesson Content Editor. No use case ever asks for them apart from their lesson. | `auditLogs` | Written by whichever admin action happens to fire, read only as a chronological list independent of any single account's document — it has to outlive the account it is about, including through a deletion. |

**The cost argument, if they push on "but why does the physical mechanism force this":** Firestore bills and rate-limits per document read. Rendering one quiz question with five embedded choices costs one read. If choices were their own collection, the same question would cost one read for the question plus five more for its choices — for data that is 100% co-accessed, every single time, with no exception. Embedding is not a stylistic choice here; a normalized version would be strictly worse on both latency and cost while buying nothing, since nothing ever needs a choice without its question.

This exact reasoning is very likely already in your Chapter 3 ERD narrative in some form — it was reviewed as "correct and well argued" in Part A of `SENTRI_Paper_Alignment_Review.md`. The gap is usually that the paragraph was written correctly but not internalized, which is exactly the situation a "explain this in your own words" follow-up question exposes. Reread that paragraph once against the table above before your defense.

---

## Diagram 2: Use Case Diagram

The system boundary, the two actors, and most of the ovals are right. What is missing is one whole actor, four real use cases, and there is one reversed arrow.

### 2A. Use cases to ADD, Student side

All ovals inside the boundary, each joined to the Student stick figure with a plain solid association line (no arrowhead) unless stated.

| Write in the oval | Connect to | Connector |
|---|---|---|
| `Register Account` | Student actor | plain association. Place it above `Log In`, outside the login chain, since a visitor is not signed in yet. |
| `Verify Email Address` | `Register Account` | dashed arrow, arrowhead at `Verify Email Address`, labelled `«include»` |
| `Change Temporary Password` | `Log In` | dashed arrow, arrowhead at **`Log In`**, labelled `«extend»`. Extend, not include, because it only happens for admin-created accounts. Note the direction is the opposite of include: an extend arrow points from the extending use case back to the base. |
| `Replay Completed Simulation` | Student actor | plain association. Worth showing: it is a deliberate feature and it deliberately records nothing. |

Your activity diagram already has Register Account and both gates, so leaving them off the use case diagram makes the two figures disagree with each other.

### 2B. Use cases to ADD, Admin side

| Write in the oval | Connect to | Connector |
|---|---|---|
| `Grant Quiz Retry` | Admin actor | plain association. It is in your activity diagram and missing here. |
| `Refresh Analytics Aggregation` | Admin actor | plain association |

### 2C. A missing actor (P1, and it is a differentiator)

The nightly aggregation has no actor, so a real automated behaviour is invisible.

- Add a **secondary actor** on the right edge, below Admin. Shape: stick figure labelled `Cloud Scheduler`, or a rectangle with the stereotype `«system»` and the name `Cloud Scheduler` if your template prefers non-human actors as boxes.
- Add one oval inside the boundary: `Aggregate Analytics Nightly`
- Connector: plain association from `Cloud Scheduler` to `Aggregate Analytics Nightly`.
- Optional second line: `Aggregate Analytics Nightly` and `Refresh Analytics Aggregation` both pointing at a shared oval `Recompute Analytics Aggregates` with `«include»` from each. Only do this if the figure has room; the single oval is enough.

### 2D. Renames

| Currently | Change to | Why |
|---|---|---|
| `Take Pre-Test` | `Take Module Pre-Test` | There are six, one before each module's lesson, not one test before using the system. |
| `Export Analytics (CSV)` | `Export Analytics (CSV / PDF)` | There is a print-to-PDF path as well as six CSV exports. |
| `Manage Scenario Modules and Content` | `Manage Module Content` | It covers lessons, scenarios and quizzes, not just scenarios. |

### 2E. Merge the duplicated account use cases (P2)

`Create and Manage Student Accounts` and `Manage Student & Admin Accounts` are two ovals for one capability, and both connect to Admin.

- Delete `Create and Manage Student Accounts`.
- Keep one oval, renamed `Manage User Accounts`.
- Optionally add four small ovals beneath it joined by dashed `«include»` arrows pointing away from `Manage User Accounts`: `Create Account`, `Reset Password`, `Disable Account`, `Delete Account`.

Do the same tidy on the content side if you have room: `Manage Module Content` with `«include»` arrows to `Edit Lesson Content`, `Configure Scenario Branching`, and `Manage Quiz Questions`. Right now `Manage Quiz Questions` floats as a sibling of a use case that already contains it.

### 2F. One arrow to reverse (P1)

Between `Complete Scenario-Based Activity` and `Make Scenario Decision`, the `«include»` arrowhead currently points **up**, into `Complete Scenario-Based Activity`. That reads as "making a decision includes completing the activity", which is backwards.

- Reverse it. The arrowhead belongs on `Make Scenario Decision`.
- Rule to check every other one against: a dashed `«include»` arrow points **from the base use case to the thing it contains**. An `«extend»` arrow runs the other way, from the optional extension back to the base.

Checked and already correct: `Open Scenario Module` to `Complete Scenario-Based Activity`, `Make Scenario Decision` to `View Consequence-Based Feedback`, and the three-step admin analytics chain. Leave those alone.

---

## Diagram 3: Activity Diagram

The overall flow is right, including the important one: quiz submission marks the module complete and unlocks the next one without checking the score. Six fixes.

### 3A. Rename inside existing shapes

| Currently | Change to |
|---|---|
| `Record Decision (scenario_decision_records)` | `Record Decision (scenarioDecisionRecords)` |
| `Grade Final Assessemnt` | `Grade Final Assessment` |
| `Compute Pre-Test Score & Normalized Gain` | `Compute Average Pre-Test Score & Normalized Gain (stored once at submit)` |
| `Mark Simulation Completed` | `Mark Simulation Completed (+ simulationFlawless if no risky choice)` |
| `Create/Manage student and admin accounts (disable,delete, reset password)` | `Create / Manage student and admin accounts (disable, delete, reset password)` |

### 3B. Replace the black bar (P1, notation error)

After `Unlock Next Module` there is a thick black bar taking the `No` branch back into the loop. In UML activity notation a thick bar is a **fork or join** for concurrent flows. You are merging two sequential paths, not joining parallel ones.

- Delete the black bar.
- Replace with an **empty diamond** (merge node): two incoming arrows, one outgoing.
- Route the outgoing arrow back to `View Available Cybersecurity Module`.

If your drawing tool makes merge diamonds awkward, the acceptable alternative is no shape at all: just run the `No` arrow straight back to `View Available Cybersecurity Module`.

### 3C. Show that replays are not recorded (P1 for your methodology)

This is the mechanism that protects your first-attempt safe rate, and the diagram currently implies every run is recorded.

The light version, which is enough:

- Attach a **note** (rectangle with a folded corner) to `Record Decision (scenarioDecisionRecords)`, joined by a dashed line.
- Note text: `First run only. A replay of a completed simulation records no decisions, so first-attempt safe rate measures the first real attempt.`

The full version, if you want it in the flow:

- Insert a **decision diamond** in the Student lane immediately before `Open Scenario Simulation`.
- Diamond text: `Simulation already completed?`
- `Yes` branch to a new rounded action: `Run as Replay (practice, nothing recorded)`, then arrow into `View Scenario Scene`.
- `No` branch straight into `View Scenario Scene` as it is today.
- Then guard the System lane action: change `Record Decision (scenarioDecisionRecords)` to `Record Decision (first run only)`.

### 3D. Add the gamification recompute (P1, a whole feature is missing)

Points, ranks, badges and streaks are triggered by progress writes and appear nowhere in this diagram.

- Add one rounded action in the **System** lane: `Recompute Points, Rank, Badges, Streak`
- Place it directly below `Update moduleProgress`.
- Connector: solid arrow from `Update moduleProgress` into it.
- Outgoing: solid arrow back into the Student lane at `Unlock Next Module`, or leave it as a terminal side-effect with no outgoing arrow if that clutters the figure.
- Optional note attached to it: `Derived from progress, never incremented, so a retry or reset cannot inflate a score.`

### 3E. Add the nightly job (P2)

- Add a rounded action in the **System** lane, placed apart from the main flow near the bottom: `Aggregate Analytics (all modules + cohort)`
- Its trigger is a **time event**: draw the hourglass symbol (an open triangle over an inverted triangle) above it with the label `02:00 Asia/Manila, daily`, and a solid arrow from the hourglass into the action.
- No incoming arrow from the student or admin flow. That is the point: it runs on its own.

### 3F. Fill in the Admin lane (P2)

The Admin lane stops at `Identify Learners Needing Support`, but your use case diagram gives the admin four more capabilities. Add these as rounded actions in the Admin lane, stacked in sequence between `Identify Learners Needing Support` and `Log out`:

1. `Configure Final Assessment`
2. `Refresh Analytics`
3. `Export Analytics (CSV / PDF)`
4. `View Audit Logs`

Connector: plain solid arrows down the lane, same as the existing chain.

### 3G. One clarifying note (P3)

Attach a note to `Grade Quiz`:
`Score is recorded but does not gate progress. Submitting completes the module and unlocks the next one regardless of score. The only passing threshold is on the final assessment, at 75%.`

This is the single most contradicted fact between your Chapter 1 and your system. Putting it on the diagram makes the correct version hard to miss.

---

## Diagram 4: System Architecture Diagram

Structurally this is the strongest of the four. Two typos, one wrong arrow that matters, and one architectural change that has happened since you drew it.

### 4A. Typos

| Currently | Change to |
|---|---|
| `scheduleAnalyticsAggregation` | `scheduledAnalyticsAggregation` |
| `Gamification UI (irank, badges, streak, leaderboard)` | `Gamification UI (rank, badges, streak, leaderboard)` |

### 4B. Data Tier caption

Currently ends: `... analytics records, and file metadata`.

There is no Firebase Cloud Storage in this system and no file metadata anywhere. Replace the caption's tail with:

`... scenario decision records, progress records, completion status, gamification records, and analytics aggregates`

### 4C. Show the answer-key stripping (P1, this is new since you drew it)

Students no longer read the three item-bank collections directly. Three Cloud Functions return the questions with the correct answer stripped out, and the Firestore rules now deny a student a direct read.

Two edits:

1. Add a solid arrow from `Student Dashboard & Pages` down into `Callables - Learning`, labelled:
   `item banks (answer key stripped)`
2. Edit the Path A label. Currently `PATH A - direct client read/write, Rules-enforced`. Change to:
   `PATH A - direct client read/write, Rules-enforced. Item banks excluded: moduleQuizzes, modulePretests and finalAssessment are admin-read only.`

Optionally add a small rectangle inside the Cloud Functions box listing the three, so a panelist can see the mechanism:
`getQuizForStudent / getAssessmentForStudent / getFinalAssessmentForStudent`

### 4D. Fix the Path B arrow (P1, conceptual error)

Right now the `Path B - Admin SDK bypasses Rules` arrow originates from `Admin Dashboard & Pages`. As drawn, it says an administrator's browser bypasses your security rules. It does not, and cannot. The Admin SDK runs only inside Cloud Functions.

- Keep the existing line from `Admin Dashboard & Pages` to Firestore, but **relabel it** as part of Path A: `Path A (admin role, Rules-enforced)`. Admins do write module configuration directly under `allow update: if isAdmin()`, so this line is legitimate, just mislabelled.
- Draw a **new** Path B arrow originating from the **Cloud Functions for Firebase** box, running down into `Cloud Firestore` and visibly routed **around** the `Firebase Security Rules` box.
- Label it: `Path B - Admin SDK, bypasses Rules (all graded and authoritative writes)`

Routing the arrow around the Rules box rather than through it is the whole point of the figure. Make the bypass visible.

### 4E. Connect the orphaned Firestore Triggers box (P2)

`Firestore Triggers` sits in the Application Tier with no connectors.

- Draw a solid arrow from `Cloud Firestore` up into `Firestore Triggers`, labelled `on write`.
- Draw a solid arrow from `Firestore Triggers` back down into `Cloud Firestore` along Path B.
- Add a one-line caption under the box: `moduleProgress and finalAssessmentProgress writes recompute gamification`

### 4F. Additions

| Add this box | Shape | Where | Connector |
|---|---|---|---|
| `Service Worker (static asset cache, offline fallback)` | plain rectangle | Presentation Tier, beside or under the React box | solid line to the React box, no arrowhead needed |

### 4G. YouTube arrow

The dashed arrow to YouTube comes only from `Student Dashboard & Pages`. There are now three kinds of embedded clip.

- Add a second dashed arrow from `Scenario Engine (interactive Decision scenes)` to the YouTube box.
- Relabel the arrows, or add one shared label: `embeds: lesson video, scenario opening clip, consequence clip`

### 4H. Title consistency

This figure is titled `Web-Based Cybersecurity Awareness System Architecture`. Your use case figure says `SENTRI: Web-Based Cybersecurity Awareness Training System`, and your DFD says `Web-Based Cybersecurity Awareness LMS`. Three names for one system.

Pick one and use it on every figure. Recommended: **`SENTRI: Web-Based Cybersecurity Awareness Training System`**, with figure titles reading `Figure 3.x. System Architecture of SENTRI` and so on.

---

## Suggested order of work

1. Diagram 4, items 4D and 4C. The Path B arrow is the one outright conceptual error across all four figures, and the answer-key stripping is your strongest new security claim.
2. Diagram 3, items 3B, 3C and 3D. A notation error, a missing measurement safeguard, and a missing feature.
3. Diagram 1, items 1B and 1C. Mechanical, fast, and a panelist who cross-checks the ERD against a Firestore console screenshot will see snake_case that no longer exists.
4. Diagram 2, items 2C, 2F and 2E. The missing scheduler actor, the reversed arrow, the duplicate ovals.
5. Everything marked P3.

---

## Still to check yourself

These are about your paper's figures, not the code, so I cannot settle them.

1. **Are there storyboard figures for the malware fake-alert scene?** That scene was deleted. See `SENTRI_Paper_Alignment_Review.md`, R2-8.
2. **Do the phishing storyboards show the old safe path?** It changed from "inspect the sender, then report" to verifying with the instructor on Campus Chat, and the platform is now called ClassDeck. See R2-10.
3. **Does the DFD (Figure 3.4) still show four processes and one "System DB"?** It cannot represent scenario decision capture, gamification, the final assessment, or the nightly aggregation, all of which the ERD does represent. See B12.
4. **Does any figure still show a section or class picker?** Section segmentation was removed. See B8 and R2-14.

---

*Prepared 2026-08-19 from direct inspection of commit `09ce937`. No code was modified. Companion to `SENTRI_Paper_Alignment_Review.md`, which covers the prose chapters.*
