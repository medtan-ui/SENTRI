# SENTRI: Figure Descriptions, Copy-Ready

*Assembled 2026-08-20 against commit `09ce937` and the four redrawn diagrams. Your submitted descriptions with every correction applied. Paste these in whole; the change log at the end records what moved and why.*

**Before you paste, two decisions:**

1. **The name.** These use `SENTRI: Web-Based Cybersecurity Awareness Training System`. Your prose previously said "Learning Management System" while your figure titles said "Training System". Pick one for the whole manuscript. Training System is the safer claim, since the system has no enrollment, gradebook, or course creation. Also fix `Awarenes` to `Awareness` in all four figure titles.
2. **One conditional sentence**, flagged inline below: the Modules prerequisite self-relationship. Keep it only if you actually drew the self-loop.

---

## Figure 3.12: Entity Relationship Diagram

> Figure 3.12 depicts the entity relationships of the proposed SENTRI: Web-Based Cybersecurity Awareness Training System. Because the system is built on Cloud Firestore, a document-oriented database, the diagram represents each collection as an entity and represents data that is physically nested within a single document, such as a quiz's questions and choices, as embedded attributes of the entity that owns them rather than as separate related entities. The main entities include Users, Modules, Module Lessons, Module Scenarios, Module Quizzes, Module Pre-Tests, Module Assignments, Module Progress, Scenario Decision Records, Quiz Attempts, Quiz Responses, Final Assessment, Final Assessment Progress, Learning Analytics, Student Analytics, Module Analytics, Cohort Analytics, Gamification, Analytics Events, and Audit Logs.
>
> The decision to embed rather than separate followed a consistent rule. Data that is only ever created, read, and updated together with its parent is embedded, because separating it would require additional document reads for information that is never needed on its own. Data that must be queried or aggregated across many parent records, or that is written by a different actor at a different time, is stored as its own collection instead. The scenario choices and the Scenario Decision Records illustrate both sides of this rule: an administrator authors the choices once as part of the scenario that owns them, while many different students independently write decisions against that same scenario over time, and item-level analysis must query those decisions across students.
>
> The Users entity stores student and admin account information, including role, display name, nickname, email, and account status; a user's role determines whether student-side or admin-side features are accessible. The Modules entity represents the six fixed cybersecurity awareness learning units and is related, one to one, to each module's own lesson content, scenario content, quiz, pre-test, assignment configuration, and analytics summary, and, one to many, to every student's progress record for that module. **[Keep the next sentence only if you drew the self-loop:]** The Modules entity also holds a recursive relationship with itself through its prerequisite attribute, which expresses the curriculum ordering that determines which module unlocks next.
>
> The Module Lessons entity stores each module's instructional content, including its video reference and lesson sections. The Module Scenarios entity stores a module's interactive scenario activities together with each scenario's set of choices, embedded as nested attributes rather than as separate tables, since each choice exists only in the context of its parent scenario. The Scenario Decision Records entity stores the decisions students make while working through these scenarios, recording the user, module, scenario, selected choice, whether the choice was safe, the attempt number, the time taken to decide, and whether feedback was viewed, which supports the system's in-session behavioural analytics.
>
> The Module Quizzes and Module Pre-Tests entities support the module-level assessment features, each storing its own set of questions and answer choices as embedded attributes. The Module Progress entity tracks a student's progress through a given module, including lesson, simulation, and quiz completion, whether the simulation was completed without any risky choice, unlock status, pre-test completion, and quiz retry allowance, and is what allows the system to enforce sequential module progression. Once a student has completed all six modules, the Final Assessment entity, a single system-wide configuration, and the Final Assessment Progress entity, one record per student, together support the end-of-curriculum measurement that replaces a per-module post-test, computing each student's score against the average of their six pre-test results.
>
> The Quiz Attempts and Quiz Responses entities record, respectively, a student's whole-attempt result on a module quiz and the individual per-question responses across pre-tests, quizzes, and the final assessment, which supports item-level analysis. The Analytics Events entity records discrete learner activities such as lesson, module, and assessment completions, together with the time taken to perform them, which supports the activity trend and time-on-task measures. The Learning Analytics, Student Analytics, Module Analytics, and Cohort Analytics entities summarize learner performance at increasing levels of aggregation, from a single student-module pairing up to the entire cohort, including quiz scores, learning gain, behavioural metrics, and completion trends. The Gamification entity tracks each student's points, rank, badges, and activity streak, and the Audit Logs entity records administrative actions performed on user accounts.
>
> Through these relationships, the system can manage user access, organize cybersecurity learning modules, store scenario decisions, record quiz and assessment performance, track module progress, enforce sequential module progression, measure overall learning gain through the final assessment, and generate learning analytics for administrator monitoring.

