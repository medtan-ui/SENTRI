# SENTRI — Module Content Authoring Context

This file is a self-contained brief for a future conversation (with or without codebase access) to design complete lesson content for SENTRI's training modules. It contains the exact schema, one fully-written gold-standard example, and every other module's existing scenario + quiz content so new lesson content can be written *consistently* and *thematically grounded* in what the student will actually do and be tested on.

**What to ask a future Claude, verbatim:** *"Using CONTENT_AUTHORING_CONTEXT.md, write complete lesson content for [module name] — objectives, sections, best practices, key takeaways, and real citable references — matching the schema and tone of the Password Security example, and covering everything its quiz tests."*

---

## 1. System overview

SENTRI is a cybersecurity awareness training app for students. The curriculum is **six fixed modules**, always present, completed in order:

1. Password Security
2. Phishing Awareness
3. Malware Awareness
4. Safe Browsing
5. Data Privacy
6. Online Safety

Each module has three pieces of content, consumed in this order by the student:

```
Lesson (read)  →  Scenario Simulation (interactive, diegetic)  →  Quiz (graded)  →  Module Complete  →  Next module unlocks
```

- **Lesson** — objectives, prose sections, best practices, key takeaways, references. This is the only piece that's largely *unwritten* right now (see §3).
- **Scenario Simulation** — a fully built, interactive "Scenario Engine" experience: the student clicks real elements inside a cloned interface (fake email client, fake browser, fake phone UI) and gets branching feedback. **Fully built and working for all 6 modules already** — included below for context only, not something you're being asked to write.
- **Quiz** — 5 multiple-choice questions with a correct answer and an explanation. **Already written for all 6 modules already** — included below so lesson content actually teaches what's tested.

Your job, if you're reading this to design content, is almost entirely: **write the Lesson for the 5 modules that don't have one yet**, using the scenario + quiz content below to make sure the lesson is grounded in the same narrative and covers everything the quiz assumes the student already knows.

---

## 2. What exists vs. what's needed

| Module | Lesson content | Scenario simulation | Quiz (5 Q&A) |
|---|---|---|---|
| Password Security
| Phishing Awareness 
| Malware Awareness 
| Safe Browsing 
| Data Privacy
| Online Safety 

Keep in mind that we dont eed this module design to be a full on course since we will not be giving certificates, and this course ist like a full on professional course.

The placeholder every unwritten module currently has:
```js
lesson: {
  objectives: [],
  sections: [
    { id: 'coming-soon', title: 'Lesson Content Coming Soon', content: "This module's lesson content hasn't been written yet — the interactive simulation is ready to try from Curriculum." },
  ],
  bestPractices: [],
  keyTakeaways: [],
  references: [],
},
```

---

## 3. Exact schema to produce

This is the literal JS shape a `lesson` object must have. Field names, types, and structure must match exactly — this is what gets pasted into `src/data/moduleContent/<module>.js`, replacing that module's placeholder `lesson: {...}` block.

```js
lesson: {
  objectives: [
    'string — one learning goal per line, 3 total is the established norm',
  ],
  sections: [
    {
      id: 'kebab-case-id',      // unique within the module, used as a React key
      title: 'Section Title',
      content: 'Prose. Use \n\n between paragraphs for section breaks — the viewer renders each section as one block of text, paragraphs included.',
    },
    // 5 sections is the established norm (see §4's pattern)
  ],
  bestPractices: [
    'string — one actionable habit per line, imperative mood ("Enable X", "Never do Y")',
  ],
  keyTakeaways: [
    'string — one short, quotable summary sentence per line, 3 total is the norm',
  ],
  references: [
    { id: 'ref-01', title: 'Publisher / Source Name — what it is', link: 'https://real-working-url' },
    // 2+ is the established norm. MUST be real, currently-live, authoritative
    // sources — NIST, CISA, official vendor security pages, well-known
    // nonprofits (Have I Been Pwned, StaySafeOnline, etc.), never invented
    // or placeholder URLs.
  ],
},
```

Other fields on the same module object (title/description/difficulty/etc.) already exist and should **not** be changed — only the `lesson` block is being written.

---

## 4. Gold-standard example — Password Security (fully written, ship as-is)

This is the one module with real lesson content already. Match this tone and structure exactly: direct, second-person, explains *why* not just *what*, no filler, no moralizing. Five sections following this exact arc: **Introduction → Why It Matters → Characteristics/Mechanics → Common Attacks/Threats → Summary.**

