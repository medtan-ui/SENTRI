# SENTRI: Presentation and Demo Guide

*A running order for demonstrating the system, and a map of where every number on the admin side comes from. Verified against commit `09ce937` on 2026-08-20.*

---

# Read this first: the demo will show zeros unless you act now

This is the single largest risk in your presentation, and it is not a software problem.

The analytics dashboard is fully working and correctly reports **an empty cohort**. As of the last live check, it showed one student, zero completed modules, and zero or "not yet measurable" on every learning metric. If you open the Analytics page cold on defense day, that is what the panel sees.

**The Awareness Improvement section stays completely empty until a student has finished all six modules and taken the final assessment.** Under the old design a post-test came after module one, so partial progress produced a number. That is no longer true. Partial runs populate completion, behaviour, and topic mastery, but the headline learning gain needs a full journey.

## What to do, in priority order

1. **Take three to five accounts end to end through all six modules and the final assessment.** This is the only way the Awareness Improvement section fills in. Deliberately vary the results: have one account answer badly on the pre-tests and well on the final, so the normalized gain is visibly positive rather than flat.
2. **Deliberately make risky choices in some simulations.** If every run is flawless, "Consequences triggered" reads 0% and the fast-wrong versus slow-wrong split has nothing in it. You want the behavioural section to have signal.
3. **Complete at least two modules' simulations** so cross-module transfer becomes computable at all.
4. **Click Refresh All on the Analytics page afterwards.** Aggregates are computed on a schedule and on demand. New data does not appear until one of those runs.
5. **Export all six CSVs and keep them.** If anything goes wrong on the day, an exported file is a real artifact you can show. It also survives you deleting test accounts later.
6. **Do not delete the demo accounts before the defense.** Deleting a student removes all their data and immediately recomputes the aggregates. Your dashboard goes back to zero.

> **Item discrimination will still read `pending (n/10)`.** That is by design; it is suppressed below 10 attempts because a top/bottom split on fewer is noise. Do not treat it as a bug, and have the one-line explanation ready: *"It is withheld until ten attempts because the statistic is meaningless below that. The display tells you exactly how far short it is."*

---

# Part 1: The running order

A demo that follows the data is far easier to present than one that follows the menu. Show a student generating data, then show the admin reading it. Roughly 12 to 15 minutes.

## Act 1: The student journey (about 6 minutes)

Sign in as a student who has **not** finished the curriculum, so the gates are visible.

1. **Login, and the gates.** Mention in one sentence that email verification and the forced password change sit between login and the dashboard. Do not dwell.
2. **Student dashboard.** Point out the module grid with locked and unlocked modules, and the rewards row showing rank, streak, and badges.
3. **Open the next module. The pre-test appears first.** Say what it is for: *"This is an ungraded baseline. It is the 'before' measurement that makes learning gain calculable later."* Answer two or three questions and submit.
4. **The lesson.** Scroll to show the required-reading indicator. Mention the simulation stays locked until every section is read.
5. **The simulation. This is your centrepiece, so slow down here.**
   - Show that the student acts on a realistic interface, not a multiple-choice list.
   - **Deliberately make the risky choice.** Let the consequence play. This is the most memorable thing in your whole demo.
   - Show the feedback panel and the retry, then make the safe choice.
   - One line worth saying: *"The engine always eventually lets the student reach the safe outcome. That is why we measure the first attempt, not the eventual one. An eventual-success rate would read 100 percent forever."*
6. **The quiz.** Submit it. Point out that the module completes and the next unlocks **regardless of score**, and say why in one sentence: this is awareness training, not certification, and a gate would lock out the student who most needs the next module.
7. **The progress page.** Three tabs: Overview, Achievements, Leaderboard. Show the badge shelf and the leaderboard, and note that the leaderboard shows nicknames, points, rank, and streak only, never scores.

## Act 2: The admin side (about 6 minutes)

Sign out, sign in as admin. The sidebar is grouped into **Dashboard and Analytics**, then **Content**, then **People**. Use that grouping as your structure.

8. **Admin dashboard.** Total accounts, curriculum modules, Recent Quiz Activity, Completion Rate by Module. One sentence: this is the at-a-glance view; the real reporting is one click away.
9. **Content group, briefly.** Open Modules, then one module's configuration. Show that lesson text, quiz questions, and scenario branching are all editable without touching code. **Show the read-only structural fields** in the scenario editor and explain why: every word a student reads is editable, but the wiring that makes a scenario playable is code-owned, so a saved configuration cannot produce a broken simulation.
10. **Final Assessment manager.** One test for the whole curriculum, 18 items drawn from the six pre-test banks. Say why: it replaced six per-module post-tests, which meant eighteen assessments per student and re-testing a module minutes after reading it.
11. **Accounts.** Show creating an account, and mention the audit log and the cascading delete.
12. **Analytics.** The main event. See Part 3 below for exactly what to say.

## Act 3: The close (about 2 minutes)

13. **Export a CSV live.** It downloads, it opens, it has real numbers in it. This is concrete in a way a screen is not.
14. **One sentence on the nightly job.** Analytics recompute automatically at 2am, and the same calculation is available on demand from this page.

