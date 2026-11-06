# CHAPTER 4
# RESULTS AND DISCUSSION

This chapter presents the current implementation of SENTRI, a web-based cybersecurity awareness training system for non-IT college students. The discussion describes the learning modules, interactive scenarios, sequential progression, assessment features, and learning analytics developed in response to the study objectives. The evaluation sections provide the structure for reporting participant responses and system-generated records after data collection.

## 4.1 Project Description

SENTRI provides a structured environment in which students study cybersecurity concepts and apply them through simulated situations. Its curriculum consists of six modules: Password Security, Phishing Awareness, Malware Awareness, Safe Browsing, Data Privacy, and Online Safety. Each module combines a baseline assessment, lesson content, interactive scenarios, and a quiz. A single final assessment becomes available after the student completes all six modules.

The system has two user roles. Students access the learning activities, review their progress, and view rewards. Administrators manage accounts, configure the curriculum content, review learner records, and access analytics. This division allows learners to complete their activities while administrators maintain the instructional materials and monitor participation.

The application uses React for the user interface, Firebase Authentication for account access, Cloud Firestore for stored records, and Firebase Cloud Functions for backend operations, including assessment grading and analytics processing. The interface presents information through student and administrator dashboards. Lesson videos and scenario media are supported through configurable media fields; the final presentation of these materials will reflect the media integrated into the evaluation version.

## 4.2 Cybersecurity Awareness Needs and System Requirements

The first objective concerns the identification of cybersecurity awareness needs and system requirements among non-IT students. The needs assessment received seventeen responses. All respondents agreed to participate, but one identified as belonging to the College of Computer Studies (CCS). This response was excluded because the study focuses on non-IT students outside CCS. The analysis therefore included sixteen respondents who answered that they were not in CCS. All frequencies and percentages in this section refer to these sixteen eligible responses.

### 4.2.1 Respondent Profile and Use of Online Platforms

Seven respondents (43.75 percent) were fourth-year students, four (25.00 percent) were first-year students, three (18.75 percent) were third-year students, and two (12.50 percent) were second-year students. Ten respondents (62.50 percent) used school-related online platforms several times a week, five (31.25 percent) used them daily, and one (6.25 percent) used them once a week. Thus, fifteen respondents (93.75 percent) accessed school email, Canvas, the student portal, or other school-related websites at least several times a week. This pattern supports the use of school-related digital situations as the context for the training activities.

### 4.2.2 Cybersecurity Experiences and Training Needs

Table 4.1 presents the respondents' reported cybersecurity experiences and prior school-provided training. The responses distinguish definite experiences from uncertainty by retaining the questionnaire's separate Yes, No, and Maybe categories.

**Table 4.1. Reported cybersecurity experiences and previous school-provided training**

| Survey item | Yes, frequency | Yes, percent | No, frequency | No, percent | Maybe, frequency | Maybe, percent |
| --- | --- | --- | --- | --- | --- | --- |
| Received a suspicious link, email, or message related to school or online accounts | 4 | 25.00 | 9 | 56.25 | 3 | 18.75 |
| Clicked a link and later felt unsure whether it was safe | 7 | 43.75 | 7 | 43.75 | 2 | 12.50 |
| Reused the same password for multiple accounts | 8 | 50.00 | 6 | 37.50 | 2 | 12.50 |
| Shared a verification code, password, or account detail with someone else | 0 | 0.00 | 14 | 87.50 | 2 | 12.50 |
| Received formal cybersecurity awareness training from school before | 8 | 50.00 | 6 | 37.50 | 2 | 12.50 |

*Source: Cybersecurity Awareness Needs Assessment for Non-IT TIP Students response workbook, Form Responses 1 worksheet; eligible respondents, n = 16. Percentages were computed as frequency divided by 16, multiplied by 100. Item descriptions are shortened for presentation.*

