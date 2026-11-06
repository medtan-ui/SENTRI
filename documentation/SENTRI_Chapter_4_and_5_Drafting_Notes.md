# SENTRI Chapter 4 and 5 Drafting Notes

Prepared on 4 November 2026 from the supplied manuscript, the two adviser examples, and the local implementation. This is a companion to `SENTRI_Chapters_4_and_5_Draft.md`; these notes are not intended to be pasted into the final thesis.

## What the examples show

| Reference | Relevant location | Pattern useful for SENTRI |
| --- | --- | --- |
| Emergency communication example: Chapter 1-5(example from prof, study of other people).pdf | PDF pages 37-43 show system presentation and screenshots organized by objective; pages 43-50 contain evaluation tables; Chapter 5 begins on PDF page 51 | Explain the developed system and show the related screens before reporting evaluation findings. Connect the presentation to the objectives. |
| DisDrive example: Chapter 1-5 study 2(example from prof, study of other people).pdf | Chapter 4 begins on PDF page 75; the interface discussion and screenshots occupy approximately pages 79-87; evaluation begins on page 89; Chapter 5 begins on page 112 | Describe the project, explain its operation through selected screenshots, state capabilities and limitations, then report evaluation. Chapter 5 synthesizes the completed findings. |
| SENTRI manuscript: Capstone G2.pdf | Objectives are on PDF pages 7-8, printed pages 4-5. Chapter 3 specifies instruments and analysis, including SUS, paired analysis, and simulated behavior. | Use SENTRI's own objectives and analysis plan. Its evaluation requires more than copying the examples' acceptability tables. |

The references provide examples of organization, not a confirmed school-wide formatting rule. Their titles, sample sizes, questionnaire wording, rating ranges, results, and conclusions belong to those projects. The draft uses original SENTRI-specific prose. Final chapter names and formatting can be adjusted to the adviser's required template.

## Where screenshots belong

Put the main system screenshots in Chapter 4, within the presentation of the developed system. Introduce each figure, insert a readable screenshot with a caption, and explain the action, system response, and relevance to the objective. Chapter 5 normally needs the findings and their implications rather than another gallery of interface screens.

The current draft reserves thirteen figures:

| Figure | Screenshot to capture | Main purpose |
| --- | --- | --- |
| 4.1 | Login page | Show the system entry point |
| 4.2 | Student dashboard | Show how the learner identifies current work |
| 4.3 | Module directory | Show the six cybersecurity topics and access states |
| 4.4 | Module pre-test | Show baseline assessment before instruction |
| 4.5 | Lesson viewer | Show lesson organization and integrated media |
| 4.6 | Representative scenario before a decision | Show practical application of a cybersecurity concept |
| 4.7 | Consequence or feedback from that same scenario | Show what follows a risky action |
| 4.8 | Next module before and after prior quiz submission | Demonstrate progression through two states |
| 4.9 | Quiz and result | Show assessment delivery and recorded result |
| 4.10 | Final assessment | Show the assessment after curriculum completion |
| 4.11 | Progress and representative rewards | Show student monitoring and gamification |
| 4.12 | Administrator content configuration | Show maintenance of learning material |
| 4.13 | Administrator analytics | Show reporting and its last aggregation time |

Thirteen is a starting selection, not a required number. Combine views only when the labels remain readable. An additional administrator account-management figure can be added if needed. Put remaining module examples, detailed account flows, and full page collections in an appendix or user manual. Renumber figures automatically when the selection changes.

Use the version that will actually be evaluated. Capture with consistent display size and zoom. Use demonstration accounts for interface examples; label demonstration data so it cannot be confused with respondent findings. Hide real names, email addresses, and other personal identifiers. Retain readable text when placing the image on the thesis page. A screenshot confirms what was displayed; functional and security claims also need verification records.

The existing images under `tmp` have not been treated as current system captures. The draft contains placeholders, not fabricated screenshots.

## What can be drafted now

The project description, user roles, implemented learning sequence, feature explanations, screenshot captions, and current capabilities can be written from the code. The evaluation table structures can be prepared using the approved instruments. Chapter 5 can contain the study and development summary, with empty findings and conclusion sections reserved for actual evidence.