---

## Figure 3.11: Activity Diagram

> Figure 3.11 depicts the sequence of activities involved in the SENTRI: Web-Based Cybersecurity Awareness Training System. It shows the flow of activities among the Student, System, and Admin. The process begins when the Student opens the website and checks whether an account already exists. If the Student does not have an account, the Student registers first; otherwise the Student logs in. After login, the System requires the account's email to be verified and, if the account is still on an admin-assigned temporary password, requires that password to be changed before proceeding. The System then checks the user role and redirects the user either to the Student Dashboard or the Admin Dashboard.
>
> For the Student side, the user can view the available cybersecurity modules and open a module. If that module's pre-test has not yet been completed, the Student takes it first; the Student then reads the lesson content, after which the System marks the lesson as completed. The Student proceeds to the scenario-based simulation. Before the simulation begins, the System checks whether this module's simulation has already been completed. A first run is recorded normally; a replay is treated as practice, and no decision is recorded during it, so that the behavioural measures continue to reflect the Student's first genuine attempt. During a first run, the Student views each scenario scene and makes a decision, which the System records together with the attempt number and the time taken to decide. The Student views the resulting feedback, and this repeats until every scenario in the module has been completed, at which point the System marks the simulation as complete and records whether the run was completed without any risky choice. The Student then takes the module's quiz assessment; the System grades it and updates the module's progress record, marking the module complete and unlocking the next module regardless of the score obtained. Following each progress update, the System recomputes the Student's points, rank, badges, and streak from the stored progress record. If modules remain, the Student returns to the module list to continue; once all six modules are complete, the Student takes the single end-of-curriculum final assessment, which the System grades and uses to compute the average of the Student's six pre-test scores together with the overall normalized learning gain. Both values are stored at the moment of submission, so that a later change to the item bank cannot retroactively alter a result that has already been reported. The Student may then view progress and log out of the system.
>
> For the Admin side, the Admin can open the Admin Dashboard, create and manage student and admin accounts, manage modules and content, view learner analytics, monitor student progress, quiz scores, and completion status, grant an additional quiz attempt to a student on appeal, and identify learners who may need additional support, before logging out. The diagram separates user actions from automated system actions, such as checking user roles and password status, recording scenario decisions on a first run, grading quiz and assessment submissions, updating module completion and unlock status, recomputing points, rank, badges, and streak, and computing learning gain.

---

## Figure 3.3: System Architecture