Password reuse was reported by eight respondents (50.00 percent), making password practices a clear area for reinforcement. Seven respondents (43.75 percent) reported clicking a link and subsequently being unsure whether it was safe. Four (25.00 percent) reported receiving suspicious school-related or account-related messages, while three (18.75 percent) were uncertain. These findings support instruction on examining links, verifying messages through official channels, and recognizing suspicious requests. The Maybe responses were not added to the Yes category because they do not confirm that the experience occurred.

Previous school-provided training was reported by eight respondents (50.00 percent), while six (37.50 percent) reported none and two (12.50 percent) were uncertain. Training should therefore accommodate students with different levels of prior exposure. This result concerns training provided by the school; it does not establish whether respondents received cybersecurity instruction from other sources. No respondent explicitly reported sharing verification codes, passwords, or account details, although two were uncertain. That item does not provide evidence that such sharing was common within this group.

The scenario questions also showed existing awareness alongside areas for further instruction. Fourteen respondents (87.50 percent) selected using a different strong password for each important account, while two (12.50 percent) selected using one familiar password across accounts. In the question about entering a school password on a fake-looking website, twelve respondents (75.00 percent) selected changing the password and reporting the incident, while four (25.00 percent) selected closing the website and avoiding it afterward. These selections support reinforcement of password practices and the actions to take after a suspected compromise. They do not, by themselves, establish how respondents would behave during an actual incident.

All sixteen respondents (100.00 percent) believed that non-IT students should receive basic cybersecurity awareness training. This finding indicates support for offering training within the assessed group. It is a needs assessment finding and does not establish the acceptability or effectiveness of the developed SENTRI system.

### 4.2.3 Preferred Cybersecurity Topics

Respondents selected the topics they believed should be included in a cybersecurity awareness module. Table 4.2 presents the frequency and percentage for each topic.

**Table 4.2. Cybersecurity topics selected for inclusion in the learning modules**

| Topic | Frequency | Percent of respondents |
| --- | --- | --- |
| Phishing and suspicious links | 16 | 100.00 |
| Data privacy and personal information protection | 12 | 75.00 |
| Public Wi-Fi safety | 12 | 75.00 |
| Software updates and malware prevention | 11 | 68.75 |
| Password safety | 10 | 62.50 |
| Multi-factor authentication | 10 | 62.50 |
| Social media safety | 10 | 62.50 |
| Safe use of school email and online platforms | 8 | 50.00 |

*Source: Needs assessment response workbook, Form Responses 1 worksheet, topic-selection item; n = 16. Multiple selections were allowed, so percentages do not sum to 100.*

Phishing and suspicious links were selected by every eligible respondent. Data privacy and public Wi-Fi safety followed, each selected by twelve respondents (75.00 percent), while software updates and malware prevention were selected by eleven (68.75 percent). These results support coverage of all six SENTRI topics. Password safety and multi-factor authentication are addressed in Password Security; suspicious messages and links in Phishing Awareness; and software threats in Malware Awareness. Safe Browsing, Data Privacy, and Online Safety address the remaining concerns through website, information-sharing, and social-interaction situations. School email and online platforms provide a relevant setting across these topics.

### 4.2.4 Preferred Learning Materials and Willingness to Use a Learning Application

The learning-material item recorded combinations of preferred formats. Each selected format was counted once per respondent, as shown in Table 4.3.

**Table 4.3. Preferred learning materials for cybersecurity awareness**

| Learning material | Frequency | Percent of respondents |
| --- | --- | --- |
| Real-life school scenarios | 12 | 75.00 |
| Infographics | 12 | 75.00 |
| Short animated videos | 9 | 56.25 |
| Step-by-step examples | 8 | 50.00 |
| Text-based lessons | 4 | 25.00 |
| Quizzes | 1 | 6.25 |

*Source: Needs assessment response workbook, Form Responses 1 worksheet, learning-material item; n = 16. Responses could contain multiple formats, so percentages do not sum to 100.*

