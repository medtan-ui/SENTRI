# SENTRI: Capstone Paper vs Built System, Alignment Review

*Adviser-style review: what a panelist will catch, and what to do about it.*

*Revision 1 written against commit `bdd539b`. **Revision 2 (2026-08-19) re-verified against commit `09ce937`**, three commits later, with the frontend and backend unit suites re-run. Compared against MergedSentri.pdf, Chapters 1 to 3, as reviewed in Revision 1; if the paper has been revised since, re-check the items marked STANDING against the current draft.*

---

## Revision 2 delta, 2026-08-19

Three commits landed since Revision 1 (`cd80adf`, `49df8a8`, `09ce937`). Re-verified by reading the diffs and re-running the suites: **frontend 97 passed, backend unit 138 passed, Cloud Functions typecheck clean.** Backend integration was 66 at the last recorded run; emulators were not started for this pass, so treat roughly 301 as the working total and re-run all three before printing a number.

Note that `SENTRI_Progress_Report.md` was last updated on 2026-08-07 and **predates commit `09ce937`**. Its scenario table still lists a malware "fake alert pop-up" scenario that no longer exists. Do not paste that table into the paper.

### What got better for the paper

**R2-1. Answer keys no longer reach a student's item-bank read.** This is the single largest change since Revision 1, and it closes a hole the old rules file documented as an accepted tradeoff. Three new callables (`getQuizForStudent`, `getAssessmentForStudent`, `getFinalAssessmentForStudent`) return questions and choices with `correctChoiceId` and `explanation` stripped, and `firestore.rules` now denies students a direct read of `moduleQuizzes`, `modulePretests`, and `finalAssessment`. Add this to Chapter 3 and to your ISO Security discussion.

**State the caveat yourself, because it is findable.** The default seed content for all three banks still ships inside the client JavaScript bundle. Verified in the current build: `dist/assets/quizService-*.js` carries the quiz items and their keys, and `dist/assets/modulePretestContent-*.js` carries the pre-test bank. So the defensible claim is that grading is authoritative server-side and a score cannot be forged, and that the live item bank is never served to a student. It is not that a student cannot see an answer key. The seeded key also stops being the live key the moment an admin edits an item. If you want the stronger claim, the seed content has to move server-side.

**R2-2. Replays record nothing, which protects your Kirkpatrick Level 3 measurement.** A student who re-enters a simulation they already finished runs it as practice: no decision records are written, so first-attempt safe rate, consequence trigger rate and time-to-decide stay the measurement of the first real attempt. The "First try" ribbon is suppressed and the closing card says the run was practice. A clean replay still earns its badge, through a separate `simulationFlawless` flag on the progress document rather than through the analytics. This is the answer to "what stops a student replaying until their safe rate looks good", and it deserves a sentence in 3.6.

**R2-3. Distractor analysis was added to item analysis.** Every item now reports how answers distributed across its choices, commonest first, with the choice text a student actually read, and the key marked. The key is taken from the response rows rather than from the bank, so an item edited after students answered it still reports against the key that was in force at answer time. There is a sixth CSV export for it. This is standard educational-measurement practice and gives you another defensible table in 3.6: a distractor nobody picks is dead weight in the item, and one that outdraws the key is usually a wording problem rather than a knowledge gap.

**R2-4. Simulation completion is recorded on reaching the end**, not on pressing Continue to Quiz. A student who finished every scene and then navigated away previously had no record of finishing and was sent back through it.

**R2-5. Badge rarity** (how many students hold each badge, and what share of the roster that is) is now computed in the cohort rollup and shown on a student's own badge shelf.

**R2-6. Consequence video slots per risky choice**, plus a rule that the Try Again button stays locked until a configured clip finishes rather than unlocking after five seconds. That is a third video slot type alongside the lesson video and the scenario opening clip, so the video production list is longer than Chapter 3 currently implies.

**R2-7. The live item banks were backfilled with topic tags.** Sixty questions across twelve live documents had no `topic` field, which silently disabled per-topic mastery and item-level transfer analysis entirely. Fixed on 2026-08-07 and verified, so `public-wifi` now genuinely spans safe-browsing and online-safety. One residual: `quizResponses` rows written before the backfill stay untagged, so any response data collected before 2026-08-07 cannot contribute to topic mastery.

### New problems the paper has to absorb

**R2-8. The scenario count changed. There are 16 scenes, not 17.** Malware Awareness went from three scenarios to two: `FakeAlertScene`, the scareware pop-up, was deleted outright, and Scenario 1 gained a second safe choice (run a site safety check). Current counts: password-security 3, phishing-awareness 2, malware-awareness 2, safe-browsing 3, data-privacy 3, online-safety 3. **If any Chapter 3 storyboard depicts the malware fake-alert scene, that figure no longer matches the system.**

**R2-9. A live content defect: the malware lesson promises a scenario that was deleted.** `src/data/moduleContent/malwareAwareness.js` still reads "Scareware is the trap embedded in the next scenario." There is no next scenario for it. A student reads a promise the system does not keep, and a panelist clicking through will hit it. This is a code and content fix rather than a paper fix, and it should be done before the defense. Either restore the scene or rewrite that paragraph so it teaches scareware without forward-referencing a simulation.

**R2-10. The phishing storyboard changed pedagogy and naming.** Scenario 1's safe path moved from "inspect the sender, then report the email" to "message the instructor on Campus Chat to check whether they posted it", which is out-of-band verification through a channel the attacker does not control. The fictional platform is now "ClassDeck" rather than a generic student portal. This is a better lesson, but any figure, storyboard, or narrative in Chapter 3 describing the old flow is now stale. Check the phishing storyboards specifically.

