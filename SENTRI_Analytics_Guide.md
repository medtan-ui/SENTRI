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
| Answers any single question (pre-test, quiz, or post-test) | One row per question: topic, right/wrong, time spent | `quizResponses` |
| Submits a whole quiz | One row: score, passed, attempt number | `quizAttempts` |
| Makes a choice in a simulation | One row per decision, **including retries** | `scenarioDecisionRecords` |
| Finishes a lesson, module, or assessment | One row: what happened, how long it took | `analyticsEvents` |
| Progresses through a module at all | One running record per student per module | `moduleProgress` |

Two details in here carry a lot of weight later:

- **`quizResponses` is per *question*, not per test.** A quiz attempt only knows "you scored 72%". Item analysis needs to know *which* questions you got wrong, which is why this collection exists at all.
- **Every decision is recorded, including the retries.** The simulation always eventually lets a student through to the safe outcome. If we only stored the final decision, the safe rate would read 100% forever and mean nothing. Storing `attemptNumber` is what makes "did they get it right *first* time" answerable.

Nothing here is writable by a student's browser except their own progress and their own decisions. Grading happens server-side specifically so a post-test score cannot be manufactured.

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

**Average pre-test and post-test** are straightforward: the mean score on the same item bank, before and after.

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

---

## 5. Exports

Five CSV files plus a PDF path, all from the Export bar.

| Button | Contains |
|---|---|
| Cohort Summary | Every headline figure as label/value pairs, ready to paste into a document |
| Module Breakdown | Per-module completion, average score, gain, and safe rate, in curriculum order |
| Topic Mastery | Per-topic correct rates at pre, post, and quiz |
| Item Analysis | Every question across every module, with difficulty and discrimination |
| Activity Trend | The 30-day time series |
| **Print / Save as PDF** | Opens the browser's print dialog. Choose "Save as PDF" as the destination. |

Filenames carry the date, so exports taken on different days do not overwrite each other.

**One convention that matters when reading a CSV:** an unmeasurable statistic exports as a **blank cell, never as 0**. A 0 in a normalized gain column would be a claim ("no learning occurred"). A blank is the truth ("not measurable yet"). Same for a suppressed discrimination index, which exports blank with the attempt counts in their own adjacent columns.

---

## 6. Why a number is blank or zero

| You see | It means |
|---|---|
| Normalized gain `â€”` | No student has both a pre-test and a post-test on record yet |
| `Not yet measurable` | Same as above, stated in words |
| Cross-module transfer `Not measurable yet` | Fewer than two modules have simulation decisions |
| `D: pending (4/10)` | Not enough attempts for a meaningful top/bottom split |
| Median time to decide `â€”` | No decision had its duration measured |
| Topic gain blank | That topic has pre-test data or post-test data, but not both |
| A flat activity chart | No module completions in the last 30 days |
| Everything reading 0% | See the next section |

A recurring principle: **an unmeasured duration is stored as `null`, never as `0`.** A zero would be averaged in as an instantaneous decision and would drag every timing average toward zero. Nulls are excluded instead.

---

## 7. Current state: why your dashboard reads zero

As of the last check, the live dashboard shows **1 student, 0 completed modules, and 0% on everything.**

This is not a fault. The analytics machinery is deployed, working, and correctly reporting an empty cohort. Every metric on the page is waiting on the same thing: students going through modules.

To get meaningful numbers you need, in rough order of importance:

1. **Students with a completed pre-test AND post-test.** Nothing in the Awareness Improvement section exists without paired bookends. This is the single highest-value thing to collect.
2. **Students completing simulations.** Behaviour and transfer both come from decision records.
3. **At least 10 attempts per assessment** before discrimination indices appear.
4. **Two or more modules of decision data** before cross-module transfer becomes computable.

For a defense demo, a handful of students taken end to end through two modules will populate almost everything on the page. One student through one module will not.

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

The deletion also **immediately recomputes** all six module summaries and every cohort rollup, so the dashboard reflects the removal straight away rather than waiting for the nightly job.

**So yes: delete a test student and their contribution to the analytics goes with them.** This is intentional. It also means you should not delete accounts whose data you still want in your results.

> **Practical consequence for testing.** If you run a pilot, collect the numbers, and then tidy up by deleting the test accounts, your analytics go back to zero. **Export the CSVs first.** An exported CSV is a file on your machine and survives any later deletion.

---

## 9. Where each number is computed

If a panelist asks where a figure comes from:

| Layer | File | Role |
|---|---|---|
| The mathematics | `functions/src/modules/analytics/metrics.ts` | Every statistic, as pure functions, unit tested |
| Fetch and persist | `functions/src/modules/analytics/service.ts` | Reads raw collections, calls the maths, writes the summary |
| Entry points | `functions/src/modules/analytics/controllers.ts` | The callables, and the nightly schedule |
| The screen | `src/pages/Admin/Analytics/` | Formatting only, no computation |
| The exports | `src/pages/Admin/Analytics/reportRows.js` | Serializes stored documents, no computation |

---

## 10. Five things NOT to claim

Worth reading once before a defense.

1. **Do not quote a normalized gain without its `pairedCount`.** A gain of 0.62 from three students is not a cohort result.
2. **Do not read the first-attempt safe rate as a pass rate.** It measures whether the *first* instinct was correct, not whether the student eventually succeeded. Everyone eventually succeeds by design.
3. **Do not treat a high p-value as a good question.** It means the question was easy. Difficulty and quality are different axes, which is exactly why discrimination is reported alongside it.
4. **Do not call any difference between two groups significant.** With a class-sized cohort these are descriptive statistics, not inferential ones. No significance test is being run.
5. **Do not describe the analytics as real-time.** They are recomputed nightly and on demand. The figure on screen is as of the last aggregation, and the card tells you when that was.

---

*Written against the implementation as deployed on 2026-08-03. If a metric changes, `metrics.ts` is the file that changed, and this document should change with it.*