Real-life school scenarios and infographics were the most frequently selected formats, each chosen by twelve respondents (75.00 percent). Nine respondents (56.25 percent) selected short animated videos and eight (50.00 percent) selected step-by-step examples. These preferences support the use of school-related situations, visual explanations, short media, and guided examples in the instructional design. Infographics were a requested format; their selection does not establish that a dedicated infographic resource has already been implemented in SENTRI. Text-based lessons and quizzes were selected less often as preferred learning materials. Their lower selection counts do not establish that they lack instructional or assessment value.

When asked whether they would use a mobile-based cybersecurity awareness learning application if required or recommended by the school, eleven respondents (68.75 percent) answered Yes, four (25.00 percent) answered Maybe, and one (6.25 percent) answered No. The results indicate willingness among a majority of the assessed group, with some uncertainty remaining. Because the question specifically referred to a mobile-based application, these responses should not be interpreted as a direct evaluation of SENTRI's web interface or as evidence of actual system use.

### 4.2.5 Implications for the System Requirements

Table 4.4 connects the needs assessment findings to the instructional requirements and the corresponding features of SENTRI. These are design responses to the reported needs; they are not claims that respondents specifically requested every application feature.

**Table 4.4. Relationship between needs assessment findings and system requirements**

| Supporting finding | Requirement identified | Corresponding feature or development implication |
| --- | --- | --- |
| Sixteen respondents (100.00 percent) selected phishing and suspicious links; seven (43.75 percent) had clicked a link and later felt unsure about its safety | Provide practice in examining suspicious messages and verifying links before acting | Phishing Awareness lessons and interactive message and login-page scenarios |
| Eight respondents (50.00 percent) reported password reuse; ten (62.50 percent) selected password safety and ten selected multi-factor authentication | Reinforce unique passwords and account protection | Password Security lessons, scenarios, and assessments |
| Twelve respondents (75.00 percent) selected public Wi-Fi safety; eleven (68.75 percent) selected software updates and malware prevention | Explain risks associated with networks, downloads, and untrusted websites | Safe Browsing and Malware Awareness modules |
| Twelve respondents (75.00 percent) selected data privacy; ten (62.50 percent) selected social media safety | Include protection of personal information and safer online interactions | Data Privacy and Online Safety modules |
| Twelve respondents (75.00 percent) selected school scenarios; nine (56.25 percent) selected short animated videos; eight (50.00 percent) selected step-by-step examples | Present concepts through contextual situations, concise media, and guided explanations | School-related simulations, lesson media support, and consequence feedback; integrate the final validated media before evaluation |
| Twelve respondents (75.00 percent) selected infographics | Include clear visual explanations of cybersecurity concepts | Consider dedicated infographic materials during content refinement and validation |
| Six respondents (37.50 percent) reported no previous school-provided training, while eight (50.00 percent) reported previous training | Provide a structured introduction that accommodates differing prior exposure | Module pre-tests, foundational lessons, and a defined learning sequence |

The needs assessment supports the selection of cybersecurity topics and the use of contextual and visual instructional materials. Sequential progression and administrator analytics are additional design mechanisms for organizing the curriculum and monitoring activity; the questionnaire did not directly measure demand for these features. Their operation will be addressed through system verification and subsequent evaluation. The findings in this section describe the sixteen eligible respondents and should not be generalized to all non-IT students at the institution.

## 4.3 Presentation of the Developed System

### 4.3.1 Account Access and Student Dashboard

SENTRI supports student registration and accounts created by an administrator. Authentication identifies the signed-in user, while the stored user role determines access to the corresponding dashboard. Email verification is required before protected pages are available. Accounts that use an administrator-provided temporary password must also complete the password change process.

[INSERT SCREENSHOT FOR FIGURE 4.1: Login page. Use a demonstration account and keep passwords and personal information out of the capture.]

**Figure 4.1. SENTRI login page**

Figure 4.1 presents the entry point to the system. The page allows users to sign in and provides access to account registration and password recovery. After authentication and the required account checks, the system opens the dashboard associated with the user's role.