```js
title: 'Password Security',
description: 'Learn what makes a password strong, how attackers actually crack or steal passwords, and the everyday habits that keep your accounts safe.',
difficulty: 'Beginner',

lesson: {
  objectives: [
    'Understand what makes a password strong',
    'Recognize common password attacks',
    'Apply password best practices to protect your own accounts',
  ],
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      content: "Passwords are the most common way we prove who we are online, yet many people still use weak or reused passwords that put their accounts at serious risk. In this lesson, you'll learn what makes a password strong, how attackers actually crack passwords, and the habits that keep your accounts safe.",
    },
    {
      id: 'why-it-matters',
      title: 'Why Password Security Matters',
      content: "A single compromised password can expose far more than one account. Because many people reuse passwords, attackers who obtain a password from one breached service will often try it against email, banking, and social media accounts too — a technique called credential stuffing.\n\nOnce an attacker gains access to your email account specifically, they can typically reset the passwords for almost every other account you own, since password reset links are usually sent by email. This makes protecting your primary email password one of the highest-priority security habits you can build.",
    },
    {
      id: 'characteristics',
      title: 'Characteristics of Strong Passwords',
      content: "A strong password is long, unique, and unpredictable.\n\nLength matters more than complexity — a 16-character passphrase made of random words is usually stronger and easier to remember than an 8-character password full of substituted symbols like \"P@ssw0rd!\".\n\nUniqueness means never reusing the same password across multiple accounts, so a breach at one service can't be used to access your accounts elsewhere.\n\nUnpredictability means avoiding dictionary words, personal information (birthdays, names, pet names), and common patterns like \"123456\" or keyboard sequences like \"qwerty\".",
    },
    {
      id: 'common-attacks',
      title: 'Common Password Attacks',
      content: "Brute-force attacks try every possible combination of characters until the correct password is found — modern computing power makes short passwords crackable in seconds.\n\nDictionary attacks try common words and known leaked passwords instead of every possible combination, which is much faster against predictable passwords.\n\nCredential stuffing takes username/password pairs leaked from one breach and automatically tries them against many other websites, exploiting password reuse.\n\nPhishing tricks users into typing their password directly into a fake login page controlled by the attacker — no cracking required at all.",
    },
    {
      id: 'summary',
      title: 'Summary',
      content: "Password security is one of the simplest and most effective ways to protect your digital life. By choosing long, unique passwords, using a password manager, and enabling multi-factor authentication, you make it dramatically harder for attackers to compromise your accounts.\n\nYou've completed the Password Security lesson. Next, you'll apply what you've learned in an interactive simulation where you'll practice spotting weak passwords and responding to real account security scenarios.",
    },
  ],
  bestPractices: [
    'Enable multi-factor authentication (MFA) wherever it is offered',
    'Use a password manager to generate and store unique passwords',
    'Never reuse the same password across accounts',
    'Favor long passphrases (4-5 random words) over short, complex passwords',
    'Change a password immediately if a service reports a data breach',
  ],
  keyTakeaways: [
    'Strong passwords are long, unique, and unpredictable.',
    'Reusing passwords puts every account tied to that password at risk.',
    'Password managers and multi-factor authentication provide the strongest everyday protection.',
  ],
  references: [
    { id: 'ref-01', title: 'NIST Digital Identity Guidelines', link: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
    { id: 'ref-02', title: 'Have I Been Pwned — check for breached credentials', link: 'https://haveibeenpwned.com' },
  ],
},
```

---

## 5. Per-module briefs (the 5 modules needing lesson content)

For each module below: metadata, the full scenario simulation (so the lesson can set up the same narrative beats the student is about to act out), the existing quiz (so the lesson must cover every concept it tests), and a concept checklist extracted from that quiz.

Output file for each: `src/data/moduleContent/<camelCaseName>.js` — replace only the `lesson: {...}` block, leave everything else in the file untouched.

---

### 5.1 Phishing Awareness