**R2-11. Stored scenario edits from before this change were discarded.** `SCENARIO_CONTENT_VERSION` went from 2 to 3, and a stored document at the old version is now ignored and overwritten rather than layered over the new config. Any admin edits made to the phishing or malware scenario text before commit `09ce937` are gone. Worth knowing if someone remembers editing something that has since reverted.

**R2-12. The replay-suppression path and `simulationFlawless` have no test coverage.** Checked: zero occurrences in `functions/test/unit/gamification.rewards.test.ts` and `test/scenarioService.test.js`. Everything else on that seam is tested; these two are not, and they are precisely the mechanism that protects your Level 3 numbers. If a technical panelist asks how you know replays do not contaminate the behavioural data, the honest answer today is that it is implemented and untested. One unit test on `totalsFrom` with `simulationFlawless` set, and one asserting the engine writes no decision on a replay, would close it.

**R2-13. Field names in the ERD may be stale.** The camelCase migration renamed `quiz_responses` to `quizResponses`, `scenario_decision_records` to `scenarioDecisionRecords`, and every snake_case attribute on scenario configs, decision records and progress documents (`is_safe_choice` to `isSafeChoice`, `pretestScore` to `preTestScore`). If Figure 3.12 or its narrative shows any snake_case attribute, it no longer matches the database.

**R2-14. B8 is now settled, not open.** Section segmentation is definitively removed and recorded as a deliberate reversal. Delete "section assignment" from the ERD narrative, and do not describe it as future work either, unless you intend to rebuild it.

### Prompts to add to the Part E set

11. *"Here is my Chapter 3 section on system security. Rewrite it to include the server-side answer-key stripping described in SYSTEM FACTS: three callables that return questions without the correct answer or explanation, and Firestore rules that deny students a direct read of the three item-bank collections. Include, as a stated limitation, that the default seeded item content still ships in the client JavaScript bundle, so the claim is server-side grading integrity rather than an unreachable answer key."*

12. *"Add a paragraph to Section 3.6 Data Analysis explaining two safeguards on the behavioural data: first, that only a student's initial run through each simulation is recorded, because replays deliberately write no decision records, so first-attempt safe rate measures the first real attempt; and second, that every decision record carries an attempt number, so an eventual-success rate cannot be mistaken for a first-attempt rate. Then add distractor analysis to the item-analysis discussion: how answers distributed across each item's choices, with the key marked, used to identify dead distractors and items whose wording draws students away from the key."*

---

## 0. Verdict in one paragraph

The newer parts of Chapter 3 (use case narrative, system architecture, activity diagram, ERD narrative) describe the system you actually built, and describe it well. Chapter 1 and Chapter 2 still describe an earlier design, so the paper currently contradicts itself inside one document. Two substantial features exist in code but appear nowhere in Chapter 1: the gamification layer and the end-of-curriculum final assessment. Chapter 3 has no sample size, no statistical treatment beyond percentages, and no usability metric. Four workstreams: fix the Chapter 1 and 2 contradictions, add the missing features to Chapter 1, build out Chapter 3's evaluation design, and reconcile the ethics section with the leaderboard.

---

## Part A. Already correct, do not touch

- Three-tier architecture description in 3.4 (Figure 3.3 narrative). It matches the code exactly: React presentation tier, email verification gate then forced password change gate, role-split dashboards, YouTube as external video host, Cloud Functions grouped by responsibility, Firestore reached through two paths (client writes under Security Rules, Admin SDK writes bypassing them), Cloud Scheduler nightly job.
- The use case narrative's statement that "progression is not blocked by score" and that only the final assessment carries a passing threshold. Correct.
- The activity diagram narrative. Correct end to end, including "marking the module complete and unlocking the next module regardless of the score obtained".
- The ERD narrative's account of Firestore as document-oriented, with nested choices as embedded attributes rather than separate entities. Correct and well argued.
- Collection names in the ERD match `functions/src/shared/constants.ts` and `firestore.rules`.
- 3.7 Informed Consent, Confidentiality, Honest Reporting, Respect for Participants. Fine as written.
- Chapter 2 RRL coverage. Broad enough to support everything, including gamification (Batzos et al. 2023, Sithole et al. 2025), which you will need in Part C.

---

## Part B. Contradictions to fix

### Critical (a panelist will find these)

**B1. Passing the quiz is not required to advance.**
Code: `functions/src/modules/quiz/service.ts` sets `moduleCompleted: true` and unlocks the next module on every submission, explicitly not gated on `passed`. The passing score only records a pass/fail flag for analytics.
Paper says otherwise in at least five places:
- 1.5 Scope: "Students must complete each module and take the quiz before unlocking the next module" (ambiguous, tighten it)
- 1.6 Module Completion: "finishes a module and passes the required quiz"
- 1.6 Module Progression Control: "completes the current module and passes its quiz"
- 1.6 Sequential Module Progression: "complete one module and pass its quiz before the next module becomes available"
- 2.7 and 2.8: "unlock the next module only after passing the test with a certain score"
- 2.9 Gap Analysis table, Sequential Module Progression row: "learners must pass the quiz before unlocking the next module"
Meanwhile Chapter 3 says the opposite, correctly. Fix Chapters 1 and 2 to match Chapter 3. Correct phrasing: completion and unlocking are triggered by submitting the module quiz, and the recorded score is used for analytics and the student's own record rather than as a gate. The only pass threshold in the system is on the final assessment (75 percent).