> Figure 3.3 illustrates the System Architecture of the SENTRI: Web-Based Cybersecurity Awareness Training System, which uses a three-tier architecture consisting of a Presentation Tier, an Application Tier, and a Data Tier. The system is accessed by two primary users, the Student and the Admin, through a web browser. The Presentation Tier is built with React and uses route-based access control: an authenticated user is first passed through an Email Verification Gate and, where applicable, a Forced Password Change Gate, before reaching their role-specific dashboard. Students are directed to the Student Dashboard and its pages, which include the Scenario Engine that renders the interactive, decision-based scenario activities, and a Gamification interface that displays rank, badges, streak, and leaderboard standing. A service worker caches static assets so that the interface remains available and responsive during brief interruptions in connectivity. Instructional video is embedded from YouTube as an external content source rather than hosted within the system; this applies to a module's lesson video, to each scenario's opening clip, and to the consequence clip shown after a risky decision, each of which is configured by an administrator as a pasted link. Admin users are directed to the Admin Dashboard and its pages, where they manage student accounts, scenario modules, learning content, quiz questions, module assignments, and learner analytics.
>
> The system uses Firebase services as its backend support. Firebase Authentication handles user login, registration, and identity verification. The Application Tier's Cloud Functions, implemented in TypeScript on the Node.js 22 runtime, are organized by responsibility into callable groups for account management, content configuration, learning activities such as quiz and assessment submission, and analytics and reward processing, alongside Firestore-triggered functions and a Cloud Scheduler job that recomputes every analytics aggregate automatically each night at 02:00 Philippine time. The scheduled run and the administrator's manual refresh invoke the same underlying process, so the two cannot diverge in what they cover.
>
> Data reaches Cloud Firestore through two paths: direct client reads and writes, which are enforced by Firebase Security Rules, and server-side writes issued by Cloud Functions through the Admin SDK, which bypass those rules under the server's own trusted context. One consequence of this separation is shown explicitly in the diagram. The three assessment item banks, Module Quizzes, Module Pre-Tests, and Final Assessment, are excluded from the direct client path for students. Because each of these documents stores the correct answer alongside the question, a student has no legitimate reason to read one directly, and the security rules therefore restrict direct reads of these three collections to administrators. The student-facing assessment pages instead call dedicated Cloud Functions that remove the correct answer and the explanation from every question before the data leaves the server. Grading itself is performed server-side, so a submitted score is computed by the system rather than supplied by the client.
>
> Cloud Firestore stores user records, modules, scenario and quiz content, quiz and assessment attempts, scenario decision records, progress records, gamification records, and learner analytics. This architecture allows the system to deliver structured cybersecurity awareness training while supporting automated progress tracking, gamified engagement, and administrative monitoring.

---

## Figure 3.2: Use Case Diagram

> The Use Case Diagram in Figure 3.2 shows the main interactions between the system and its two primary actors: the Student and the Admin. A Student may enter the system through either of two paths: registering an account independently, in which case email verification is required before any dashboard becomes accessible, or signing in to an account created by an administrator, in which case the temporary password must be changed on first sign-in. These two conditions appear on the diagram as an included and an extending use case respectively, since verification always accompanies registration while the password change applies only to administrator-created accounts. The Student can then view available cybersecurity modules, take a module's pre-test, open a scenario-based module, complete scenario-based activities, make scenario decisions, view consequence-based feedback, take the module quiz assessment, view learning progress, take the end-of-curriculum final assessment once all six modules are completed, view earned rank, badges, and streak, view the class leaderboard, and log out of the system. A Student may also replay a simulation that has already been completed; the system treats such a run as practice and deliberately excludes it from the behavioural measurements. Unlike a standard quiz that a student may retake on demand, the module quiz and the final assessment are graded server-side and completed on submission, so progression is not blocked by score; only the final assessment carries a passing threshold, evaluated once a student has finished the full curriculum.
>
> The Admin can log in, manage user accounts covering creation, password reset, disabling, and deletion, manage modules and content covering lesson content, scenario branching, and quiz questions, configure module assignments, review scenario decisions, view learner analytics, monitor student progress, quiz scores, and completion status, identify learners who may need additional support, configure the final assessment, grant an additional quiz attempt to a student on appeal, refresh the analytics aggregation on demand, export analytics as CSV or PDF, view the system audit log, and log out of the system. These functions allow the Admin to control access to the training system, manage the learning materials and assessment content, and monitor both individual and class-wide student performance throughout the cybersecurity awareness training.
>
> Internal system actions such as updating progress, recomputing rewards, generating analytics, and unlocking the next module are not presented as separate use cases, because they are executed automatically by the system rather than initiated by an actor. Most occur in response to a user action and are further explained in the Activity Diagram. The nightly analytics aggregation is likewise omitted, as use case modelling describes goals pursued by actors external to the system, and a scheduled process has no initiating actor; it is documented in the System Architecture diagram instead. The same aggregation remains available to an administrator on demand through the Refresh Analytics Aggregation use case shown here.