---

# Part 2: How the analytics are connected

This is the part panels probe hardest, because it is where the research claims live. The chain has three stages and you should be able to draw it on a whiteboard.

## Stage 1: The student does something, and a record is written

| When a student... | What gets written | Where |
|---|---|---|
| Answers any single question | One row per question: topic, right or wrong, time spent | `quizResponses` |
| Submits a whole quiz | One row: score, passed, attempt number | `quizAttempts` |
| Makes a decision in a simulation | One row per decision, **including retries** | `scenarioDecisionRecords` |
| Finishes a lesson, module, or assessment | One row: what happened, how long it took | `analyticsEvents` |
| Progresses through a module at all | One running record per student per module | `moduleProgress` |
| Finishes the final assessment | One record: score, pre-test average, normalized gain | `finalAssessmentProgress` |

Two details carry weight later, and both are worth volunteering:

- **`quizResponses` is per *question*, not per test.** A quiz attempt only knows "you scored 72 percent." Item analysis needs to know *which* questions were missed. That is the entire reason this collection exists.
- **Every decision is recorded, including retries.** Storing the attempt number is what makes "did they get it right *first* time" answerable at all.

## Stage 2: Aggregation rolls those raw rows up

Three summary documents are computed from the raw collections:

| Document | Covers | Answers the question |
|---|---|---|
| `moduleAnalytics/{moduleId}` | One module, all students | "How is the class doing on Phishing Awareness?" |
| `studentAnalytics/{userId}` | One student, all modules | "How is this student doing?" |
| `cohortAnalytics/current` | All students, all modules | "Did the training work?" |

## Stage 3: Aggregation runs at three moments

1. **Nightly at 02:00 Philippine time.** So the dashboard is never more than a day stale.
2. **When an admin clicks Refresh.** One module, the cohort, or Refresh All.
3. **When an account is deleted.** Immediately, so a removed student stops counting.

The nightly job and the Refresh All button run the **same code**, so they cannot drift in what they cover.

> **The one rule to state if asked how you trust these numbers:** no statistic is ever computed in the browser. Every figure is calculated by a Cloud Function, stored, and only *read* by the page. The page formats numbers; it never derives them. That is also why the CSV exports serialize the stored values rather than recalculating: if the screen and the export each did their own arithmetic, they could disagree, and the exported one is the one that ends up in the paper.

---

# Part 3: What the admin sees, screen by screen

## The Analytics page, top to bottom

### Cohort Overview

**Coverage row.**
- **Active / N students.** How many have any activity, out of how many accounts exist. "Active" is the honest denominator for everything below.
- **Avg. modules done.** Completed modules divided by students who started anything.
- **Finished all six.** Students who completed the whole curriculum.

**Awareness Improvement.** This is the section your objectives are reported against.
- **Avg. pre-test** and **Avg. final assessment**, on the same item bank.
- **Normalized gain.** Explain this one properly, because the number is not a percentage:

> Raw improvement punishes students who started strong. A student going from 90 to 95 had only 10 points available and took half of them. A student going from 40 to 45 had 60 available and took a twelfth. Both are "+5," and they are not the same. Hake's normalized gain asks what fraction of the *available* improvement was actually captured: g = (post − pre) ÷ (100 − pre). So the first scores 0.50 and the second 0.08.

Bands: 0.70 and above is high, 0.30 to 0.69 medium, above 0 to 0.29 low. Medium is typical of effective interactive teaching; low is typical of lecture-only.

**Three exclusions to have ready**, because they are the fair challenge:
1. It averages *individual* gains, not the gain of averages. Those differ whenever students start at different levels, and only the first answers "did students improve."
2. A student with a 100 percent pre-test is excluded; there is no headroom, so the formula is undefined. They are dropped, not counted as zero, because "could not improve" is not "did not improve."
3. A student missing either bookend is excluded. **`pairedCount` on the card tells you how many actually contributed**, so you never quote a gain over a population you did not measure.

**Behaviour in Simulations.** This is Kirkpatrick Level 3, and it is your strongest differentiator. Knowing the right answer on a test is Level 2. *Behaving* correctly is Level 3, and it is the harder claim.
- **First-attempt safe rate.** Of every decision, how often was the first thing they did the safe thing. It has to be first-attempt because the engine always eventually lets them through.
- **Consequences triggered.** Share of decisions risky enough to fire a consequence.
- **Median time to decide**, plus the split beneath it: how many risky choices were faster than the median (acting without looking) versus slower (looking, then misjudging). Say why they are reported apart: *"These need opposite interventions. Fast and wrong is not reading the screen, and the fix is a slowdown prompt. Slow and wrong is a genuine knowledge gap, and the fix is teaching. One combined error count would hide that."*

**Cross-Module Transfer.** Whether training generalizes or is learned and forgotten per module.
- **Behavioural:** first-attempt safe rate in the later half of the curriculum minus the earlier half.
- **Shared-topic:** the topic `public-wifi` appears in **both** Safe Browsing and Online Safety, deliberately, specifically so this is computable.