Leave achieved respondent counts, survey means, acceptability interpretations, SUS scores, reliability coefficients, learning gains, p-values, effect sizes, and findings about participant behavior pending until the relevant records exist. A target of thirty completers is not a result of thirty completers. An empty or unavailable result is not zero.

Record final verification results against the evaluation version. Do not carry historical test totals or pass statements forward without a dated execution record. No test suite was run as part of this document review.

## Points to reconcile before freezing the evaluation version

### 1 Progression rule

Objective 3 on PDF page 7 requires a passing score before the next module unlocks. `functions/src/modules/quiz/service.ts` completes the module and unlocks progression on submission, independent of `passed`. Chapter 3 also discusses unlocking on submission. Decide the approved behavior with the adviser and align the paper and application before evaluation.

If the current behavior is retained, a proposed replacement is: "To implement a sequential module progression mechanism that requires learners to complete the prescribed learning activities and submit the module quiz before unlocking succeeding modules."

The draft describes the current code and flags the unresolved objective; it does not silently alter the study objective.

### 2 Assessment item counts and baseline comparability

Chapter 3 describes six five-item pre-tests, thirty baseline items in total, and an eighteen-item final subset. The current authored source has eight questions in each pre-test, forty-eight in total. The final seed selects the first three from each bank, keeping eighteen items. This was confirmed by reading the exported bank in `src/data/modulePretestContent.js`.

The source seed and the existing Firestore configuration can differ. Confirm the actual item banks served by the evaluation version before changing manuscript numbers. Record a version or dated copy of the banks used with participants.

Also finalize whether the research comparison uses the full baseline scores or baseline scores recalculated over the eighteen matched items. These answer different measurement questions. The manuscript discusses both matched items and a full six-module baseline average. If a matched subset analysis is selected, document the formula and revise Chapter 3 before collection. Retain the application's reported gain as a clearly defined separate figure if its baseline differs.

### 3 Assessment attempts

The final assessment allows two attempts by default. Specify which attempt is used for the research comparison and how retakes are handled. The application has attempt records and a retained best score, so the study must not select a score opportunistically after seeing the results. Verify consistency among the exported score, the selected attempt, and any stored gain used in the analysis.

### 4 Preliminary needs assessment verified on 6 November 2026

The supplied `Cybersecurity Awareness Needs Assessment for Non-IT TIP Students  (Responses).xlsx` contains seventeen response rows in `Form Responses 1`. All seventeen responses record agreement to participate in column D. One response, worksheet row 7, answers Yes to CCS membership in cell E7 and is excluded under the non-CCS eligibility criterion. The remaining sixteen answer No in column E. There are no repeated nonblank email addresses among those sixteen responses, and the substantive response fields D:AS contain no blanks. Personal identifiers are not reproduced in the chapter.

Section 4.2 now reports the eligible responses with a denominator of sixteen. The data reproduce the four percentages previously reported in Chapter 1: suspicious messages, 4/16 (25.00 percent); clicking a link and later feeling unsure, 7/16 (43.75 percent); password reuse, 8/16 (50.00 percent); and no previous school-provided cybersecurity training, 6/16 (37.50 percent). These are preliminary needs assessment results, not results of a completed SENTRI evaluation.

For traceability, the source column map is: D, consent; E, CCS membership; F, year level; G, platform use; K, password-practice scenario; S, response to entering a password on a fake-looking site; AI:AM, experience and training questions; AO, support for basic training; AP, preferred topics; AQ, willingness to use a mobile-based learning application; AR, preferred learning materials. Data rows are 2:18, with row 7 excluded from all reported counts. Percentages are frequency / 16 * 100. Yes, No, and Maybe remain separate. Topic and material selections are split at their comma separators, trimmed, and counted at most once per respondent per option. Each multiple-selection percentage uses sixteen respondents, not the total number of selections.