**B2. The post-test is one end-of-curriculum final assessment, not a per-module or external post-test.**
Code: `modules/finalAssessment`. Eighteen items, three drawn from each module's five-item pre-test bank, `passingScore: 75`, `attemptsAllowed: 2`, no time limit (see B11), unlocks only when all six modules are complete, re-checked inside the transaction. Six per-module post-tests were deliberately removed.
Paper: 1.6 Post-test, 3.3 Research Instruments, 3.5 steps 7 and 9, and 3.6 all describe a post-test administered by the researchers after module completion. Rewrite all four to describe the in-system final assessment. Chapter 3's ERD narrative and activity diagram already have it right.

**B3. There are six per-module pre-tests, not one pre-test before system use.**
Code: `src/data/modulePretestContent.js`, five items per module, thirty total, each taken once before that module's lesson and gating it. `submitAssessment` refuses a second submission.
Paper 3.5 step 7: "Before using the system, the student respondents will answer a cybersecurity awareness pre-test." Rewrite: the baseline is collected in-system, per module, immediately before each lesson, and the six scores are averaged when the final assessment computes learning gain.

**B4. Quizzes cannot be freely retaken.**
Code: one attempt. A retake exists only as an admin-granted appeal (`grantQuizRetry`), which requires a written reason, records the granting admin's uid and timestamp, leaves lesson and simulation progress intact, does not re-lock the next module, and can only raise the recorded score.
Paper 1.5: students can "retake quizzes when necessary". Rewrite as an appeal path and present it as a design strength (assessment integrity plus a documented, audited exception), not as a limitation.

**B5. The gamification layer is absent from Chapter 1 entirely.**
Code: `functions/src/modules/gamification/`. Points tied to progress state (recomputed, never incremented, so a retry or reset cannot inflate a score), 7 ranks (Trainee through Vanguard), 15 badges, daily streaks on Asia/Manila day boundaries, and a leaderboard.
It appears in the Chapter 3 use case diagram and architecture diagram but has no objective, no scope statement, no definition of terms, and no gap analysis row. Expected panel question: "which objective does the leaderboard serve?" Right now there is no answer in the paper. See Part C for what to add.

**B6. The ethics section contradicts the leaderboard.**
3.7 Responsible Use of Learning Analytics: analytics "will not be used to shame, punish, rank, or publicly identify individual respondents". The system ships a class leaderboard. See D8 for the reconciliation, which is straightforward because the code is actually defensible here.

**B7. Cloud Storage for Firebase is not used.**
No `getStorage`, no `firebase/storage` import, no storage rules in `firebase.json`. Videos are YouTube embeds, which Figure 3.3 correctly shows. Remove the 1.6 definition or restate it as "not used in the final implementation; media is hosted externally on YouTube".

**B8. Section assignment no longer exists.**
The 3.4 ERD narrative says the Users entity stores "section assignment". That feature was removed: `functions/src/shared/sections.ts`, `src/utils/sections.js`, the `setUserSection` and `listSections` callables, and the section test suites are all gone, and `cohortAnalytics` is now a single rollup with no section scoping. Delete the phrase, or restore the feature if a panelist asked for class-level segmentation. Deciding this now is cheaper than deciding it in the defense.

**B9. Videos are not populated in the code seed.**
Every lesson has `videoId: ''` and every scenario has `videoAvailable: false, materialUrl: null`. Seeds are only used on first read, so **verify against live Firestore (Module Configuration) before claiming either way.** This matters because the title and Objective 3 promise "Animated Scenario-Based Learning" and "animated characters". If the animations are not embedded by defense, the honest phrasing is that the scenario engine renders animated, interactive scenes in the UI layer and the produced video assets are integrated through admin-editable video slots. The storyboards in 3.4 support the production claim.

### Moderate

**B10. Self-registration vs system-provided accounts.** The use case narrative says students "log in using a system-provided account", but `registerStudentAccount` is a deliberately public callable, `/register` exists, and 1.5 says students can register. Both paths are real (admin-created accounts get `mustChangePassword: true`). Say so in one place and make 1.5, the use case, and the IPO diagram agree.

**B11. RESOLVED in code (2026-08-07).** `timeLimitMinutes` was removed entirely from both zod schemas, both TypeScript models, the quiz and final assessment seeds, the JSDoc typedef, and both admin editors. Nothing in the system counts down and no setting implies otherwise. The paper must simply not mention a time limit. The Quiz Summary card's "Estimated Completion Time" survives as an authoring aid and is not a limit.

**B12. Figure 3.4 (DFD) is stale relative to the ERD.** Four processes and one "System DB" cannot represent scenario decision capture, the gamification layer, the final assessment, or the nightly aggregation, all of which the ERD does represent. Either redraw the Level 1 with those processes and data stores, or state its abstraction level explicitly so the mismatch reads as deliberate.

**B13. Figure 3.12 (ERD) may not draw what its narrative names.** The narrative lists Final Assessment and Final Assessment Progress as main entities; check whether the drawn figure includes them. `finalAssessment` and `finalAssessmentProgress` are real collections with rules of their own.

**B14. 3.1 never names the research design.** It opens "This research design is suitable for the study because" with no antecedent. Name it in the first sentence (see D1).

**B15. ISO/IEC 25010 edition.** The five characteristics you list (functionality, usability, reliability, performance efficiency, security) are the 2011 names. The 2023 revision renames Usability to Interaction Capability and Portability to Flexibility, and adds Safety. Cite the edition you are actually using, and check which one your program requires. Many Philippine capstones still use 2011; that is fine if you say so.

