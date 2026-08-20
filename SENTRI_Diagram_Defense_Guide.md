# SENTRI: Diagram Defense Guide

*A plain-language walkthrough of all four diagrams, written to be read the night before a defense. Verified against commit `09ce937` on 2026-08-20.*

**How to use this.** Each diagram gets three parts: what it shows in one paragraph, then every element and arrow explained in ordinary language, then the questions you are most likely to be asked with answers you can say out loud. If you only have time for one section, read the System Architecture, and inside it read "The two paths" twice.

**The single most important idea in the whole system.** If you understand one thing, understand this: *anything that affects a grade, a score, or a research number is computed on the server, never in the browser.* Almost every hard question about any of these four diagrams is really that question wearing a different hat. When you get stuck, come back to it.

---

# Part 1: System Architecture (Figure 3.3)

## What it shows, in one paragraph

The system is split into three layers. The **Presentation Tier** is what runs in the user's browser: the screens, the buttons, the scenario simulation. The **Application Tier** is the code that runs on Google's servers, where all the important decisions happen: grading, unlocking, calculating. The **Data Tier** is the database where everything is stored. The diagram shows how a request travels between those three layers, and it deliberately shows **two different routes** into the database, because that split is the core security design of the whole system.

## The Presentation Tier, element by element

**The Student and the Admin, and the browser.** Two kinds of user, one application. There is no separate admin program to install. The same website behaves differently depending on who signed in.

**React.** The framework the interface is built with. It is a *single-page application*, which means the browser downloads the app once and then swaps out screens internally instead of reloading a fresh page from the server every time you click something. That is why the app feels quick and why it can keep the scenario simulation running smoothly.

> **If asked "why React?"** It is component-based, so a piece of interface like the scenario decision overlay is written once and reused across all sixteen scenes. It also has the largest ecosystem and documentation base, which matters for a project a team has to maintain.

**Email Verification Gate, then Forced Password Change Gate.** These sit between logging in and reaching any dashboard, and the order matters. First the system confirms the email address is real. Then, only if the account was created by an administrator and still has the temporary password, it forces a password change. A student who registered themselves never sees the second gate, because they chose their own password already. Both gates check live, so completing one moves you straight into the next without logging in again.

> **If asked "why two separate gates?"** They answer two different questions. Verification answers "is this a real person at a real address." The password change answers "is this account still using a password an administrator knows." An admin-created account starts with a password someone else typed, and it should not stay that way.

**Student Dashboard and Pages.** Everything a learner sees: module list, lesson viewer, quiz, progress page.

**Scenario Engine.** The part that runs the interactive simulations. Worth calling out separately because it is not a quiz. The student clicks on realistic interface elements, an email, a download button, a browser warning, and the engine responds to what they actually did. It tracks which decision was made, on which attempt, and how long it took.

**Gamification UI.** Rank, badges, streak, leaderboard. It only *displays*; the numbers behind it are calculated on the server.

**Service Worker.** A small script the browser keeps running in the background. It caches the app's static files, so if the connection drops briefly, the interface does not collapse into a blank error page. It deliberately does not cache anything from Firebase, because stale data would be worse than no data.

> **If asked "why do you need offline support?"** It is resilience, not a full offline mode. Campus Wi-Fi drops. The student keeps the interface they already loaded instead of losing their place. Live data still needs a connection.

**Admin Dashboard and Pages.** Account management, module configuration, the analytics dashboard.

**YouTube, drawn outside the boundary with a dashed arrow.** All instructional video is embedded from YouTube rather than stored by the system. There are three kinds of clip: a module's lesson video, a scenario's opening clip, and the consequence clip after a risky decision. The arrow is dashed and the box sits outside the system boundary because YouTube is a third-party service the team does not control.

> **If asked "why not host the videos yourselves?"** Video storage and delivery is expensive and slow to build well: you need transcoding, adaptive quality for slow connections, and a content delivery network. YouTube provides all of that free. The tradeoff is a dependency on an external service, which is why it is drawn outside the boundary honestly rather than hidden inside it.

## The Application Tier, element by element

**Firebase Authentication.** Handles registration, login, password resets, email verification. It is the component that knows *who* someone is. It does not decide what they are allowed to do; that is the security rules and the functions.

**Cloud Functions for Firebase.** The server-side code, written in TypeScript, running on Node.js 22. It contains four things:

**1. Callable functions, grouped by job.** A "callable" is a function the browser can invoke directly by name, like calling a method that happens to run on a server thousands of kilometres away. They are grouped as:
- *Accounts:* creating, disabling, deleting, resetting passwords, registration
- *Content configuration:* everything the admin edits (lessons, quizzes, scenarios)
- *Learning:* fetching assessments and submitting quizzes and assessments
- *Analytics and rewards:* calculating aggregates, leaderboard, gamification state

**2. Firestore Triggers.** These are different from callables and the difference is worth being crisp about. Nobody calls a trigger. A trigger *watches a collection* and fires automatically whenever a document there is written. The system has four:
- one watching `moduleProgress`
- one watching `finalAssessmentProgress`
- one watching `learningAnalytics`
- one watching `scenarioDecisionRecords`

The first three recompute a student's gamification state. The fourth rolls a single decision into that student's safe/risky totals.

**3. Cloud Scheduler.** Google's cron service. It invokes one scheduled function every night at 02:00 Philippine time, which recomputes every analytics aggregate. Nothing depends on it having run; the same calculation is available on demand from the analytics page, and both use the identical code.

> **If asked "what happens if the nightly job fails?"** Nothing breaks. Every aggregate is recomputable, and the admin has a Refresh button that runs the same code. The schedule is a floor, not a dependency.

## The Data Tier

**Firebase Security Rules.** A rulebook that sits in front of the database and is checked on *every single* read and write that comes from a browser. It is not application code; it runs inside Firebase itself and cannot be skipped by a client, no matter what the client sends. Example rule in plain English: "a student may update a progress document only if the `userId` field on that document equals their own user ID."

**Cloud Firestore.** The database. Twenty collections holding accounts, module content, progress, assessment results, scenario decisions, gamification records, and analytics.

## The two paths (read this twice)

This is the part of the diagram most likely to be questioned, and the part worth being able to explain without looking.

**Path A: the browser talks to the database directly, and the Security Rules check every operation.**

Used for things that are safe for a client to do. A student's browser writes directly to:
- their **own** `moduleProgress` row, to mark a lesson as read
- their **own** `scenarioDecisionRecords`, when they make a decision in a simulation

The rules enforce that a student can only ever touch their own rows. An admin also uses Path A to edit module content, again with the rules checking their admin role on every write.

**Path B: Cloud Functions write to the database using the Admin SDK, which bypasses the Security Rules entirely.**

The Admin SDK is a privileged library that only runs on the server. It is not subject to the rules, because it *is* the trusted party. Everything that determines a grade or a research figure goes this way:
- `submitQuiz` grades the quiz and writes the score
- `submitAssessment` and `submitFinalAssessment` do the same for the pre-test and final assessment
- every analytics aggregate
- every gamification recompute
- account deletion and its cascade

> **If asked "isn't bypassing your own security rules a vulnerability?"** No, and the reason is *where the code runs*. Security rules exist to constrain code running on a machine you do not control, which is the user's browser. A Cloud Function runs on Google's infrastructure, deployed by the development team, and a user cannot modify it or invoke it with different privileges than it grants itself. Applying rules to it would be like a bank vault requiring the bank's own staff to enter through the customer queue. The protection for Path B is that every function checks authentication and role itself, at the top of the function, before doing anything.

> **If asked "why not put everything on Path B, for consistency?"** Cost and speed. Every callable invocation is a billed function execution with a cold-start delay. Marking a lesson as read is not sensitive: the worst a dishonest student achieves is pretending to have read something, which harms only them. Spending a server round trip to protect that would be paying for security that buys nothing. The line is drawn at anything that produces a number a researcher or an instructor would rely on.

## The item bank exception (the newest thing on the diagram)

There are three collections a student is **not** allowed to read directly, even though they are just content: `moduleQuizzes`, `modulePretests`, and `finalAssessment`.

The reason is simple. Each of those documents stores the correct answer right next to the question, because the server needs it to grade. If a student could read the raw document, they could read the answer key.

So instead: the student's browser calls a Cloud Function, the function reads the document server-side, **strips out the correct answer and the explanation**, and returns only the question text and the choices. The security rules restrict direct reads of those three collections to administrators, who legitimately need to see the answers in order to edit them.

> **If asked "so a student definitely cannot see the answers?"** Be precise here, because overstating it is the risk. Say: *the live item bank is never sent to a student, and grading happens server-side, so a score cannot be forged.* There is one honest caveat worth volunteering if pressed: the system ships with default seed questions, and that seed content is part of the application's JavaScript bundle. A technically sophisticated student inspecting the bundle could find the default answers. The moment an administrator edits any question, the live version diverges from that seed. If you want to say something crisp: *"Grading integrity is guaranteed. Absolute secrecy of the default seed content is not, and moving that seed to the server is a known improvement."*

