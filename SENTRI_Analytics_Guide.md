# SENTRI Analytics: How It Actually Works

*A guide to reading the admin Analytics page, and to defending the numbers on it.*

This document explains where every figure on `/admin/analytics` comes from, what it means, what it deliberately refuses to say, and how to answer a panelist who asks "how do you know that?"

---

## 1. The one rule everything follows

**No number is ever computed in the browser.**

Every statistic is calculated by a Cloud Function, stored in Firestore, and only *read* by the admin page. The page formats numbers. It never derives them.

This matters for one reason: a statistic with two derivations eventually has two values. If the dashboard computed a learning gain and the CSV export computed it again, they could disagree, and you would have no way to know which one is in your paper. So there is exactly one place each metric is defined:

```
functions/src/modules/analytics/metrics.ts
```

That file is pure mathematics with no database access, which is also why every metric in it has unit tests.

---

## 2. The pipeline, end to end

### Step 1: A student does something, and it gets recorded

| When a student... | This gets written | Collection |
|---|---|---|
| Answers any single question (pre-test, quiz, or final assessment) | One row per question: topic, right/wrong, time spent, which choice was picked | `quizResponses` |
| Submits a whole quiz | One row: score, passed, attempt number | `quizAttempts` |
| Submits the final assessment | One row: score, passed, attempts, pre-test average, normalized gain | `finalAssessmentProgress` |
| Makes a choice in a simulation | One row per decision, **including retries** | `scenarioDecisionRecords` |
| Finishes a lesson, module, or assessment | One row: what happened, how long it took | `analyticsEvents` |
| Progresses through a module at all | One running record per student per module | `moduleProgress` |
| Earns points, a badge, or a streak day | One derived record per student | `gamification` |

Three details in here carry a lot of weight later:

- **`quizResponses` is per *question*, not per test.** A quiz attempt only knows "you scored 72%". Item analysis needs to know *which* questions you got wrong, which is why this collection exists at all.
- **Every decision is recorded, including the retries.** The simulation always eventually lets a student through to the safe outcome. If we only stored the final decision, the safe rate would read 100% forever and mean nothing. Storing `attemptNumber` is what makes "did they get it right *first* time" answerable.
- **The "after" measurement is one test, not six.** The six per-module post-tests were replaced by a single end-of-curriculum final assessment. Its per-question rows are still written to `quizResponses` as `assessmentType: 'posttest'`, each tagged with the module its item came from, which is what keeps per-module and per-topic reporting alive after the change. See section 3.

Nothing here is writable by a student's browser except their own progress and their own decisions. `gamification` and `finalAssessmentProgress` are closed to every client write. Grading happens server-side specifically so a score cannot be manufactured.

### Step 2: Aggregation rolls the raw rows up

Three summary documents get computed from those raw collections:

| Document | Covers | Answers |
|---|---|---|
| `moduleAnalytics/{moduleId}` | One module, all students | "How is the class doing on Phishing Awareness?" |
| `studentAnalytics/{userId}` | One student, all modules | "How is Juan doing?" |
| `cohortAnalytics/current` | All students, all modules | "Did the training work?" |

### Step 3: Aggregation runs at three moments

1. **Nightly at 02:00 Manila time.** Recomputes all six modules and the cohort rollup. This is why the dashboard is never more than a day stale even if nobody touches it.
2. **When you click Refresh.** Either one module, the cohort rollup, or "Refresh All".
3. **When an account is deleted.** All six module summaries *and* the cohort rollup recompute immediately, so a deleted student's numbers stop being baked into the totals right away rather than lingering until 2am.

The nightly job and the Refresh All button run the *same* code, so they cannot drift apart in what they cover.

---

## 3. Reading the Cohort Overview

### Coverage: who is even in this

| Figure | Means |
|---|---|
| **Active / N students** | How many students have any activity, out of how many accounts exist. A student who never opened the app has no progress record, so "active" is the honest denominator for everything below. |
| **Avg. modules done** | Total completed modules divided by students who have started anything. |
| **Finished all six** | Students who completed the entire curriculum. |

### Awareness Improvement: did they actually learn anything?

This is the section your capstone objectives are reported against.