**File:** `src/data/moduleContent/phishingAwareness.js`
**Title:** Phishing Awareness · **Difficulty:** Beginner
**Description (existing, don't change):** "Recognize deceptive emails, messages, and websites designed to steal credentials or personal information."

**Quiz must-cover checklist** (extracted from the 5 existing quiz questions below):
- Verifying a suspicious request through a known/trusted channel (e.g. phone), not by replying to the email itself
- Mismatched sender domain as a red flag
- Never open unexpected attachments from unknown senders — report instead
- What a fake login page is designed to do (steal entered credentials)
- Why replying to a suspicious email is worse than useless (confirms you're a real, active target)

**Scenario simulation** (already built — a Campus Mail inbox, then a fake student-portal login page):

| Scenario | Setup | Choices (✅ = safe) |
|---|---|---|
| 1 — "A Message About Your Submission" | An email about a missing assignment is in the inbox. Real elements: Submit Assignment button, Reply button, sender name (expandable → Report). | ❌ Click Submit Assignment → leads to a lookalike login page. ❌ Reply asking for clarification → confirms you're a real, active target. ✅ Inspect the sender (address doesn't match the real university domain), then Report. |
| 2 — "A Familiar-Looking Login Page" | A convincing lookalike of the student portal login, domain `tip-edu-verify.net`. | ❌ Enter password + Sign In → **"Your credentials were captured."** Account takeover follows within minutes. ❌ Click "Forgot password?" → still on the attacker's page, still capturable. ✅ Check the address bar (domain mismatch), leave the page. |

**Existing quiz** (`Phishing Awareness Knowledge Check`, passing score 80%):

1. *What is the safest way to verify a suspicious payment request email?* → **Call the vendor using a known, trusted phone number.** (Easy) — *Verifying through a channel you already trust — not the email itself — confirms whether the request is real.*
2. *Which of these is a common sign of a phishing email?* → **A sender address that does not match the real company.** (Easy) — *Mismatched sender domains are one of the most reliable signs of a spoofed or phishing email.*
3. *What should you do with an unexpected attachment from an unknown sender?* → **Avoid opening it and report it.** (Medium) — *Reporting an unopened suspicious attachment protects both you and anyone else who may have received the same email.*
4. *What is a fake login page designed to do?* → **Steal your entered credentials.** (Medium) — *A convincing lookalike login page exists solely to capture whatever credentials are typed into it.*
5. *Why is verifying through a known channel better than replying to a suspicious email?* → **It confirms you are talking to the real organization, not the attacker.** (Hard) — *Replying only keeps the conversation with whoever sent the email — which may be the attacker. A known channel bypasses them entirely.*

---

### 5.2 Malware Awareness

**File:** `src/data/moduleContent/malwareAwareness.js`
**Title:** Malware Awareness · **Difficulty:** Intermediate
**Description (existing, don't change):** "Understand how ransomware, trojans, and spyware spread, and how to recognize an infected device early."

**Quiz must-cover checklist:**
- Free downloads from unofficial sites often bundle malware
- Unknown USB drives are a malware delivery vector — hand to IT, never plug in
- What ransomware actually is (encrypts files, demands payment)
- Correct response to a ransomware pop-up (disconnect from network, contact IT — not pay, not restart repeatedly)
- Why paying a ransom doesn't guarantee file recovery

**Scenario simulation** (already built — a search-results page, a downloads bar, then a fake antivirus popup):

| Scenario | Setup | Choices (✅ = safe) |
|---|---|---|
| 1 — "Looking for a Video Editor" | Search results for "free video editor." Real elements: sponsored "FREE Full Version" result on a `.tk` domain, a classmate's shared "cracked" copy, the official site further down. | ❌ Click sponsored result → common malware distribution method. ❌ Open classmate's cracked copy → modified software, no way to verify what else changed. ✅ Visit the official site (legitimate free trial). |
| 2 — "The Download Finished" | `Z-Cut_Setup.exe` has downloaded, publisher unknown. | ❌ Open directly from downloads bar → **"Your files are being encrypted."** ❌ Show in folder, then open it anyway → same outcome, same reasoning. ✅ Delete the file without opening it. |
| 3 — "A Sudden Warning" | A popup styled like a system antivirus alert appears *inside the browser page* — the real antivirus sits quietly in the system tray the whole time. | ❌ Click "Clean Now" in the popup → the popup is the scam; that button typically installs the malware it claims to remove. ❌ Restart the computer → nothing to restart away, it was just a browser popup. ✅ Close the popup, then run a scan from the real antivirus in the system tray. |

**Existing quiz** (`Malware Awareness Knowledge Check`, passing score 75%):

1. *Why are free downloads from unofficial websites risky?* → **They are often bundled with malware.** (Easy)
2. *What should you do if you find an unknown USB drive?* → **Give it to IT without plugging it in.** (Easy)
3. *What is ransomware?* → **Malware that locks your files and demands payment.** (Medium)
4. *What is the recommended response to a ransomware pop-up?* → **Disconnect from the network and contact IT.** (Medium)
5. *Why doesn't paying a ransomware demand guarantee your files back?* → **There is no guarantee the attacker will restore access after payment.** (Hard)

(Full explanation text for each lives in `src/features/admin/quiz-config/services/quizConfigService.js` under `malwareAwarenessDefaults` if needed verbatim.)

---

### 5.3 Safe Browsing

**File:** `src/data/moduleContent/safeBrowsing.js`
**Title:** Safe Browsing · **Difficulty:** Intermediate
**Description (existing, don't change):** "Identify malicious websites, verify secure connections, and avoid drive-by downloads while browsing."

**Quiz must-cover checklist:**
- Public Wi-Fi risk (traffic interception)
- Checking a site's reputation before entering payment details
- Extreme/unrealistic discounts as a scam-site warning sign
- Browser extensions demanded by an unrelated site as a malware vector
- Trusted network / VPN as the safe way to access sensitive accounts

**Scenario simulation** (already built — a search-results page, a certificate warning interstitial, then a fake update banner):

| Scenario | Setup | Choices (✅ = safe) |
|---|---|---|
| 1 — "Finding Research Sources" | Search results for research sources. Sponsored "10,000 papers free" result on a `.xyz` domain, an exact-title-match blog result, the university's own repository further down. | ❌ Click the sponsored result. ❌ Click the suspiciously exact blog match. ✅ Click the university's institutional repository. |
| 2 — "A Connection Warning" | Full-page "connection is not private" interstitial. A free "View certificate" inspection reveals a mismatched issuer (costs nothing, doesn't resolve the scenario). | ❌ Continue anyway → **"Someone else is reading this connection."** (data exposure) ✅ Back to safety. |
| 3 — "A Banner on the Page" | A fake "your browser is outdated" banner rendered *inside* a web page, styled to imitate real browser chrome. | ❌ Click UPDATE in the banner → never came from the real browser. ❌ Close the banner and keep reading → no harm this time, but nothing was verified either. ✅ Check for updates through the browser's own menu (Settings → About). |

**Existing quiz** (`Safe Browsing Knowledge Check`, passing score 80%):

1. *Why is public Wi-Fi risky for sensitive logins?* → **Traffic can potentially be intercepted by others on the network.** (Easy)
2. *What should you do before entering payment details on an unfamiliar site?* → **Check reviews and the site's reputation first.** (Medium)
3. *What is a warning sign of a scam shopping site?* → **Extreme discounts like 90% off on an unfamiliar site.** (Easy)
4. *Why should you be cautious about browser extensions demanded by a random website?* → **They can be a way to deliver malware.** (Medium)
5. *What is the safest way to access a sensitive account like banking?* → **A trusted network or a VPN.** (Hard)

---

### 5.4 Data Privacy

**File:** `src/data/moduleContent/dataPrivacy.js`
**Title:** Data Privacy · **Difficulty:** Advanced
**Description (existing, don't change):** "Understand what personal data is collected online and how to limit exposure across apps and services."

**Quiz must-cover checklist:**
- App permissions that have no legitimate connection to the app's function (the flashlight-app-wants-contacts example is the canonical one to riff on)
- Risk of publicly posting travel dates + home address together
- Denying unnecessary permission requests
- Value of deleting/requesting deletion of unused accounts (limits future breach exposure)
- Limiting audience when sharing personal photos

**Scenario simulation** (already built — a social feed giveaway post, a data-harvesting form, then a spam-message flood; phone-surface UI throughout):

| Scenario | Setup | Choices (✅ = safe) |
|---|---|---|
| 1 — "A Giveaway in the Feed" | A "₱5,000 giveaway" post from a new, unverified account ("Reminder-78"). | ❌ Tap JOIN NOW → no verification badge, days old, almost no post history. ✅ Open the profile first (0 mutual friends, created 6 days ago, 2 posts, comments disabled, no verification) — *then* Delete request. ✅ Mark "Not interested" without checking (safe, but doesn't teach *why* it was suspicious). |
| 2 — "Claim Your Prize" | A form asking for name, email, home address, phone, birthday to "claim" the prize. | ❌ Submit with a birthday filled → **"Your information is being resold."** (identity-verification factor at banks) ❌ Submit with a home address filled → same outcome (physical location exposed). ❌ Submit with a phone number filled → same outcome (resellable, tied to real name). ✅ Submit with only name + email. ✅ Abandon the form entirely. |
| 3 — "The Messages Won't Stop" | Spam texts arrive from an unknown number, following the leak. | ❌ Reply STOP → confirms the number is live, raises its resale value. ❌ Change phone number → treats the symptom; the leaked identity data is still out there. ✅ Block & report the number, then check which accounts are registered to it in Settings. |

**Existing quiz** (`Data Privacy Knowledge Check`, passing score 85%):

1. *Why should a flashlight app not need access to your contacts?* → **That permission has no legitimate connection to its function.** (Easy)
2. *What is a risk of posting travel dates and your address publicly?* → **It signals when your home may be empty.** (Medium)
3. *What should you do with app permission requests that seem unnecessary?* → **Deny them and see if the app still works.** (Easy)
4. *What is one benefit of requesting data deletion from unused accounts?* → **It limits what could be exposed in a future breach.** (Medium)
5. *Why is limiting your audience when sharing photos a good privacy habit?* → **It reduces what a stranger can learn and act on.** (Hard)

---

### 5.5 Online Safety

**File:** `src/data/moduleContent/onlineSafety.js`
**Title:** Online Safety · **Difficulty:** Beginner
**Description (existing, don't change):** "Build safe habits for everyday internet use, from social media to public Wi-Fi and personal device security."

**Quiz must-cover checklist:**
- Declining friend requests from strangers with no mutual connections, reviewing privacy settings
- It's okay to opt out of risky viral challenges regardless of peer pressure
- Correct response to witnessing cyberbullying (leave + report to a trusted adult/moderator)
- Online peer pressure is real and can push unsafe choices just like in-person pressure
- First step if being harassed online (report to a trusted adult or platform moderator)

**Scenario simulation** (already built — the most sensitive module: a stranger friend request, an escalating chat that suggests meeting alone, then the aftermath. This is explicitly the **only** consequence in the whole app depicting harm to a person rather than an account, so the lesson tone here should be especially careful — informative and empowering, not frightening or victim-blaming):

| Scenario | Setup | Choices (✅ = safe) |
|---|---|---|
| 1 — "A New Friend Request" | A friend request from an unrecognized account. Confirming the request *before* inspecting it produces a different, worse outcome than confirming it *after* seeing the same red flags. | ❌ Confirm without checking. ✅ Open the profile first (0 mutual friends, 2-week-old account, 3 posts, photos found elsewhere) — then Delete. ❌ Confirm anyway, *after* having already seen those same red flags — a distinct, worse mistake than never checking at all. |
| 2 — "Making Plans" | A chat, friendly for weeks, suggests meeting alone at a quiet spot today. | ❌ Agree to meet → **"You were meeting someone who was never who they said."** (physical risk; the lesson/feedback is explicit that being targeted is never the student's fault) ✅ Suggest a public place and bring a friend. ❌ Close the chat without replying → keeps you safe today, but the account is untouched and free to target someone else. |
| 3 — "Afterwards" | Deciding what to do about the account afterward. | ❌ Close the app and do nothing. ✅ Screenshot the conversation *first* (evidence), then block, then report — in that order, since blocking first can remove access to the conversation. ❌ Post a public callout confronting them → tips them off to delete the account and start over, and exposes the student's own identity to the same audience. |

**Existing quiz** (`Online Safety Knowledge Check`, passing score 75%):

1. *What should you do with a friend request from a stranger with no mutual connections?* → **Decline and review your profile visibility settings.** (Easy)
2. *Why is it okay to skip a risky viral challenge?* → **Choosing not to participate protects you without needing anyone else's approval.** (Medium)
3. *What is the right response to seeing cyberbullying in a group chat?* → **Leave and report it to a trusted adult or moderator.** (Easy)
4. *Why can peer pressure online still be harmful even though it is not in person?* → **It can encourage unsafe behavior just like in-person pressure.** (Medium)
5. *What is a good first step if you are being harassed online?* → **Report it to a trusted adult or platform moderator.** (Hard)

---

## 6. Style guide (derived from the Password Security example)

- **Second person, direct.** "You'll learn," not "students will learn."
- **Explain *why*, not just *what*.** Every rule should carry its reasoning in the same sentence or the next one.
- **No moralizing, no fear-mongering.** State consequences factually; never imply the reader was foolish. This matters *especially* for Online Safety's scenario 2 — match its established feedback tone: harm is never the student's fault.
- **Five sections, same arc every time:** Introduction → Why It Matters → Characteristics/Mechanics of the threat → Common Attacks/Threats → Summary (the Summary section should close by explicitly bridging into the simulation, e.g. "Next, you'll apply what you've learned in an interactive simulation where...").
- **References must be real.** Prefer: NIST, CISA, official platform/vendor security documentation, well-known nonprofits (Have I Been Pwned, StaySafeOnline, Common Sense Media, National Cyber Security Alliance). Never fabricate a URL.
- **Ground the lesson in the module's own scenario narrative** where natural (e.g. Password Security's lesson mentions credential stuffing, which is both a quiz question *and* literally what happens in that module's ps-02 scenario) — but don't spoil specific scenario mechanics or answers.