**B16. System naming is inconsistent.** "SENTRI" (paper), "Web-Based Cybersecurity Awareness LMS" (Figure 3.4), "Cyber-Simulation Training Platform" (repo README). Standardize on one, and use the full title only on first mention.

---

## Part C. In the system, missing from the paper

These are strengths. Leaving them out costs you credit you have already earned.

**Add to Chapter 1 (objectives, scope, definition of terms):**
- The end-of-curriculum final assessment, with the reasoning: six per-module post-tests meant eighteen assessments and re-tested each module minutes after its lesson; one test after the whole curriculum measures retention rather than recall, and its item bank is seeded from the same six pre-test banks so the before and after use the same items.
- The gamification layer, as its own objective. Suggested wording: "To integrate a gamified engagement layer consisting of points, ranks, badges, activity streaks, and a leaderboard, to sustain learner motivation across a multi-module curriculum." Chapter 2 already has the support (Batzos et al. 2023; Sithole et al. 2025; Mathew et al. 2025). Add a matching row to the 2.9 Gap Analysis table.
- Definition of terms to add: Final Assessment, Normalized Learning Gain (Hake's g), Item Analysis (difficulty and discrimination), First-Attempt Safe Rate, Points, Rank, Badge, Streak, Leaderboard, Audit Log.

**Add to Chapter 3 (system overview and, later, Chapter 4):**
- Server-side authoritative grading. The client sends question-to-choice answers only, never a score, and `correctChoiceId` never leaves the server. This is your answer to "how do you know the learning gain was not manufactured".
- Per-question response capture (`quizResponses`, one row per answered question), which is what makes classical item analysis possible: difficulty (p-value) and discrimination (D) on a 27 percent upper/lower split, with D withheld below 10 attempts because the split is noise below that.
- First-attempt safe rate as the behavioural measure. The scenario engine always eventually lets a student through to the safe outcome, so an eventual-success rate would read 100 percent forever. `attempt_number` on every decision record is what makes behaviour measurable at all. This is a genuinely uncommon design decision and worth a paragraph.
- The fast-wrong vs slow-wrong split: risky choices faster than the median (acting without reading) reported separately from risky choices slower than the median (deliberating and still misjudging), because the two imply opposite interventions.
- Cross-module transfer, with `public-wifi` deliberately measured in both Safe Browsing and Online Safety specifically so transfer is computable.
- Nightly scheduled aggregation at 02:00 Asia/Manila, sharing one code path with the manual refresh so the two cannot drift.
- CSV and PDF export that serializes stored aggregates and never recomputes, so the figure in your paper and the figure on screen cannot disagree.
- Audit logging of administrative actions, which survives account deletion.
- Cascading delete of all student data with immediate analytics recompute.
- The automated test suite: unit tests, integration tests against the Firestore and Auth emulators, and a suite that loads the real `firestore.rules`. See D7.
- The first-run guided tour and the ungraded "Module 0" tutorial.

---

## Part D. Chapter 3 build-out

### D1. Name the research design

Suggested first sentence: *"This study employs a developmental research design for the construction of the system, combined with a one-group pretest-posttest design for measuring learning outcomes and a descriptive-evaluative design for measuring system acceptability."*

Then state the limitation before a panelist does: no control group, so the design is pre-experimental and the results describe change over time in a single group rather than establishing causation.

### D2. Respondents and sample size

**Recommendation: 30 student respondents who complete the full curriculum. Recruit 35 to 40 to absorb attrition. Minimum defensible for paired analysis: 20. Plus 5 to 10 IT evaluators (a mix of faculty and practitioners), minimum 5.**

Four anchors to justify 30, use them in this order:

1. **Your own instrument sets a hard floor.** The item discrimination index is suppressed below 10 whole attempts per assessment, by design, because splitting fewer than 10 respondents into a top and bottom 27 percent produces noise. Fewer than 10 completers makes your item analysis unreportable. Thirty leaves margin after attrition. *This is the strongest justification you have, because it comes from your own system rather than from a textbook.*
2. n greater than or equal to 30 is the conventional threshold for stable descriptive statistics and for the normality assumption behind a paired t-test.
3. Usability scores stabilize at roughly 20 to 30 respondents; below that a single outlier moves the mean visibly.
4. Purposive, voluntary sampling of non-CCS students across a six-module curriculum realistically limits reach. Say this as a stated limitation rather than leaving it implied.

Also add to 3.2:
- Explicit inclusion and exclusion criteria (you have most of this already).
- Attrition handling, stated in advance: a student who does not complete all six modules and the final assessment is excluded from the paired learning-gain analysis but still counts in the acceptability and usability results. Report both denominators.
- A testing window. Recommend either two supervised sessions or a one to two week window with a scheduled final assessment day, because the final assessment only unlocks after all six modules.

**Operational warning to put in your own notes, not the paper:** deleting a test account removes all of that student's data and immediately recomputes the aggregates. Export every CSV before you clean up accounts.

### D3. Instruments to add

1. **ISO/IEC 25010 acceptability questionnaire** (you have this). Specify the number of items per characteristic, the 5-point Likert scale, and that there are separate learner-side and evaluator-side forms.
2. **System Usability Scale (SUS), 10 items, administered separately.** This is the usability metric you are missing. It produces a single 0 to 100 score with published benchmarks (a mean near 68 is average), so you can report "SENTRI scored X, above the benchmark" instead of only "4.35, Highly Acceptable". Cheap to add, and it directly answers the panel question about usability measurement.
3. **Objective usability data you already collect and are not using.** Task completion rate (from `moduleProgress`), time on task (`analyticsEvents.durationMs`, `quizResponses.durationMs`, `scenarioDecisionRecords.duration_ms`), and error rate (first-attempt safe rate). Very few capstones can produce objective usability data alongside self-reported usability. Name it as a formal instrument, not an afterthought.
4. **Content validation form** for module content, scenario flow, quiz items, answer keys, and consequence feedback, reviewed by a cybersecurity or IT faculty validator against a short rubric. 3.7 currently says this "may" happen; make it a real instrument with a real form.
5. **Instrument reliability.** Report Cronbach's alpha for the evaluation questionnaire. For the knowledge test, either KR-20 or the item analysis your system already computes. State which, and why.

### D4. Statistical treatment (3.6 needs more than percentage improvement)

Right now 3.6 uses frequency, percentage, percentage improvement, and weighted mean. The first question from the panel will be whether the improvement is statistically significant. Add:

- **Normality check** (Shapiro-Wilk) on the paired differences.
- **Paired-samples t-test** if the differences are normally distributed, **Wilcoxon signed-rank** if not. Report the test statistic, p, and an effect size (Cohen's d, or r for Wilcoxon).
- **Hake's normalized gain**, which your system already computes: `g = (post - pre) / (100 - pre)`, averaged per student rather than computed from cohort averages, with unpaired students and 100 percent pre-tests excluded rather than counted as zero, and `pairedCount` always reported alongside. Put the interpretation bands in a table:

| g | Interpretation |
|---|---|
| 0.70 and above | High gain |
| 0.30 to 0.69 | Medium gain |
| Above 0 to 0.29 | Low gain |
| 0 or below | No measured gain |

- **Item analysis interpretation tables**, both of which your system outputs:

| Difficulty (p) | Label |
|---|---|
| 0.90 and above | Very easy |
| 0.70 to 0.89 | Easy |
| 0.50 to 0.69 | Moderate |
| 0.30 to 0.49 | Hard |
| Below 0.30 | Very hard |

| Discrimination (D) | Interpretation |
|---|---|
| 0.40 and above | Excellent item |
| 0.20 to 0.39 | Acceptable |
| Below 0.20 | Flagged for revision |
| Negative | Defective item or wrong answer key |

- **Behavioural metrics as descriptive statistics**: first-attempt safe rate, consequence trigger rate, median time to decide, and the fast-wrong vs slow-wrong counts.
- **SUS scoring procedure** if you adopt D3 item 2.
- **A caution paragraph**: with a class-sized purposive sample these are descriptive statistics; no claim of generalizability beyond the participating group is made.

### D5. Measurement caveat you must disclose or fix

Your pre-test total is 30 items (five per module across six modules). Your final assessment is 18 items (three per module) drawn from those same banks. **The "after" measurement is a matched subset of the "before" instrument, not the identical instrument.** A sharp panelist will notice, and it is better to raise it yourself.

Two clean options:

- **Option A, disclose.** Describe the design as a matched-item subset, explain that all 18 final assessment items are drawn verbatim from the pre-test banks, and list the non-equivalence as a limitation.
- **Option B, stronger.** Compute the reported gain on the matched 18 items only: take each student's pre-test responses for exactly the items that appear on the final assessment, score those, and compare. Because `quizResponses` stores one row per answered question, this is a filter over data you already have, not new collection. Start from the Item Analysis CSV export. Do this in the paper's analysis, not in the software.

If you take Option B, note that the dashboard's own gain uses the average of the six full pre-test percentages. Label the two figures differently in Chapter 4 and never mix them in one table.

### D6. Add an evaluation framework subsection

Frame the whole evaluation with Kirkpatrick, which is what the code already implements (see the header of `functions/src/modules/analytics/metrics.ts`):

- **Level 1, Reaction:** ISO/IEC 25010 acceptability plus SUS.
- **Level 2, Learning:** pre-test to final assessment, normalized gain, per-topic mastery.
- **Level 3, Behaviour:** first-attempt safe rate, consequence trigger rate, decision timing, cross-module transfer.
- **Level 4, Results:** explicitly out of scope for a capstone, and say why.

This one addition answers "how effective is the system really" better than anything else on this list, and it costs nothing because every metric already exists and is already computed server-side.

### D7. Add a system testing and verification subsection

Chapter 3 currently has no verification section, which leaves your strongest evidence for the Reliability and Security characteristics invisible. Add a subsection covering:

- Unit tests over pure logic (grading, metrics, gamification rules, validators).
- Integration tests against the Firestore and Auth emulators (end-to-end assessment flow, progress flow, account management including cascading delete).
- A security rules test suite that loads the real `firestore.rules` rather than a copy.
- Browser-driven verification of the deployed admin analytics page against the live project.
- The iterative test-and-fix loop, which is exactly what your Iterative Model in 3.1 claims and this evidences.

Give the count as of your defense build. Last recorded figure: 243 automated tests across both ends of the stack. **Re-run and re-count before you write the number down.**

### D8. Ethics: reconcile the leaderboard

Rewrite Responsible Use of Learning Analytics to separate two audiences:

- **Research reporting:** aggregated only, no respondent identified, consistent with what you already wrote.
- **In-product motivation:** the leaderboard is a student-facing engagement feature. Verified in code, a leaderboard row exposes only nickname, points, rank name, current streak, and badge count. It does not expose quiz scores, attempts, module history, or email. Students set their own nickname, so participation is pseudonymous by default, and a student outside the visible top rows still sees their own standing rather than being told only that they did not place.

State the rationale (peer comparison as a motivational mechanism, supported by your own gamification RRL), and offer either an opt-out or a nickname advisory in the orientation script.

Also add to 3.7, because ethics reviewers ask and it is currently missing:
- **Data retention and disposal:** how long Firestore data is kept after the study, who deletes it, and when.
- **Storage of exports:** where the CSV and PDF exports are kept and who has access.
- **Deletion mechanics:** account deletion cascades across every collection keyed to that student and immediately recomputes the aggregates, so a withdrawal request is genuinely honored rather than only flagged.

---

## Part E. Paste-ready context block for a Claude chat

Copy everything between the fences into a new chat, then use the prompts below it. The block is written so a model with no access to the repo can revise the paper accurately.

```
SYSTEM FACTS: SENTRI capstone project (TIP Manila, BSIT). Use these as ground
truth when revising the paper. Verified by direct code inspection.

STACK
- React + Vite frontend, Firebase Auth, Cloud Firestore, Cloud Functions v2
  (TypeScript, Node 22), Cloud Scheduler. Firebase project: capstone-c0628.
- Firebase Cloud Storage is NOT used. Lesson and scenario videos are YouTube
  embeds (admin pastes a link or video id into Module Configuration).
- Route gates in order: authenticated, email verified, forced password change
  if on an admin-assigned temporary password, then role-based redirect.
- Two account paths: admin-created (temporary password, must change on first
  login) and student self-registration (a public callable that hardcodes
  role: student server-side).

CURRICULUM
- Exactly six fixed modules in order: password-security, phishing-awareness,
  malware-awareness, safe-browsing, data-privacy, online-safety.
- Plus an ungraded "Module 0" tutorial that is always unlocked and not part of
  the graded curriculum.
- Per module: one 5-item pre-test (once, ungraded, gates the lesson), lesson
  content with required reading sections, an interactive branching scenario
  simulation, and a graded quiz.
- 16 scenarios total: password-security 3, phishing-awareness 2, malware-awareness 2,
  safe-browsing 3, data-privacy 3, online-safety 3.
- Scenario engine is video-pause-interact-branch: students act on realistic
  interface elements rather than picking from a menu, get an in-context
  consequence for a risky choice, and always eventually reach the safe outcome.

PROGRESSION (this is the most commonly mis-stated fact)
- Submitting the module quiz completes the module and unlocks the next one
  REGARDLESS OF SCORE. Progression is never gated on passing.
- The recorded score is used for the student's own record and for analytics.
- Sequence within a module is enforced: lesson requires unlock, simulation
  requires lesson complete, quiz requires simulation complete.
- The only pass threshold in the system is on the final assessment.

ASSESSMENTS
- Pre-test: 5 items per module, 30 total, taken once per module before the
  lesson, ungraded, no retake.
- Quiz: one attempt by default. A retake exists only as an admin-granted
  appeal that requires a written reason, records the granting admin and
  timestamp, leaves lesson and simulation progress intact, does not re-lock
  the next module, and can only raise the recorded score.
- Final assessment: ONE end-of-curriculum test replacing six per-module
  post-tests. 18 items (3 drawn from each module's 5-item pre-test bank, so
  the same instrument items), passing score 75, 2 attempts allowed, unlocks
  only when all six modules are complete. Its per-question rows are written
  under the 'posttest' type so pre/post item analysis compares identical items.
- There are NO time limits anywhere. The setting was removed entirely on
  2026-08-07. Nothing counts down. Do not describe any assessment as timed.
- All grading is server-side. The client sends question-to-choice answers only,
  never a score.
- Answer keys are stripped server-side for student reads. Three callables
  (getQuizForStudent, getAssessmentForStudent, getFinalAssessmentForStudent)
  return questions and choices without correctChoiceId or explanation, and the
  Firestore rules now deny students a direct read of moduleQuizzes,
  modulePretests, and finalAssessment. Precise caveat: the DEFAULT SEED content
  for all three banks still ships inside the client JavaScript bundle, so the
  seeded answer key is technically discoverable there until an admin edits an
  item. Claim server-side grading integrity, not that the key is unreachable.

LEARNING ANALYTICS (all computed server-side, never in the browser)
- Hake's normalized gain g = (post - pre) / (100 - pre), computed against the
  average of that student's six pre-test scores, averaged across students as
  individual gains rather than gain of averages. Students missing either
  bookend, or with a 100% pre-test, are excluded rather than counted as zero.
  pairedCount reports how many students actually contributed.
- Per-topic mastery at pre, quiz, and post.
- Classical item analysis: difficulty (p-value) and discrimination D on a 27%
  upper/lower split. D is suppressed below 10 whole attempts and displayed as
  "pending (n/10)" rather than as 0 or n/a.
- Distractor analysis: how answers distributed across each item choices,
  commonest first, with the choice text a student read and the key marked. The
  key comes from the response rows, not the bank, so an item edited later still
  reports against the key in force at answer time. Sixth CSV export.
- Replays are not recorded. A student re-entering a simulation they already
  finished writes no decision records, so first-attempt safe rate, consequence
  trigger rate and time-to-decide all measure the first real attempt only. A
  clean replay still earns its badge, through a simulationFlawless flag on the
  progress document rather than through the analytics.
- Kirkpatrick Level 3 behaviour: first-attempt safe rate (the engine always
  eventually lets a student through, so eventual success would read 100%
  forever; attempt_number is what makes this measurable), consequence trigger
  rate, median time to decide, and a fast-wrong vs slow-wrong split.
- Cross-module transfer, behavioural (early vs late curriculum) and item-level
  (the topic 'public-wifi' is deliberately measured in both Safe Browsing and
  Online Safety so transfer is computable).
- 30-day activity trend, drawing empty days rather than skipping them.
- Aggregation runs nightly at 02:00 Asia/Manila, on demand from the Analytics
  page, and immediately on account deletion. The scheduled job and the manual
  refresh share one code path.
- Five CSV exports plus a browser print-to-PDF path. Exports serialize stored
  aggregates and never recompute. An unmeasurable statistic exports as a blank
  cell, never as 0.
- Unmeasured durations are stored as null, never 0, so they are excluded from
  averages rather than dragging them down.

GAMIFICATION
- Points derived from progress state and recomputed from scratch, never
  incremented, so a retried trigger, a granted retry, or an admin reset cannot
  inflate or strand a score.
- Points reward both knowledge and behaviour, not just participation: the quiz
  score contributes directly (base + up to half the percentage scored + a
  perfect-score bonus), and finishing a module's simulation with zero risky
  choices (simulationFlawless) now also carries its own bonus, added
  2026-08-19. This is the answer to "why does gamification matter
  pedagogically, not just as a retention gimmick" — the two things being
  rewarded map onto the same Kirkpatrick Level 2 (knowledge) and Level 3
  (behaviour) split the analytics framework already uses.
- 7 ranks: Trainee, Cadet, Analyst, Specialist, Sentinel, Guardian, Vanguard.
- 15 badges, unioned and never revoked once earned.
- Daily activity streaks on Asia/Manila day boundaries.
- Leaderboard exposing only nickname, points, rank name, current streak, and
  badge count. Never scores, attempts, module history, or email. A student
  outside the top rows still sees their own standing.

ADMIN SIDE
- Account management (create, reset password, disable, delete) with an audit
  log that survives deletion, and a cascading delete across every collection
  keyed to that student, followed by an immediate analytics recompute.
- Module Configuration: lesson content, quiz questions and settings, scenario
  branching, module assignments. Every word a student reads is editable; the
  wiring that makes a scenario playable is code-owned and shown read-only, so
  a saved config cannot produce an unplayable simulation.
- Quiz Manager, Scenario Manager (with a flow diagram), Final Assessment
  Manager, Analytics dashboard with exports, quiz retry appeals.

FIRESTORE COLLECTIONS
users, auditLogs, modules, moduleLessons, moduleScenarios, moduleQuizzes,
modulePretests, moduleAssignments, moduleProgress, finalAssessment,
finalAssessmentProgress, scenarioDecisionRecords, quizAttempts, quizResponses,
analyticsEvents, moduleAnalytics, studentAnalytics, learningAnalytics,
cohortAnalytics, gamification.

REMOVED OR NOT BUILT (do not describe these as present)
- Class/section segmentation was built and then removed. cohortAnalytics is now
  a single whole-cohort rollup. The users document has no section field.
- Firebase Cloud Storage.
- Assessment time limits of any kind. The setting was deleted on 2026-08-07.
- App Check enforcement (the code path is complete but ships disabled, by
  decision, because no reCAPTCHA site key exists).
- Video assets are not present in the code seed (every lesson videoId is empty,
  every scenario has videoAvailable: false, every consequenceVideoUrl is null).
  VERIFY against live Firestore before writing about them either way.
- A scareware / fake security pop-up simulation. It existed and was deleted; the
  malware lesson text still forward-references it (see R2-9).

TESTING
- Automated suite on both ends: unit tests over pure logic, integration tests
  against the Firestore and Auth emulators (assessment flow, progress flow,
  account management), and a security rules suite that loads the real
  firestore.rules. Last recorded count: 243 tests. RE-COUNT before citing.
```

### Prompts to run after pasting that block

Run them one at a time, pasting the relevant paper section with each.

1. *"Here is Section 1.5 Scope and Delimitations and Section 1.6 Definition of Terms from my capstone paper. Using the SYSTEM FACTS above, rewrite them so nothing contradicts the built system. Pay particular attention to: quiz passing is not required to advance; the post-test is a single end-of-curriculum final assessment; quizzes are one attempt with an admin-granted appeal; Firebase Cloud Storage is not used. Add definitions for Final Assessment, Normalized Learning Gain, Item Analysis, First-Attempt Safe Rate, Points, Rank, Badge, Streak, and Leaderboard. Keep the existing academic register and formatting. Show a change log at the end listing every edit and why."*

2. *"Here are Sections 1.2 Statement of the Problem and 1.3 Objectives of the Study. Add one specific problem and one specific objective covering the gamified engagement layer described in SYSTEM FACTS, and revise Objective 4 so it describes unlocking on quiz submission rather than on passing. Keep the existing numbering style and parallel structure."*

3. *"Here are Sections 2.7, 2.8, and the 2.9 Gap Analysis Table. Fix every statement that says learners must pass a quiz before unlocking the next module. Add one Gap Analysis row for the gamified engagement layer, drawing on Batzos et al. (2023), Sithole et al. (2025), and Mathew et al. (2025), which are already in my reference list. Match the existing table's column structure and tone."*

4. *"Here is Section 3.1 Research Design and 3.2 Respondents. Rewrite 3.1 so the first sentence names the design (developmental research for system construction, one-group pretest-posttest for learning outcomes, descriptive-evaluative for acceptability) and states the pre-experimental limitation. Rewrite 3.2 to specify 30 student respondents completing the full curriculum with 35 to 40 recruited for attrition, a minimum of 20 for paired analysis, and 5 to 10 IT evaluators. Justify the sample size using these four anchors, strongest first: (a) the system suppresses the item discrimination index below 10 attempts per assessment by design, so fewer than 10 completers makes item analysis unreportable; (b) n of 30 is the conventional threshold for stable descriptive statistics and the normality assumption behind a paired t-test; (c) usability scores stabilize at 20 to 30 respondents; (d) purposive voluntary sampling across a six-module curriculum limits reach, stated as a limitation. Add inclusion and exclusion criteria, attrition handling, and a testing window."*

5. *"Here is Section 3.3 Research Instruments. Rewrite it so the pre-test is described as six in-system per-module pre-tests of five items each and the post measurement is described as the single 18-item end-of-curriculum final assessment. Then add three instruments: a 10-item System Usability Scale administered separately from the ISO/IEC 25010 form; objective usability data already collected by the system (task completion rate, time on task from stored durations, error rate from first-attempt safe rate); and a content validation form for module content, scenario flow, quiz items, answer keys, and consequence feedback. Note that instrument reliability will be reported as Cronbach's alpha for the questionnaire."*

6. *"Here is Section 3.6 Data Analysis Procedure. Expand it beyond frequency, percentage, percentage improvement, and weighted mean. Add: a Shapiro-Wilk normality check on paired differences; a paired-samples t-test with Wilcoxon signed-rank as the non-parametric alternative, reporting the statistic, p, and effect size; Hake's normalized gain with its interpretation bands as a table; item difficulty and discrimination interpretation tables; behavioural metrics as descriptive statistics; and SUS scoring. Include a caution paragraph that these are descriptive statistics over a class-sized purposive sample with no claim of generalizability. Also add a paragraph disclosing that the 18 final assessment items are a matched subset of the 30 pre-test items, and state that the reported gain will be computed on the matched 18 items only."*

7. *"Here is Section 3.5 Data Gathering Procedure. Rewrite steps 7 through 9 so the pre-test is described as administered in-system per module before each lesson, and the post measurement as the single final assessment that unlocks after all six modules are complete. Add a step for exporting the analytics CSV files before any test account is removed. Add a step for administering the SUS alongside the ISO/IEC 25010 evaluation form."*

8. *"Here is Section 3.7 Ethical Considerations. Rewrite Responsible Use of Learning Analytics to separate research reporting (aggregated, no respondent identified) from in-product motivation (a leaderboard exposing only nickname, points, rank name, streak, and badge count, never scores or attempts or module history, with students setting their own nickname so participation is pseudonymous). Add subsections on data retention and disposal, storage of exported files, and the cascading deletion mechanism that honors a withdrawal request."*

9. *"Draft a new Section 3.5 System Testing and Verification for my methodology chapter, covering unit tests over pure logic, integration tests against the Firestore and Auth emulators, a security rules suite that loads the production rules file, browser-driven verification of the deployed admin analytics page, and how the iterative test-and-fix loop maps onto the Iterative Model already described in 3.1. Leave the test count as a placeholder I will fill in."*

10. *"Draft a new subsection for Chapter 3 titled Evaluation Framework, mapping my evaluation onto Kirkpatrick's four levels: Level 1 Reaction (ISO/IEC 25010 acceptability plus SUS), Level 2 Learning (pre-test to final assessment, normalized gain, per-topic mastery), Level 3 Behaviour (first-attempt safe rate, consequence trigger rate, decision timing, cross-module transfer), Level 4 Results (explicitly out of scope, with the reason). Explain in each level which system-generated data supplies the measurement."*

---

## Part F. Verify these yourself before writing

The code cannot answer these; only the live project can.

1. **Are the lesson and scenario videos pasted into Module Configuration on `capstone-c0628`?** The code seeds are empty. This determines how you phrase the "animated" claim in the title and Objective 3.
2. **How many quiz items exist per module in live Firestore?** Quiz content is authored in the admin UI, not seeded from code, so the code cannot tell you. The last written figure was 5 per module, 30 total.
3. **Current automated test count.** Verified 2026-08-19 at commit 09ce937: frontend 97, backend unit 138, typecheck clean. Backend integration last recorded at 66 and not re-run in that pass. Re-run all three before citing a total.
4. **Is Figure 3.12 (ERD) drawing the finalAssessment and finalAssessmentProgress entities** that its own narrative names, and are all its attribute names camelCase? See R2-13.
5. **Do any Chapter 3 storyboards depict the deleted malware fake-alert scene, or the old phishing inspect-the-sender-then-report flow?** See R2-8 and R2-10.
5. **Which ISO/IEC 25010 edition does your program require**, 2011 or 2023.
6. **Is the app actually deployed to a public URL?** `firebase.json` has no hosting block, so `firebase deploy` currently ships functions and Firestore rules only. If Chapter 3 or the defense implies a live hosted web app, confirm where it is hosted.
7. **Did the panel ask for class or section segmentation?** That feature was built and then removed. If they asked for it, decide now whether to restore it or to defend its removal.

---

*Prepared from direct codebase inspection at commit `bdd539b`. No code was modified. Figures quoted from the paper are from MergedSentri.pdf, Chapters 1 to 3.*