**Where the "before" and "after" come from.** The before is the six per-module pre-tests, five items each, taken once before each module's lesson. The after is the **single end-of-curriculum final assessment**: 18 items, three drawn from each module's pre-test bank, unlocked only once all six modules are complete, passing score 75%, two attempts by default.

This replaced six per-module post-tests that used to re-administer a module's pre-test minutes after its quiz. Two reasons, and both are worth being able to state:

1. Eighteen assessments per student became thirteen. Three separate tests per module, two of them the same items, was more measuring than teaching.
2. Recall a week after the lesson is better evidence of learning than recall five minutes after reading it.

**The gain is still a same-instrument comparison**, because the final assessment's items are seeded from the same six pre-test banks rather than written fresh. Two honest caveats attach to that, and you should be the one to say them first:

- It is a **subset**: 3 of each module's 5 pre-test items, 18 of 30 overall. A per-module gain therefore compares a 5-item "before" against a 3-item "after".
- An admin **can** edit the final assessment's questions in Module Configuration, exactly like a module quiz. Doing so weakens the guarantee, which is why each student's gain is computed and stored **once, at submit time**, and never recomputed on read. A later pre-test reset or item-bank edit cannot retroactively move a number that has already been reported.

**Average pre-test and final assessment** are then straightforward: the mean of a student's pre-test scores across the modules they finished, and their single final assessment score.

**Normalized gain** is the real measure, and it needs explaining because the number is not a percentage.

The problem with "post minus pre" is that it punishes students who started strong. A student who went from 90% to 95% only had 10 points available to gain, and took half of them. A student who went from 40% to 45% had 60 points available and took a twelfth of them. Raw improvement calls both "+5" and treats them as equal. They are not.

Hake's normalized gain fixes this by asking **what fraction of the available improvement was actually captured**:

```
g = (post - pre) / (100 - pre)
```

So the first student scores 0.50 and the second scores 0.08, which is the honest comparison.

Read it against these conventional bands (they are shown on the card next to the number):

| g | Band | Rough reading |
|---|---|---|
| 0.70 and above | High gain | The intervention worked well |
| 0.30 to 0.69 | Medium gain | Typical of effective interactive teaching |
| Above 0 to 0.29 | Low gain | Typical of passive lecture-only instruction |
| 0 or below | No measured gain | Something is wrong, or nobody learned |

**Three deliberate exclusions**, each of which you should be ready to defend:

1. **The average is of individual gains, not the gain of averages.** These are different numbers whenever students start at different levels, and only the first one answers "did students improve".
2. **A student with a 100% pre-test is excluded.** There is no headroom, so the formula divides by zero. They are dropped, not counted as a zero gain, because "could not improve" is not the same as "did not improve".
3. **A student missing either bookend is excluded.** `pairedCount` on the card tells you exactly how many students actually contributed, so you are never quoting a gain over a population you did not measure.

**How a per-module gain survives a curriculum-level test.** Every final assessment answer row carries `sourceModuleId`, the module its item was seeded from. To score one module's "after", the aggregation takes that student's `posttest` rows for that module and scores them (`postScoresByStudent` in `metrics.ts`). So the module cards still report a pre/post gain even though no per-module post-test exists any more. It is the same 3-of-5 subset caveat as above, one module at a time.

### Behaviour in Simulations (Kirkpatrick Level 3)

Knowing the right answer on a test is Level 2. *Behaving* correctly is Level 3, and it is the harder claim. This section is the evidence for it.

**First-attempt safe rate** is the headline. Of every scenario decision, how often was the *first* thing the student did the safe thing?

It has to be first-attempt because the engine is designed to always eventually let the student through to the safe outcome. An "eventual success rate" would therefore read 100% permanently and prove nothing. First-attempt cannot be inflated by retrying.

**Consequences triggered** is the share of decisions that were risky enough to fire a consequence beat.

**Median time to decide**, plus the split beneath it, is more interesting than it looks:

> Of the risky choices made, X were quicker than the median decision (acting without looking) and Y were slower (looking, then misjudging).

These two failures need opposite interventions. A student clicking fast and wrong is not reading the screen, and the fix is a slowdown prompt. A student deliberating and *still* choosing wrong has a genuine knowledge gap, and the fix is teaching. Collapsing both into one "error count" would hide that entirely, which is why they are reported apart.

### Cross-Module Transfer