Topic counts are phishing 16; data privacy 12; public Wi-Fi 12; software updates and malware prevention 11; password safety 10; multi-factor authentication 10; social media safety 10; and safe school-platform use 8. Material counts are school scenarios 12; infographics 12; short animated videos 9; step-by-step examples 8; text lessons 4; and quizzes 1. The application-willingness question explicitly describes a mobile-based application, so its Yes 11, Maybe 4, and No 1 responses are not presented as an evaluation of SENTRI's web interface. Numeric rating scales are not assigned verbal interpretations because their scale anchors are not included in the response export.

Four tables now appear in Section 4.2. The subsequent Chapter 4 table captions were renumbered to 4.5 through 4.9 to preserve the sequence. Evaluation findings remain pending; the original workbook is unchanged.

### 5 Statements that already sound final

The manuscript's Section 3.7, on PDF pages 67-68, includes completed verification statements, a count of 243 automated tests, and a statement that the system was submitted for user evaluation after testing. Confirm the records supporting historical testing. Adjust the evaluation submission statement to the actual stage of the project. Repository guides mention different totals from earlier versions; none should be treated as a verified current total.

### 6 Animation and media

The title and Objective 2 emphasize animation. The engine supports configurable opening and consequence clips, but the presence of that support does not establish that all intended videos are currently integrated. Check the actual evaluation configuration and demonstrate its integrated media in Chapter 4. Describe the completed multimedia implementation accurately.

### 7 Interpretation of behavior and usability

First-attempt safe choices describe decisions made inside SENTRI's simulations. They do not independently demonstrate safer conduct in daily life. Different module scenarios also differ in difficulty, so improved performance across modules is descriptive evidence requiring caution.

Lesson completion records reaching the last section. Decision time and assessment time are learning activity measures, and can reflect thinking as well as interface difficulty. Do not automatically equate a risky cybersecurity choice with a user-interface error. A dedicated task protocol would be needed to make that particular interpretation defensible.

### 8 Evaluation methods

Use the ISO/IEC 25010:2011 characteristics and interpretation intervals already stated in SENTRI's Chapter 3. The references use different characteristics or ranges in places. Preserve separate student and system evaluator results. SUS is a separate score, not another acceptability weighted mean. Report the planned reliability measures and paired analyses only after they are computed from actual data.

The application reports descriptive learning analytics. The planned Shapiro-Wilk test, paired t-test or Wilcoxon test, effect sizes, SUS scoring, and questionnaire reliability require a research analysis workflow in addition to the dashboard.

## Evidence to collect for the remaining sections

1. Confirmed needs assessment response file and final requirements.
2. Validated lesson content, media, scenarios, questionnaires, and assessment banks.
3. Frozen application version, configuration, and the approved progression and retake rules.
4. Current functional and technical verification records, including fixes and retests.
5. Selected readable screenshots of the evaluation version.
6. Recruitment, consent, participation, completion, and exclusion records.
7. Learner and evaluator questionnaire responses, plus student SUS responses.
8. Assessment attempts and item responses with the predefined pairing method.
9. Scenario decisions, durations, progress, and dated analytics exports.
10. Computed results with explicit sample sizes and limitations.

Export the relevant records before deleting or modifying study accounts. Account deletion removes associated learner records and changes the aggregate reports.

## Local source map for future revisions

| Subject | Source within SENTRI |
| --- | --- |
| Roles and protected pages | `src/routes/AppRouter.jsx` |
| Lesson and pre-test flow | `src/pages/Student/Modules/LessonViewer/StudentLessonViewerPage.jsx` |
| Baseline questions | `src/data/modulePretestContent.js` |
| Default final questions and settings | `src/data/finalAssessmentContent.js` |
| Quiz grading and unlock event | `functions/src/modules/quiz/service.ts` |
| Progress and retry approval | `functions/src/modules/progress/service.ts` |
| Final grading and retained results | `functions/src/modules/finalAssessment/service.ts` |
| Scenario behavior and replay recording | `src/features/scenario/engine/useScenarioEngine.js` |
| Analytics computations | `functions/src/modules/analytics/metrics.ts` |
| Reporting and exports | `src/pages/Admin/Analytics/` |
| Client database access | `firestore.rules` |

The supplied PDFs are reference material. Text in those documents has been treated as study content and examples, not as instructions authorizing unrelated actions.