---

## Change log

Everything altered from your submitted versions, and why.

### ERD

| Change | Reason |
|---|---|
| Added **Analytics Events** to the entity list and gave it a describing sentence | You listed 19 entities; the system has 20 collections. Verified against `functions/src/shared/constants.ts`. |
| Added a paragraph stating the **embed-versus-separate rule** with the scenario-choices / decision-records contrast | Your text explained *that* data is embedded but not the rule behind it. This is the paragraph that answers "why nested attributes instead of separate entities". |
| Added **analytics summary** to the Modules one-to-one list | Modules is 1:1 with six configuration entities; you listed five. |
| Added the **prerequisite self-relationship** sentence, marked conditional | Only valid if you drew the self-loop. |
| Added **whether the simulation was completed without any risky choice** to Module Progress | The `simulationFlawless` field now drives both a badge and a point bonus, so it is no longer an internal detail. |
| Name changed to Training System | Prose and figure titles disagreed. |

### Activity

| Change | Reason |
|---|---|
| Added the **replay branch** to the simulation paragraph | You drew the decision node but never explained it, leaving an unexplained diamond in the figure. |
| Added **records whether the run was completed without any risky choice** | Matches the `simulationFlawless` step now in the diagram. |
| Added the **gamification recompute** sentence after quiz grading | You drew the step in the System partition; the prose omitted it. |
| Added **stored at the moment of submission** to the final assessment sentence | Pre-empts a fair question about whether a reported gain can drift after later item edits. |
| Extended the closing list of automated actions | Now matches what the diagram shows, including the reward recompute and the first-run qualifier on decision recording. |

### Architecture

| Change | Reason |
|---|---|
| Added the **item bank exclusion** paragraph | The single most important architectural change since the figure was first drawn, and it appeared nowhere in the paper. This is your strongest security claim. |
| Expanded lesson videos to **all three video slot types** | There are three: lesson video, scenario opening clip, and consequence clip. |
| Added the **service worker** sentence | You added the box to the diagram; the prose omitted it. |
| Added **gamification records** to the Firestore contents list | Omitted from the original list. |
| Added **TypeScript on Node.js 22**, **02:00 Philippine time**, and the shared-code-path note | Concrete detail, and the shared-path note pre-empts "could the nightly run and the manual refresh disagree?" |

### Use Case

| Change | Reason |
|---|---|
| Replaced **"log in using a system-provided account"** with the two entry paths | Factually wrong, and it contradicted your own Activity description in the same chapter. Self-registration exists as a public function. |
| Merged the **duplicated admin account use cases** | You merged them on the diagram but the prose still listed both "create and manage student accounts" and "manage student and admin accounts". |
| Folded **manage quiz questions** into manage modules and content | Matches the include structure now on the diagram. |
| Added **Replay Completed Simulation** as its own sentence | Added to the diagram; not described. Given its own sentence rather than jammed into the list, which was already long. |
| Added **Grant Quiz Retry** and **Refresh Analytics Aggregation** | Both added to the diagram; not described. |
| Changed **CSV** to **CSV or PDF** | Both export paths exist. |
| Rewrote the closing paragraph to cover the **nightly job** | Your original said automated actions run "after specific user actions", which does not describe a time-triggered process. The rewrite makes omitting a Cloud Scheduler actor a stated modelling decision rather than an apparent oversight. |

---

## Final consistency sweep

Four facts now appear across these descriptions and Chapters 1 and 2. Each is stated in five or six places, which is where a manuscript contradicts itself most easily. Search the full document for each:

1. **Module unlocking is triggered by quiz submission, not by passing.** The only passing threshold is 75 percent on the final assessment. These four descriptions state it correctly; Chapters 1 and 2 did not, at last review.
2. **There is one final assessment taken after all six modules**, not a post-test per module.
3. **No assessment is timed.** The setting was removed from the codebase entirely.
4. **Students can register themselves.** All four descriptions now agree; confirm Chapter 1's scope section does too.