Transfer is whether training in one module generalizes, or whether each module is learned in isolation and forgotten.

Measured two ways:

- **Behavioural transfer.** First-attempt safe rate in the later half of the curriculum minus the earlier half, in percentage points. A positive number means students are arriving at later modules already behaving more safely, which is training generalizing. Needs at least two modules with decision data.
- **Shared-topic transfer.** Some topics are deliberately measured in two different modules. `public-wifi` appears in both Safe Browsing and Online Safety *specifically* so this is computable. The card shows the correct rate in the earlier module, the later module, and the movement between them.

### Activity, Last 30 Days

Daily module completions across the window. Every day in the range is drawn, **including empty ones**. That is deliberate: a chart that silently skips quiet days compresses them out of existence and makes activity look far steadier than it was.

---

## 4. Reading a module card

The top four numbers (Students, Completion, Pass Rate, Avg. Score) are self-explanatory. The two sections below them are not.

### Topic Mastery

Correct-rate per topic at each measurement point, with the pre-to-post movement in percentage points.

This is what turns "the class scored 72%" into "the class still does not understand that HTTPS is not a trust signal." The first is a grade. The second is something you can act on.

> **This was silently impossible on the live project until 2026-08-07, and is worth knowing about.** All twelve item banks (six `modulePretests`, six `moduleQuizzes`) had been seeded before topic tagging existed and carried **no `topic` field on any of their 60 items**. Every item read `untagged`, Topic Mastery exported a header row and nothing else, and item-level transfer could not compute because `public-wifi` was tagged in neither bank. All 60 have since been backfilled from the authored content, and `public-wifi` now spans Safe Browsing and Online Safety as intended.
>
> **One residual worth knowing when you read old data.** A response row copies its topic from the bank *at the moment it is answered*, so the handful of rows submitted before the backfill stay untagged forever and contribute nothing to topic mastery. Everything answered from now on carries its topic. If those early rows belong to a test account, deleting the account removes them.

### Item Analysis

This is quality control on your *test*, not on your students. Two numbers per question.

**Difficulty (p-value).** The proportion who answered correctly.

> **Counterintuitive but standard: higher p means EASIER.** A p of 0.95 means 95% got it right, which is a very easy item. The dashboard shows the label alongside the number so you never have to remember which direction it runs.

| p | Label |
|---|---|
| 0.90+ | Very easy |
| 0.70 to 0.89 | Easy |
| 0.50 to 0.69 | Moderate |
| 0.30 to 0.49 | Hard |
| Below 0.30 | Very hard |

**Discrimination (D).** Does this question separate students who understand the material from students who do not?

Take everyone's total score, rank them, then compare the top 27% against the bottom 27% on this one question:

```
D = (correct rate in top group) - (correct rate in bottom group)
```

| D | Reading |
|---|---|
| 0.40+ | Excellent item |
| 0.20 to 0.39 | Acceptable |
| Below 0.20 | Flagged with a warning symbol. Candidate for rewriting. |
| Negative | Worse than useless: your *strongest* students are getting it wrong more often than your weakest. Almost always a badly worded question or a wrong answer key. |

**When D reads `pending (4/10)`**, that is not an error. D is deliberately withheld until at least 10 whole attempts exist, because splitting 4 students into a "top 27%" and a "bottom 27%" produces one student per group and pure noise. The two numbers tell you exactly how far off the threshold you are: 4 attempts recorded, 10 needed.

**Where the answers went.** Under each item is the distribution across its choices: the choice as the student read it, a bar, the count, and the share. Commonest first, with the keyed answer marked `key`.

This is what difficulty and discrimination cannot answer: *which* wrong answer they were drawn to. A distractor nobody ever picks is dead weight in the item. **A distractor that outdraws the key is the finding to look for**, and it is usually a wording problem rather than a knowledge gap.

Two details about how it is derived:

- **The key comes from the response rows, not from the item bank.** Every answer row records the key it was graded against at the time. So if an item is edited after students answered it, the distribution still reports against the key that was actually in force, rather than retroactively marking a different choice correct.
- **The choice text comes from the item bank, and is best-effort.** Aggregation resolves each choice id against the module's pre-test, its quiz, and the final assessment. An item deleted or rewritten since it was answered may no longer resolve, in which case the row shows the raw id and still reports its count and share. Percentages are of all responses to that item, so they will not sum to 100 on an item some students left blank.