[INSERT SCREENSHOT FOR FIGURE 4.2: Student dashboard with readable module and progress information.]

**Figure 4.2. Student dashboard**

Figure 4.2 presents the student's main learning interface. The dashboard brings together module access, progress information, and rewards so that the learner can identify the next available activity and review completed work. Any values shown using a demonstration account illustrate the interface and are not participant evaluation results.

### 4.3.2 Cybersecurity Modules and Lesson Content

The second objective concerns the development of interactive cybersecurity modules with realistic situations, decision points, and consequence-based feedback. The curriculum applies these features across the six cybersecurity topics. Lesson content includes learning objectives, explanatory sections, best practices, key takeaways, and references. A tutorial introduces the interaction pattern used in the learning activities.

[INSERT SCREENSHOT FOR FIGURE 4.3: Module directory showing the six topics and their current access states.]

**Figure 4.3. Cybersecurity module directory**

Figure 4.3 presents the modules available within the curriculum. Each module introduces a specific area of cybersecurity awareness. The displayed access state informs the student whether the module is available, completed, or restricted by the configured learning sequence.

[INSERT SCREENSHOT FOR FIGURE 4.4: One module's pre-test interface.]

**Figure 4.4. Module pre-test interface**

Figure 4.4 presents the baseline assessment administered before the corresponding lesson. The student submits the pre-test once, and the system records the responses and score. The baseline is used for subsequent learning analysis and does not require a passing score before the lesson can be studied. The number of questions must be described using the final validated item bank used during evaluation.

[INSERT SCREENSHOT FOR FIGURE 4.5: Lesson viewer with objectives, a lesson section, and navigation visible. Include the integrated media area if it is populated in the evaluation version.]

**Figure 4.5. Cybersecurity lesson viewer**

Figure 4.5 presents the instructional content provided before the simulation. The student navigates through the lesson sections and reviews the supporting practices and takeaways. The current implementation records lesson completion when the student reaches the final section. This completion state makes the simulation available; it should be interpreted as a navigation record rather than proof that every passage was read or understood.

### 4.3.3 Interactive Scenarios and Consequence Feedback

The simulations present cybersecurity decisions within interfaces resembling familiar digital environments, including messages, websites, account screens, and social interactions. The learner selects an action within the scene. The scenario engine processes that action and displays feedback associated with the selected choice. Risky choices may lead to an illustrated or video consequence before the learner retries the decision.

[INSERT SCREENSHOT FOR FIGURE 4.6: A representative simulation immediately before a decision. Select a scene that clearly shows the school-related context.]

**Figure 4.6. Interactive cybersecurity decision scenario**

Figure 4.6 illustrates how a cybersecurity concept is presented as a practical decision. The learner examines the available information and selects an action within the simulated environment. This interaction connects the lesson content with a situation that requires the learner to apply it.

[INSERT SCREENSHOT FOR FIGURE 4.7: Feedback or consequence resulting from a risky choice in the same scenario.]

**Figure 4.7. Consequence feedback following a risky decision**

Figure 4.7 presents the explanation shown after a risky action. The feedback describes the consequence of the choice and guides the learner toward a safer response. The first recorded run retains decision attempts, allowing the analytics to distinguish an initially safe decision from a safe choice reached after corrective feedback. Completed simulations can be replayed as practice without adding decision records to the initial-run behavioral data.

The system supports opening media and consequence media within the scenario flow. The screenshots and accompanying descriptions must show the animation and video assets actually integrated into the evaluation build. Additional examples from the remaining modules may be placed in an appendix to avoid repeating similar interfaces throughout this chapter.

### 4.3.4 Sequential Progression and Module Quizzes

The third objective concerns the control of module progression. The implementation uses stored module order and completion records to guide students through the curriculum. Within a module, the learning flow consists of the pre-test, lesson, simulation, and quiz. Access checks guide the student toward the activity required at the current stage.

[INSERT SCREENSHOT FOR FIGURE 4.8: Two panels showing the next module before and after the preceding module quiz is submitted.]

**Figure 4.8. Module access before and after completion of the preceding module**

Figure 4.8 illustrates the change in module access after the required completion event. In the current implementation, submitting the module quiz marks the module complete and unlocks the next module regardless of the score obtained. The quiz score and pass or fail result remain available as performance records. This description requires reconciliation with Objective 3 in Chapter 1, which currently refers to a required passing score.

[INSERT SCREENSHOT FOR FIGURE 4.9: Module quiz and its result view, presented as two readable panels if needed.]

**Figure 4.9. Module quiz and result interface**

Figure 4.9 presents the knowledge check administered after the simulation. The browser submits selected answers to a Cloud Function, which grades the submission against the stored configuration and records the attempt. A module quiz normally permits one attempt. An administrator may grant an additional attempt through a documented retry process. The interface screenshot illustrates assessment delivery; it does not establish the accuracy of grading without a corresponding verification record.

### 4.3.5 Final Assessment and Student Progress

The final assessment covers the curriculum after all six modules have been completed. The authored default contains eighteen questions, with three taken from each module's pre-test bank. Its default passing score is 75 percent, with two attempts allowed. These settings must be checked against the assessment configuration frozen for participant use.

[INSERT SCREENSHOT FOR FIGURE 4.10: Final assessment interface or its availability state after all modules are completed.]

**Figure 4.10. End-of-curriculum final assessment**

Figure 4.10 presents the assessment used at the end of the training sequence. Responses are graded through the backend and recorded for learning analysis. Because the final assessment uses a subset of the baseline item banks, the comparison must disclose the actual item counts and the method used to construct the paired scores.

[INSERT SCREENSHOT FOR FIGURE 4.11: Student progress page and a representative rewards display.]

**Figure 4.11. Student progress and rewards**

Figure 4.11 presents the records available to students for reviewing their learning activities. The system also provides points, ranks, badges, daily streaks, and a leaderboard. These features display participation and achievement within the application. Their effect on motivation or continued engagement remains a matter for evaluation.

### 4.3.6 Administration and Learning Analytics

The fourth objective concerns the integration of learner activity records and analytics. Administrators can review accounts and student records, configure the instructional content, manage quiz and final assessment settings, and view learning summaries. Administrative content editing works within the six predefined module topics.

[INSERT SCREENSHOT FOR FIGURE 4.12: Administrator module configuration page with a representative lesson, scenario, or quiz editor.]

**Figure 4.12. Administrator content configuration**

Figure 4.12 presents the interface used to maintain module content and settings. This provides a way to revise instructional material through the application. The lesson, scenario, quiz, and final assessment configurations used during evaluation must be recorded so that later changes do not obscure what participants experienced.

[INSERT SCREENSHOT FOR FIGURE 4.13: Administrator analytics page with readable labels and its last aggregation time. Use demonstration data only if explicitly labeled.]

**Figure 4.13. Administrator learning analytics**

Figure 4.13 presents summaries of learner progress, assessment performance, and simulation decisions. The reporting features include completion measures, score summaries, normalized learning gain, topic mastery, item analysis, and behavioral measures. Aggregated reports are refreshed on demand and through a nightly scheduled process. Although activity is captured during learning sessions, the displayed cohort summaries reflect their most recent aggregation.

The administrator can export report data for subsequent analysis. Screenshots explain how reporting is presented; the numerical findings must be derived from the actual evaluation records and exported tables.

## 4.4 System Testing and Verification

The repository contains frontend tests, backend unit tests, and integration tests for selected workflows and database access rules. These provide a basis for verifying assessment logic, progression, account operations, and analytics computations. The results reported in this section must correspond to the same application version used for participant evaluation.

[PENDING VERIFICATION: Insert the evaluation build identifier, date, test environment, actual commands or procedures, executed test totals, results, defects, and retest evidence. The presence of test files and historical counts does not establish that the current version has passed.]

**Table 4.5. Functional verification record**

| Function or workflow | Expected behavior to verify | Observed result and evidence | Status |
| --- | --- | --- | --- |
| Account access | Apply authentication, email verification, role access, and required password change | Pending execution record | Pending |
| Module pre-test | Record one baseline submission before the lesson | Pending execution record | Pending |
| Lesson and simulation access | Apply the intended activity sequence | Pending execution record | Pending |
| Scenario decisions | Record first-run attempts and exclude completed-run practice replays | Pending execution record | Pending |
| Quiz grading and progression | Grade submitted answers and apply the approved unlock rule | Pending execution record | Pending |
| Quiz retry | Require authorized approval and retain the retry reason | Pending execution record | Pending |
| Final assessment | Require completion of all modules and enforce the configured attempt allowance | Pending execution record | Pending |
| Access rules | Apply the permitted reads and writes for each role and collection | Pending execution record | Pending |
| Reports and exports | Reconcile displayed values and exports with their source records | Pending execution record | Pending |

The final discussion should identify defects found, describe the corrections, and report the results of verification after each relevant correction. A feature screenshot alone should not be used as evidence that all associated workflow or security conditions passed.

## 4.5 Evaluation Results

### 4.5.1 Participation and Data Included in the Analysis

[PENDING DATA COLLECTION: Report actual recruitment, participation, curriculum completion, completed evaluation forms, exclusions, and missing data. The target numbers in Chapter 3 are recruitment plans and must not be reported as achieved sample sizes.]

**Table 4.6. Participant records included in each analysis**

| Record or analysis group | Actual number | Basis for inclusion or exclusion |
| --- | --- | --- |
| Students recruited | Pending | Recruitment record |
| Students who started the curriculum | Pending | Defined start event |
| Students with usable paired baseline and final results | Pending | Completed measurements and stated pairing rule |
| Students with valid acceptability forms | Pending | Completed learner evaluation instrument |
| Students with valid SUS forms | Pending | Completed SUS instrument and scoring rules |
| System evaluators with valid forms | Pending | Evaluator eligibility and completed instrument |
| Incomplete or excluded records | Pending | Report reasons for each analysis separately |

### 4.5.2 System Acceptability

[PENDING SURVEY: Present learner and system evaluator results separately using the five characteristics stated in Chapter 3. Add item-level tables from the approved questionnaires before the summary table.]

**Table 4.7. Summary of system acceptability by respondent group**

| Characteristic | Learner weighted mean | Learner interpretation | Evaluator weighted mean | Evaluator interpretation |
| --- | --- | --- | --- | --- |
| Functionality | Pending | Pending | Pending | Pending |
| Usability | Pending | Pending | Pending | Pending |
| Reliability | Pending | Pending | Pending | Pending |
| Performance efficiency | Pending | Pending | Pending | Pending |
| Security | Pending | Pending | Pending | Pending |

After collection, discuss the highest and lowest rated indicators and relate them to the features evaluated. Apply the interpretation intervals already specified in Chapter 3. Report questionnaire reliability using the collected item responses and the approved analysis plan. User ratings of security describe perceived acceptability and should be discussed alongside technical verification evidence.

### 4.5.3 System Usability Scale Results

[PENDING SUS RESPONSES: Insert the number of valid student forms, mean SUS score, standard deviation, and interpretation using the reference adopted in Chapter 3. Include instrument reliability as planned. A SUS score is a score from 0 to 100 and must not be presented as a percentage of respondents or as a percentage of tasks completed.]

### 4.5.4 Baseline and Final Assessment Results

[PENDING ASSESSMENT RECORDS: Report the actual paired sample size, baseline and final means, standard deviations, score construction, and missing-data handling. Disclose the baseline bank size and the eighteen-item final subset.]

**Table 4.8. Paired learning outcome measures**

| Measure | Result | Information required for interpretation |
| --- | --- | --- |
| Respondents with paired scores | Pending | Number meeting the stated inclusion rule |
| Baseline mean and standard deviation | Pending | Baseline items and score construction |
| Final assessment mean and standard deviation | Pending | Final items and selected attempt |
| Mean change in percentage points | Pending | Final score minus baseline score |
| Relative percentage improvement | Pending | Apply Chapter 3 formula; disclose an undefined result if baseline is zero |
| Shapiro-Wilk result for paired differences | Pending | Statistic, p-value, and decision under the stated analysis plan |
| Paired comparison | Pending | Selected test, statistic, degrees of freedom if applicable, and p-value |
| Effect size | Pending | Stated definition and computation appropriate to the selected test |
| Mean individual normalized gain | Pending | Number with measurable gain; exclude a 100 percent baseline from this formula |

Interpret the observed differences within the one-group design described in Chapter 3. The analysis can describe change among participating learners. Attribution of that change solely to SENTRI is limited by the absence of a control group. Any inferential results must be computed from the evaluation data; they are not produced merely by displaying the application's analytics dashboard.

### 4.5.5 Scenario Behavior and Learning Analytics

[PENDING ACTIVITY RECORDS: Insert completion rates, first-attempt safe rates, consequence trigger rates, decision times, topic mastery, and supported item analysis. Identify the records included in each denominator and the aggregation date.]

**Table 4.9. Module completion and simulation behavior**

| Module | Students who started | Students who completed | Completion rate | First-attempt safe rate | Median decision time |
| --- | --- | --- | --- | --- | --- |
| Password Security | Pending | Pending | Pending | Pending | Pending |
| Phishing Awareness | Pending | Pending | Pending | Pending | Pending |
| Malware Awareness | Pending | Pending | Pending | Pending | Pending |
| Safe Browsing | Pending | Pending | Pending | Pending | Pending |
| Data Privacy | Pending | Pending | Pending | Pending | Pending |
| Online Safety | Pending | Pending | Pending | Pending | Pending |

Decision behavior observed inside the simulations describes performance in those activities. It does not independently establish changes in everyday cybersecurity behavior outside the system. Differences across modules also require caution because the scenarios involve different topics and decision demands. Item discrimination should remain unreported when the system's minimum number of whole attempts is not met.

### 4.5.6 Discussion in Relation to the Objectives

[COMPLETE AFTER RESULTS ARE AVAILABLE: Discuss each objective in order. For Objective 1, use the verified needs assessment and requirements. For Objective 2, use the implemented modules, integrated media, content validation, and scenario evidence. For Objective 3, use the approved progression rule and its verification. For Objective 4, use captured records and reconciled reports. For Objective 5, use the learner and evaluator ratings. Relate learning outcomes and SUS results to the methodology without presenting them as substitutes for the acceptability instrument.]

## 4.6 Capabilities and Limitations

The current implementation provides a six-module curriculum, baseline assessments, lessons, interactive simulations, module quizzes, a final assessment, progress monitoring, administrator content configuration, analytics, and gamification. Its scope centers on awareness training within a web application.

The interpretation of the system's results is bounded by the learning environment and evaluation design. Recorded lesson completion reflects reaching the final lesson section. Simulation decisions occur in authored situations. The final assessment uses a subset of the baseline banks, and the cohort summaries depend on the records included at the time of aggregation. Full online operation depends on access to the relevant services and media.

[UPDATE AFTER EVALUATION: Add verified device or browser limitations, unresolved defects, content limitations, missing data, and evaluation constraints that materially affected participants. Keep technical limitations distinct from limitations of the research design.]

# CHAPTER 5
# SUMMARY CONCLUSIONS AND RECOMMENDATIONS

This chapter summarizes the development of SENTRI and provides the structure for conclusions and recommendations arising from the completed study. Findings that depend on participant evaluation will be completed after the assessment, survey, and activity records have been analyzed.

## 5.1 Summary

The study concerns the design, development, and evaluation of a web-based cybersecurity awareness training system for non-IT college students of the Technological Institute of the Philippines, Manila. SENTRI brings together lessons, interactive decision scenarios, consequence feedback, assessments, sequential progression, and learning analytics within one application.

The system contains six cybersecurity modules covering password security, phishing awareness, malware awareness, safe browsing, data privacy, and online safety. Each module includes a baseline assessment before the lesson, followed by simulation activities and a module quiz. A final assessment is provided after completion of the curriculum. Students can review progress and rewards, while administrators manage content and accounts and review learner records.

The methodology combines system development with a one-group comparison of baseline and final assessment performance and a descriptive evaluation of system acceptability. The planned evaluation uses learner and system evaluator forms based on selected ISO/IEC 25010:2011 characteristics, a separate SUS instrument for students, and activity records generated during system use.

[PENDING COMPLETION: Add the actual study dates, evaluation build, achieved sample sizes, validated instrument details, procedures completed, and the principal numerical findings. Revise the account of the procedures into completed tense only after they have occurred.]

### 5.1.1 Summary of Findings by Objective

1. **Cybersecurity needs and requirements.** [Insert verified needs assessment findings and explain which requirements they supported. Do not reuse the reported preliminary figures until the underlying records have been confirmed.]
2. **Interactive cybersecurity modules.** The current system implements six topic modules with lesson content, simulated decisions, and feedback. [Add the validated media coverage, content review results, and relevant verification evidence from Chapter 4.]
3. **Sequential module progression.** The current implementation records activity completion and unlocks the next module on quiz submission. [Report the final approved rule and verification results, after reconciling Objective 3 with the implementation.]
4. **In-session learning analytics.** The system includes records and reports for progress, assessments, and simulation decisions. [Insert the observed reporting results, record completeness, and verification of exported values.]
5. **System acceptability.** [Insert actual learner and evaluator means and interpretations for each characteristic, including the valid number of responses in each group.]

[ADDITIONAL FINDINGS FROM THE METHODOLOGY: Summarize SUS, paired assessment results, normalized gain, item analysis, and simulation behavior with their actual denominators and limitations. Use the same values and definitions as Chapter 4.]

## 5.2 Conclusions

[PENDING CHAPTER 4 FINDINGS: Final conclusions cannot yet be written about acceptability, usability, learning improvement, or the achievement of all objectives. Complete the statements below using the evidence reported in Chapter 4.]

1. [Conclude what the verified needs assessment established about the participating students and the resulting requirements.]
2. [Conclude whether the developed modules and integrated media met the approved development requirements, citing the relevant verification and content validation findings.]
3. [Conclude whether the approved progression mechanism operated as intended, citing the functional evidence.]
4. [Conclude whether the system captured and presented the intended analytics, identifying any gaps that affected interpretation.]
5. [Conclude the level of acceptability supported by the learner and evaluator responses, retaining differences between the two groups.]
6. [State what the assessment comparison and simulation records support about the participating learners. Keep any conclusion within the one-group design and the simulated setting.]

## 5.3 Recommendations

[PENDING FINAL FINDINGS: Recommendations will be finalized from the lowest rated indicators, verified limitations, assessment findings, and unresolved problems reported in Chapter 4. The items below are provisional directions for review.]

The instructional content and assessment banks should be reviewed against the final learning objectives before participant evaluation. Keeping a record of the questions, scenario configurations, media, and settings used during the study will support interpretation of the resulting scores and decisions.

Improvements to the interface should be selected from observed task difficulties and participant feedback. The final recommendations should identify the affected feature, describe the evidence of the difficulty, and specify a practical change. Broad claims that the interface needs improvement should be replaced by the particular issues identified during evaluation.

Future evaluation may examine retention after a longer interval and cybersecurity decisions beyond the authored simulations. Research involving a comparison group or participants from additional institutions may address questions that the present one-group study cannot resolve. These extensions should be presented as future research directions rather than achievements of the current study.

[ADD AFTER ANALYSIS: Specific recommendations for instructional revisions, system refinement, implementation conditions, and future research. Each should be traceable to a reported finding or a stated limitation.]