## What happens when a student makes one decision (the chain worth knowing)

If you get asked to trace something end to end, this is the best example because it touches four parts of the diagram:

1. The student clicks a risky link in the Scenario Engine.
2. The browser writes one document to `scenarioDecisionRecords` via **Path A** (their own record, rules-checked).
3. That write fires the `updateLearningAnalytics` **trigger**, automatically.
4. That trigger increments the student's safe/risky totals in `learningAnalytics`, via **Path B**.
5. That write fires a second trigger, `updateGamificationOnBehaviour`.
6. That trigger recomputes the student's points, rank, badges, and streak, again via **Path B**.

One click, two automatic server-side steps, and nothing about the reward or the analytics was calculated in the browser.

---

# Part 2: Entity Relationship Diagram (Figure 3.12)

## What it shows

The structure of the database: what is stored, and how the pieces relate. Twenty collections. The thing that makes it look different from a textbook ERD is that some attributes are shown *nested inside* others, in braces and brackets.

## Why the nested attributes (the question you will get)

**Short answer:** Firestore is a document database, not a relational one. A document can natively contain a structured value, so a nested attribute in the diagram is an accurate picture of one field inside one real document. It is not a shortcut for several tables.

**The rule the team followed:**

> Embed it if it is only ever created, read, and updated together with its parent. Give it its own collection if it needs to be queried across many parents, or if a different person writes it at a different time.

**The example that proves you understand it.** A quiz question's choices are embedded, because nobody ever needs a choice without its question. But students' *answers* live in their own collection, `quizResponses`, because item analysis needs to ask "how did every student in the class answer question 7," and that question spans every student. Same data area, opposite decision, for a specific reason.

> **If asked "isn't this denormalized, and won't that cause inconsistency?"** Some duplication is deliberate. The five analytics entities are *derived*: every value in them is recomputed from the raw records, nightly and on demand. They are caches that make reporting cheap, never a second source of truth. If one ever disagreed with the raw data, the fix is to recompute it, and that recompute is a button the admin can press.

> **If asked "why not use SQL then?"** The system needs real-time updates, built-in authentication, server-side functions, and hosting, and Firebase provides those as one integrated platform with a free tier a student project can actually run on. Choosing Firestore means accepting a document model; the schema was then designed for that model rather than a relational one forced into it.

## The relationships worth being able to state

- **Users to Module Progress: one to many.** Each student has one progress row per module, so six.
- **Users to Gamification, Student Analytics, Final Assessment Progress: one to one.** One reward record, one summary, one final result per student.
- **Modules to its six configuration entities: one to one each.** Lesson, quiz, pre-test, scenario, assignments, analytics, all keyed by the same module ID.
- **Modules to itself: recursive, through `prerequisite`.** This is what encodes the curriculum order.
- **Final Assessment to Final Assessment Progress: one to many.** There is exactly *one* final assessment configuration for the whole curriculum, and many students attempt it.

> **If asked "why is Final Assessment a singleton and not one per module?"** Because the design deliberately replaced six per-module post-tests with a single test at the end. Six post-tests meant a student sat eighteen assessments and was re-tested on a module minutes after reading it. One test at the end measures retention instead of short-term recall. The item bank is drawn from the same six pre-test banks, so the before-and-after comparison still uses the same questions.

---

# Part 3: Use Case Diagram (Figure 3.2)

## What it shows

Who can do what. Two actors, Student and Admin, and the goals each can pursue.

## Include versus extend, in plain language

- **`«include»` means "always part of."** Completing a scenario always involves making decisions, so `Complete Scenario-Based Activity` includes `Make Scenario Decision`. The arrow points *from* the bigger use case *to* the piece inside it.
- **`«extend»` means "sometimes, under a condition."** Changing a temporary password only happens for accounts an admin created. So `Change Temporary Password` extends `Log In`, and the arrow points the other way, *from* the optional piece back *to* the base.

An easy way to remember: include points inward to its parts, extend points back to what it attaches onto.

## The questions to expect

> **"Why is there no actor for the nightly analytics job?"** Because use case diagrams model *goals pursued by actors outside the system*, and a scheduled process has no actor with a goal. It is internal automation, and it is documented in the architecture diagram where it belongs. Also worth adding: the same aggregation is available to an admin on demand, and that *is* on the diagram, as Refresh Analytics Aggregation. The schedule is a second trigger for one process, not a separate capability.