**Activity, Last 30 Days.** Daily completions. Empty days are drawn, not skipped, because skipping them would compress quiet periods out of existence and make activity look steadier than it was.

**Badges Earned.** How many students hold each badge and what share of the cohort that is.

### Per-module cards

Top four numbers are self-explanatory: Students, Completion, Pass Rate, Avg. Score. The two sections below are not.

**Topic Mastery.** Correct rate per topic at each measurement point, with the movement between them. This is what turns *"the class scored 72 percent"* into *"the class still thinks HTTPS means a site is trustworthy."* The first is a grade; the second is something an instructor can act on.

**Item Analysis.** This is quality control on your *test*, not on your students.
- **Difficulty (p-value).** The proportion who answered correctly. **Counterintuitive but standard: higher p means easier.** The dashboard shows the label next to the number so you never have to remember the direction.
- **Discrimination (D).** Does this question separate students who understand from students who do not? Compare the top 27 percent against the bottom 27 percent on that one item. Above 0.40 is excellent, 0.20 to 0.39 acceptable, below 0.20 is flagged for rewriting, and negative means something is wrong with the item, usually the wording or the answer key.
- **"Where the answers went."** The distractor breakdown: how answers actually distributed across the choices, with the key marked. This answers what difficulty and discrimination cannot, namely *which* wrong answer students were drawn to. A distractor nobody picks is dead weight; one that outdraws the correct answer is usually a wording problem rather than a knowledge gap.

### Export toolbar

Six CSVs plus a print path: Cohort Summary, Module Breakdown, Topic Mastery, Item Analysis, Distractor Analysis, Activity Trend, and Print / Save as PDF.

One convention worth mentioning if you open a file on screen: **an unmeasurable statistic exports as a blank cell, never as 0.** A zero in a gain column would be a claim, "no learning occurred." A blank is the truth, "not measurable yet."

---

# Part 4: What to say when something is empty

Have these ready. Delivered confidently, an empty state reads as rigor. Fumbled, it reads as a broken system.

| What is showing | What to say |
|---|---|
| Normalized gain is blank or "Not yet measurable" | "No student yet has both a pre-test and a final assessment on record. The metric refuses to report rather than showing a misleading zero." |
| `D: pending (4/10)` | "Discrimination is deliberately withheld below ten attempts, because splitting four students into a top and bottom 27 percent is noise. It tells you exactly how far short it is instead of showing a bare n/a." |
| Cross-module transfer "Not measurable yet" | "Transfer needs simulation decisions in at least two modules. With fewer, there is nothing to compare across." |
| Everything reads 0% | "The analytics are deployed and verified working; what they are correctly reporting is an empty cohort. Every figure is waiting on the same input, which is students going through modules. That is a data-collection stage, not a software gap." |
| Topic gain blank | "That topic has data at one measurement point but not both. A gain needs both halves." |

---

# Part 5: The one story worth telling

If you get an open invitation like *"walk us through how the system works,"* trace a single click. It touches four parts of the architecture in about thirty seconds and shows the system is genuinely wired together.

> A student clicks a risky link inside a phishing simulation.
>
> The browser writes one decision record, containing the choice, whether it was safe, the attempt number, and how long they took. That write is allowed only because the security rules confirm the student is writing their own record.
>
> That write automatically fires a Cloud Function, which rolls the decision into that student's safe and risky totals.
>
> *That* write fires a second function, which recomputes the student's points, rank, badges, and streak.
>
> Meanwhile the student sees a consequence play out on screen and gets to try again.
>
> One click, two automatic server-side steps, and nothing about the analytics or the reward was calculated in the browser. That last part is the reason the numbers on the admin dashboard can be trusted.

---

# Part 6: Presentation-day checklist

**The day before**
- [ ] Demo cohort taken end to end, with varied results and some deliberate risky choices
- [ ] Refresh All clicked on the Analytics page
- [ ] All six CSVs exported and saved locally
- [ ] Screenshots of every key screen, as a fallback if the network fails
- [ ] Confirm the live site loads on the presentation machine and on a phone

**One hour before**
- [ ] Log in as both a student and an admin, in two browser profiles or two windows, so you are not typing passwords mid-demo
- [ ] Have the student account parked on the module you intend to demo
- [ ] Close every unrelated tab and notification
- [ ] Zoom the browser to about 125 percent so the panel can read it

**Do not**
- [ ] Do not delete test accounts before the defense
- [ ] Do not demo on a fresh account with no data
- [ ] Do not open the Analytics page before clicking Refresh, if data has changed since the last aggregation

**If something breaks mid-demo:** say what you expected to see, show the screenshot or the CSV instead, and move on. Do not debug in front of the panel. A prepared fallback reads as professionalism; live troubleshooting eats your time and your composure.

---

*Companion documents: `SENTRI_Diagram_Defense_Guide.md` (explaining the four diagrams), `SENTRI_Figure_Descriptions.md` (paste-ready captions), `SENTRI_Diagram_Corrections.md`, and `SENTRI_Paper_Alignment_Review.md`.*