It exports as its own CSV (Distractor Analysis), one row per choice.

---

## 5. Exports

Six CSV files plus a PDF path, all from the Export bar.

| Button | Contains | Grain |
|---|---|---|
| Cohort Summary | Every headline figure as label/value pairs, ready to paste into a document | one metric per row |
| Module Breakdown | Per-module completion, average score, gain, and safe rate, in curriculum order | one module per row |
| Topic Mastery | Per-topic correct rates at pre, final assessment, and quiz | one topic per row |
| Item Analysis | Every question across every module, with difficulty and discrimination | one question per row |
| Distractor Analysis | Where each item's answers went: choice text, whether it was the key, count, share | one **choice** per row |
| Activity Trend | The 30-day time series | one day per row |
| **Print / Save as PDF** | Opens the browser's print dialog. Choose "Save as PDF" as the destination. | |

One table per file rather than one big sheet, because those grains genuinely differ and a spreadsheet cannot hold them in one table without padding most of it.

Filenames carry the date, so exports taken on different days do not overwrite each other.

**One convention that matters when reading a CSV:** an unmeasurable statistic exports as a **blank cell, never as 0**. A 0 in a normalized gain column would be a claim ("no learning occurred"). A blank is the truth ("not measurable yet"). Same for a suppressed discrimination index, which exports blank with the attempt counts in their own adjacent columns.

**The vocabulary matches the screen.** Columns read "Average final assessment score (%)", "Students with both a pre-test and a final assessment", and "Final assessment correct (%)", and the Assessment column says "Final assessment" rather than the stored value `posttest`. Paste them into the paper as they come.

---

## 6. Why a number is blank or zero

| You see | It means |
|---|---|
| Normalized gain `—` | No student has both a pre-test and a finished final assessment on record yet |
| `Not yet measurable` | Same as above, stated in words |
| Cross-module transfer `Not measurable yet` | Fewer than two modules have simulation decisions |
| `D: pending (4/10)` | Not enough attempts for a meaningful top/bottom split |
| Median time to decide `—` | No decision had its duration measured |
| Topic gain blank | That topic has pre-test data or final assessment data, but not both |
| No answer distribution on an item | Nobody has answered that item yet, so there is nothing to distribute |
| A choice shown as a raw id instead of its wording | That item was edited or deleted after it was answered, so its text no longer resolves. The count and share are still correct |
| A flat activity chart | No module completions in the last 30 days |
| Everything reading 0% | See the next section |

One consequence of moving to a single end-of-curriculum test is worth flagging: **the whole Awareness Improvement section stays empty until a student finishes all six modules.** Under the old design a post-test landed after module one. Now nothing does. A partial run through the curriculum produces completion, behaviour, and topic-mastery numbers, but no gain at all.

A recurring principle: **an unmeasured duration is stored as `null`, never as `0`.** A zero would be averaged in as an instantaneous decision and would drag every timing average toward zero. Nulls are excluded instead.

---

## 7. Current state: why your dashboard reads zero

As of the last browser-driven check (2026-08-03), the live dashboard showed **1 student, 0 completed modules, and 0% on everything.** It has not been re-opened since, so treat that as the last confirmed reading rather than today's.

This is not a fault. The analytics machinery is deployed, working, and correctly reporting an empty cohort. Every metric on the page is waiting on the same thing: students going through modules.

To get meaningful numbers you need, in rough order of importance:

1. **Students who finished all six modules AND took the final assessment.** Nothing in the Awareness Improvement section exists without a paired pre-test average and a final assessment score. This is the single highest-value thing to collect, and since the move to one end-of-curriculum test it is also the most expensive: it takes a complete run through the curriculum, not one module.
2. **Students completing simulations.** Behaviour and transfer both come from decision records, and these fill in from module one onward.
3. **At least 10 attempts per assessment** before discrimination indices appear.
4. **Two or more modules of decision data** before cross-module transfer becomes computable.

For a defense demo this now means a handful of students taken **all the way through** rather than partway. Two modules populates behaviour, transfer, topic mastery and completion, but leaves the gain card empty.

---

## 8. What happens when you delete a test account

Deleting a student account removes **everything** keyed to that student, so their results stop counting toward every figure on the dashboard:

| Removed | Kept |
|---|---|
| Their module progress | The audit log entry recording the deletion |
| Their quiz attempts | Module configuration (lessons, quizzes, scenarios) |
| Their per-question responses | Everything belonging to other students |
| Their simulation decisions | |
| Their activity events | |
| Their personal analytics summary | |
| Their gamification record (points, badges, streak) | |
| Their final assessment result | |

The deletion also **immediately recomputes** all six module summaries and the cohort rollup, so the dashboard reflects the removal straight away rather than waiting for the nightly job.

**So yes: delete a test student and their contribution to the analytics goes with them.** This is intentional. It also means you should not delete accounts whose data you still want in your results.

> **Why this list is worth trusting now.** It has been wrong three times, once per feature that added a collection: `quizResponses` (a deleted student's answers kept feeding item analysis forever, invisibly), `gamification` (the deleted student stayed on the leaderboard, and recreating them produced two rows under one name), and `finalAssessmentProgress`. All three are fixed. The test covering it was also rewritten: the collections are declared once as data, seeded from that declaration and asserted from it, so covering a new one is a single list entry rather than three edits someone can do two of. It was confirmed to fail, naming the right collection, before the last fix went in.

> **Practical consequence for testing.** If you run a pilot, collect the numbers, and then tidy up by deleting the test accounts, your analytics go back to zero. **Export the CSVs first.** An exported CSV is a file on your machine and survives any later deletion.

---

## 9. Where each number is computed

If a panelist asks where a figure comes from:

| Layer | File | Role |
|---|---|---|
| The mathematics | `functions/src/modules/analytics/metrics.ts` | Every statistic, as pure functions, unit tested |
| Fetch and persist | `functions/src/modules/analytics/service.ts` | Reads raw collections, calls the maths, writes the summary |
| Entry points | `functions/src/modules/analytics/controllers.ts` | The callables, and the nightly schedule |
| The final assessment's own gain | `functions/src/modules/finalAssessment/service.ts` | Grades the one end-of-curriculum test and stores its gain at submit time |
| The screen | `src/pages/Admin/Analytics/` | Formatting only, no computation |
| The exports | `src/pages/Admin/Analytics/reportRows.js` | Serializes stored documents, no computation |

There is now one number computed in two places, and it is deliberate. `finalAssessment/service.ts` stores each student's own gain on their result document at submit time, so what the *student* is shown can never move afterwards. The analytics pipeline recomputes cohort and per-module gains from the raw `quizResponses` rows. They answer different questions (one student's frozen result vs. the current class rollup), so they are allowed to differ if an admin edits the item bank between them. If a panelist asks, that is the answer: not two derivations of one figure, two figures.

---

## 10. Six things NOT to claim

Worth reading once before a defense.

1. **Do not quote a normalized gain without its `pairedCount`.** A gain of 0.62 from three students is not a cohort result.
2. **Do not call the final assessment an independent post-test.** It is the same instrument as the pre-tests, by design, and it is a 3-of-5 subset of them. Say "same item bank, subset of 18 items" and it is a strength. Say "post-test" and let a panelist discover the overlap, and it is a finding.
3. **Do not read the first-attempt safe rate as a pass rate.** It measures whether the *first* instinct was correct, not whether the student eventually succeeded. Everyone eventually succeeds by design.
4. **Do not treat a high p-value as a good question.** It means the question was easy. Difficulty and quality are different axes, which is exactly why discrimination is reported alongside it.
5. **Do not call any difference between two groups significant.** With a class-sized cohort these are descriptive statistics, not inferential ones. No significance test is being run.
6. **Do not describe the analytics as real-time.** They are recomputed nightly and on demand. The figure on screen is as of the last aggregation, and the card tells you when that was.

---

*Written against the implementation deployed to `capstone-c0628` on 2026-08-07. Updated for the move from six per-module post-tests to one end-of-curriculum final assessment, the removal of section segmentation, the answer-distribution block and its export, and the gamification collection. If a metric changes, `metrics.ts` is the file that changed, and this document should change with it.*

*One note on stored aggregates: the answer distribution is computed at aggregation time, so it only appears on a module once that module has been refreshed since 2026-08-07. Click Refresh All, or wait for the nightly job.*
