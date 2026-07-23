# SENTRI — Progress Report
*Cybersecurity Awareness Training System — Status as of 2026-07-23*

## 1. Completed Modules (Curriculum Content)

All six planned training modules are fully built end-to-end: lesson content, an interactive branching scenario simulation, a one-time ungraded pre-test, and a graded quiz.

| # | Module | Scenario Simulation | Description |
|---|--------|---------------------|-------------|
| 1 | **Password Security** | Signup cards (live password strength/complexity checker), phishing email verification, account recovery | Teaches unique/strong passwords, credential stuffing risk, MFA, and breach response |
| 2 | **Phishing Awareness** | Inbox triage, fake login portal | Recognizing spoofed senders, urgency tactics, safe verification channels |
| 3 | **Malware Awareness** | Search results with bundled installers, fake alert pop-up, risky download | Ransomware, malicious downloads, unknown USB drives, patching |
| 4 | **Safe Browsing** | Research/search scenario, fake browser update, certificate warning | HTTPS misconceptions, public Wi-Fi risk, scam sites, fake update prompts |
| 5 | **Data Privacy** | Giveaway form, oversharing social post, spam flood | App permissions, data broker risk, oversharing consequences |
| 6 | **Online Safety** | Friend request vetting, chat escalation, report & block | Cyberbullying response, peer pressure online, stranger contact |

Each module's simulation uses a custom "video-pause-interact-branch" engine (not a multiple-choice menu) — students act on real-looking interface elements, get an in-context consequence for risky choices, and always reach the safe outcome before continuing.

## 2. Platform Features Completed

**Student side:** real (non-static) dashboard and progress page; curriculum-order module unlocking; pre-test gate (one-time, ungraded, restart-safe if interrupted); lesson viewer with YouTube video slot; quiz (server-graded, one attempt only, always advances regardless of score); personal decision analytics (safe vs. risky choice counts).

**Admin side:** account management (create/reset/delete, with full cascading data cleanup on delete, plus an audit log); Module Configuration (lesson content, quiz questions/settings, scenario branching, assignments); Quiz Manager; Scenario Manager with a "View Scenario Flow" diagram for presentation/demo purposes; Analytics dashboard (per-module completion/pass rates, per-student aggregates); real dashboard with recent quiz activity and completion rates.

**Infrastructure:** Firebase Auth (role-based, forced password change + email verification on new accounts), Firestore with security rules enforcing per-role/per-owner access, Cloud Functions (TypeScript, v2) for all graded/authoritative logic (quiz grading, analytics aggregation, account management), unit + integration test suite for the backend.

## 3. Known Gaps / Future Work

1. **Lesson content is not admin-editable in practice.** The student Lesson Viewer reads hardcoded local files (`src/data/moduleContent/*.js`); the admin's Lesson Editor writes to a separate Firestore collection nothing reads yet. Reconciling these two is the largest remaining integration gap.
2. **Scenario configuration is similarly disconnected.** The admin's Scenario Configuration tool models scenarios as paused-video-plus-branching-choices in Firestore; the actual student-facing engine runs on hand-authored local scene components. Admin edits to scenario text/videos don't reach students yet.
3. **No real video content yet.** Every lesson/scenario has a working, fullscreen-capable YouTube embed slot, but all `videoId` fields are still empty placeholders — recording/uploading the videos and dropping in their IDs is the only remaining step there.
4. **Firebase App Check is not configured** (no reCAPTCHA site key set), so backend requests aren't attested against abuse yet — fine for a capstone demo, worth doing before any real deployment.
5. **Platform maintenance:** Cloud Functions are on Node.js 20, which Google deprecates 2026-04-30 (already past) and decommissions 2026-10-30 — needs a runtime upgrade before then. The `firebase-functions` SDK is also behind current.
6. **No frontend automated test suite** — only the Cloud Functions backend has unit/integration tests; UI regressions are currently caught by manual/live verification only.
7. **Possible future enhancements (not started):** trend/time-series analytics (progress over time, not just snapshots), cohort/class-level reporting for instructors, mobile responsive polish pass, and a real admin-configurable retry/appeal path for a failed quiz attempt (currently strictly one attempt with no override).

---
*Generated from direct codebase inspection (module content, Firestore schema, Cloud Functions source, and this session's live-verified fixes) — not cross-checked against the original capstone paper, which was not available in this session.*