> **"Why isn't 'unlock the next module' a use case?"** Nobody wants "unlocking" as a goal. It happens automatically as a consequence of submitting a quiz. Use cases describe intentions, not the system's internal reactions to them. The activity diagram shows those reactions.

> **"Why can a student replay a simulation? Doesn't that let them game the safe-choice statistics?"** No, and this is a good question to get. A replay is deliberately recorded as *nothing*. No decision documents are written on a replay, so the behavioural measurements always reflect the first genuine attempt. A student can practise as much as they want and it cannot move the research numbers.

---

# Part 4: Activity Diagram (Figure 3.11)

## What it shows

The step-by-step flow through the system, split into three lanes: what the Student does, what the System does automatically, and what the Admin does.

## The flow in ordinary words

Open the site. Register if new, otherwise log in. Verify email, change the temporary password if there is one. Land on the right dashboard.

Then, per module: take the pre-test once, read the lesson in full, run the simulation, take the quiz. Submitting the quiz completes the module and unlocks the next one. Repeat six times. Then take the final assessment.

## The two things on this diagram people ask about

**1. Why doesn't passing the quiz gate progression?**

This is the most important thing to be able to defend on this figure, because it looks like a mistake and it is not.

Submitting the quiz completes the module and unlocks the next one **regardless of the score**. The score is recorded, but it is not a gate. Three reasons:

- The purpose is *awareness training*, not certification. Locking a student out of the phishing module because they scored 60 on passwords means the person who most needs the training gets the least of it.
- The research design needs students to reach the end. A gate that stalls a struggling student produces missing data exactly where the intervention matters most.
- The learning is measured properly elsewhere: through the pre-test to final-assessment gain, per-topic mastery, and the behavioural measures from the simulations. Progression and measurement are separated on purpose.

The only passing threshold anywhere in the system is 75 percent on the final assessment, which is at the end and gates nothing.

**2. What is the replay branch for?**

Before the simulation starts, the system checks whether this student already finished it. If yes, the run is practice: nothing is recorded. This exists so that repeated practice is genuinely encouraged without corrupting the behavioural data. It is a measurement-integrity feature drawn into the flow.

---

# Part 5: The five hardest questions, across all four diagrams

**1. "What stops a student from cheating, for example writing their own score?"**

Be specific rather than sweeping. Scores, quiz attempts, individual question responses, analytics, gamification, and final assessment results are written **only** by Cloud Functions. The security rules deny every client write to those collections, so a student cannot write a score even by crafting their own request outside the app.

What *is* client-writable is a student's own progress flags, like "I finished reading this lesson." That is deliberate: the browser is the only thing that knows the student reached the end of the reading. The honest consequence is that a determined student could rush through the interface faster than intended. What they could not do is produce a score, a learning gain, or a leaderboard position, because every one of those is computed on the server from data only the server can write. The research data is protected; the pacing is not, and it does not need to be.

**2. "Why is your architecture three-tier?"**

Because the three layers change for different reasons and at different rates. The interface changes when the design changes. The business logic changes when the rules change. The data schema changes rarely. Separating them means a change to one does not force a rewrite of the others. It also means the security boundary has a clear location: the line between the browser and the server.

**3. "What is the difference between a callable function and a trigger?"**

A callable is *invoked* by the app: the browser says "grade this quiz" and waits for an answer. A trigger is not invoked by anyone; it *watches* a collection and runs by itself when a document there changes. Callables are for requests. Triggers are for consequences.

**4. "Your analytics duplicate data that already exists. Why?"**

They are pre-computed summaries. Calculating a class-wide learning gain from raw records means reading every progress, quiz, and response document, which is slow and, on a billed database, expensive to do on every page load. So it is computed once, stored, and read cheaply. It is recomputed nightly, whenever an admin refreshes, and immediately when an account is deleted so that a removed student's data stops counting straight away.

**5. "If you had to change one thing about this architecture, what would it be?"**

Have an answer ready; "nothing" reads as not having thought about it. A good, true one: **move the default seed question content out of the client bundle and onto the server.** The live answer keys are already protected, but the seed content ships with the app, and moving it would close the last gap between "grading cannot be forged" and "the answers are genuinely unreachable." It is a contained change, and knowing exactly what it would take is a better answer than claiming the design is finished.

---

*Companion documents: `SENTRI_Diagram_Corrections.md` (what to fix in the drawings), `SENTRI_Figure_Descriptions.md` (the paste-ready figure captions), `SENTRI_Paper_Alignment_Review.md` (where the chapters and the system disagree).*
