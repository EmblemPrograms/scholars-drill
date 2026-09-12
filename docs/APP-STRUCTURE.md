# Scholars Drill — App Structure, Actors and Access

**Version:** 1.0
**Date:** 12 September 2026
**Companion to:** [PRD.md](PRD.md)
**Stack:** Next.js 16.3.4 App Router, React 19, Tailwind 4, TypeScript

---

## 0. The two decisions this document is built on

### D7 — One question bank, the same API

Scholars Drill gets its **own question bank**, created through the **same API endpoints** the DSA backend already exposes. There is no second backend and no forked question service:

```
POST /api/question-banks      →  create the Scholars Drill bank
POST /api/questions           →  add questions to it (questionBankId)
POST /api/question-banks/:id/import  →  bulk upload (.xlsx / .xls / .csv)
```

DSA's own banks stay where they are. The two products write to the same collections through the same service, separated by `questionBankId`, not by a second codebase.

**What this settles:** ownership and plumbing. Scholars Drill does not inherit DSA's tutor-authored content, and it does not need its own API.

**The shape of a question: now settled.** `Question` carries `examination`, `examinationYear`, `topic`, `subtopic`, `difficulty` and `source`, added 12 September 2026. A bank created with `product: 'scholars-drill'` **requires** examination, year, topic and difficulty on every question and rejects spreadsheet rows without them; DSA's existing banks default to `product: 'dsa'` and treat all six as optional, so nothing of theirs changed. `GET /api/questions` filters on all of them, which is what makes "JAMB, Use of English, 2024" answerable. See PRD **B3**.

### Server-authoritative, always

Scores, timers, entitlements and answer keys live on the server. The Next.js app renders them and never decides them. Every guard in this document exists twice: once in the UI so people do not see doors they cannot open, and once on the server because the UI is not a security boundary.

---

## 1. Actors

Six actors. Five have a signed-in area; the visitor does not.

| # | Actor | Who they are | Where they live |
|---|---|---|---|
| A1 | **Visitor** | Not signed in | `/`, `/login`, `/signup` |
| A2 | **Free student** | Signed up on Scholars Drill, no payment | `/dashboard` and below |
| A3 | **Paid student** | Same as A2 with an active plan | Same routes, more entitlement |
| A4 | **DSA student** | Account created on DSA, signs in here | Same routes as A2/A3, access from DSA enrolment |
| A5 | **Content manager** | Writes and edits questions (`tutor` today) | `/content` |
| A6 | **Admin** | Runs the bank, students and simulations | `/admin` |

A2, A3 and A4 are **one actor with different entitlements**, not three roles. They share every route. The only difference is what the entitlements layer returns, so tier changes never require new pages.

**Parent / guardian (`role: parent`) is out of scope for v1.** The account type exists in the backend; Scholars Drill gives it no area yet.

### Role source

Authorisation reads `roles.scholarsdrill`, never the legacy top-level `role` (PRD blocker **B2**). Until that field exists, treat every signed-in account as a student and **do not ship `/content` or `/admin`**. A DSA `role: admin` must not become a Scholars Drill admin by default.

---

## 2. Access matrix

| Area | A1 Visitor | A2 Free | A3 Paid | A4 DSA | A5 Content | A6 Admin |
|---|---|---|---|---|---|---|
| Marketing pages | Yes | Yes | Yes | Yes | Yes | Yes |
| Sign up, log in, OTP, reset | Yes | Redirected away | Redirected away | Redirected away | Redirected away | Redirected away |
| Onboarding | No | Once | Once | Prefilled from DSA profile | Once | Once |
| Dashboard, profile | No | Yes | Yes | Yes | Yes | Yes |
| Practice modes | No | Capped | Full | Per DSA entitlement | Full | Full |
| Past questions by year | No | Capped | Full | Per DSA entitlement | Full | Full |
| Full CBT simulation | No | Capped | Full | Per DSA entitlement | Full | Full |
| Results, review, history | No | Own only | Own only | Own only | Own only | Own only |
| Performance analytics | No | Basic | Full | Full | Full | Full |
| Report a question | No | Yes | Yes | Yes | Yes | Yes |
| Billing and plans | No | Yes | Yes | Yes | Yes | Yes |
| Write and edit questions | No | No | No | No | Own only | Any |
| Submit bank for review | No | No | No | No | Yes | Yes |
| Approve, publish, archive | No | No | No | No | **No** | Yes |
| Bulk import | No | No | No | No | Own bank | Any |
| Report queue | No | No | No | No | No | Yes |
| Create CBT simulations | No | No | No | No | No | Yes |
| Student management | No | No | No | No | No | Yes |
| Plans and access settings | No | No | No | No | No | Yes |
| Audit log | No | No | No | No | No | Yes |

**"Capped"** is decided by the entitlements layer, never hardcoded in a page. The backend already has the hook: `User.accessLevel` (`free` / `portal` / `tutorial`) plus `AccessSettings` (`freeTests`, `portalTests`, …). Extend that; do not invent a second scheme. Tier naming is still open (PRD **B5**).

**The one rule that must not bend:** a content manager writes and submits, an admin approves and publishes. The same person never does both, or "verified answers" means nothing.

---

## 3. Folder structure

```
scholars-drill/
├─ proxy.ts                          # Next 16: renamed from middleware.ts. Optimistic gate only.
├─ docs/
│  ├─ PRD.md
│  └─ APP-STRUCTURE.md
├─ public/
│  └─ images/
└─ app/
   ├─ layout.tsx                     # root layout, fonts, theme tokens
   ├─ globals.css
   ├─ page.tsx                       # homepage (built)
   ├─ not-found.tsx
   ├─ _components/                   # shared UI. Private folder: never a route.
   │  ├─ ui.ts                       # shared button and container classes
   │  ├─ brand-mark.tsx
   │  ├─ site-header.tsx
   │  ├─ site-footer.tsx
   │  ├─ sample-question.tsx
   │  ├─ practice-modes.tsx
   │  └─ result-preview.tsx
   │
   ├─ (auth)/                        # A1 only. Signed-in users are redirected to /dashboard.
   │  ├─ layout.tsx                  # centred card shell, no app nav
   │  ├─ login/page.tsx
   │  ├─ signup/page.tsx             # blocked on PRD B1 (no free registration endpoint)
   │  ├─ verify/page.tsx             # 4-digit OTP
   │  ├─ forgot-password/page.tsx
   │  └─ reset-password/[token]/page.tsx
   │
   ├─ (student)/                     # A2 A3 A4 (A5 and A6 may also practise)
   │  ├─ layout.tsx                  # requires a session; student nav shell
   │  ├─ onboarding/page.tsx         # exam, year, subjects, target score
   │  ├─ dashboard/page.tsx          # continue practising, recommendations, weak areas
   │  ├─ practice/
   │  │  ├─ page.tsx                 # mode picker
   │  │  ├─ quick/page.tsx           # subject + count
   │  │  ├─ topic/page.tsx           # subject → topic + count
   │  │  ├─ mixed/page.tsx           # across topics
   │  │  └─ past-questions/page.tsx  # exam → subject → year
   │  ├─ cbt/
   │  │  ├─ page.tsx                 # available simulations
   │  │  └─ [quizId]/page.tsx        # setup screen: rules, duration, Start
   │  ├─ attempt/[attemptId]/
   │  │  ├─ page.tsx                 # the runner (see section 4)
   │  │  ├─ result/page.tsx          # score, time, subject and topic breakdown
   │  │  ├─ review/page.tsx          # per-question corrections and explanations
   │  │  └─ _components/
   │  │     ├─ question-view.tsx
   │  │     ├─ option-list.tsx
   │  │     ├─ question-palette.tsx  # answered / flagged / current
   │  │     ├─ countdown.tsx         # displays server time, never owns it
   │  │     ├─ calculator.tsx
   │  │     ├─ submit-dialog.tsx     # "X of Y answered"
   │  │     └─ report-question.tsx
   │  ├─ history/page.tsx
   │  ├─ performance/page.tsx
   │  ├─ bookmarks/page.tsx
   │  ├─ billing/page.tsx            # plans, Paystack, offline proof upload
   │  └─ profile/page.tsx
   │
   ├─ (content)/content/             # A5. Ship only after B2.
   │  ├─ layout.tsx                  # requires roles.scholarsdrill in {content_manager, admin}
   │  ├─ page.tsx                    # my questions, drafts, rejections with feedback
   │  ├─ banks/
   │  │  ├─ page.tsx
   │  │  └─ [bankId]/
   │  │     ├─ page.tsx              # questions in this bank
   │  │     └─ import/page.tsx       # spreadsheet upload, per-row errors
   │  └─ questions/
   │     ├─ new/page.tsx
   │     └─ [questionId]/edit/page.tsx
   │
   ├─ (admin)/admin/                 # A6. Ship only after B2.
   │  ├─ layout.tsx                  # requires roles.scholarsdrill === 'admin'
   │  ├─ page.tsx                    # platform stats
   │  ├─ questions/
   │  │  ├─ page.tsx                 # all questions, filters
   │  │  ├─ review/page.tsx          # approve / reject / request correction
   │  │  └─ reports/page.tsx         # student-reported questions
   │  ├─ quizzes/
   │  │  ├─ page.tsx
   │  │  └─ new/page.tsx             # build and launch a CBT simulation
   │  ├─ students/
   │  │  ├─ page.tsx
   │  │  └─ [userId]/page.tsx        # activity, entitlement, suspend
   │  ├─ plans/page.tsx
   │  ├─ settings/access/page.tsx    # free and paid caps
   │  └─ audit/page.tsx
   │
   └─ api/                           # Route Handlers. A thin BFF, not a second backend.
      ├─ auth/login/route.ts         # proxies DSA login, sets the httpOnly cookie
      ├─ auth/logout/route.ts        # clears the cookie
      └─ session/route.ts            # current user for client components

lib/
├─ api/
│  ├─ client.ts                      # ONE place that builds URLs and attaches the bearer token
│  ├─ auth.ts
│  ├─ question-banks.ts
│  ├─ questions.ts
│  ├─ quizzes.ts
│  ├─ attempts.ts
│  ├─ analytics.ts
│  ├─ notifications.ts
│  └─ payments.ts
├─ auth/
│  ├─ session.ts                     # server-only: read cookie, GET /api/auth/me
│  └─ guards.ts                      # requireSession / requireContent / requireAdmin
├─ entitlements.ts                   # the single access-rule layer (PRD §43)
└─ types/
```

### Why it is grouped this way

- **Route groups `(auth)`, `(student)`, `(content)`, `(admin)` do not appear in URLs.** They exist so each actor gets its own layout and its own guard in one place. A student sees `/dashboard`, not `/student/dashboard`.
- **`(content)` and `(admin)` keep a real path segment** (`/content`, `/admin`) because those URLs should be obvious and easy to block at the edge.
- **`_components` is a private folder.** The underscore keeps it out of routing, so UI can sit beside the route that uses it. Attempt-specific components live under `attempt/[attemptId]/_components/`; anything shared moves up to `app/_components/`.
- **`app/api/` is only what the browser must not do itself:** exchanging a password for a token and storing it in an `httpOnly` cookie. Everything else calls the DSA API directly from server components through `lib/api/`.
- **One API client.** `lib/api/client.ts` is the only file that knows `NEXT_PUBLIC_API_URL` and how to append `/api`. DSA's codebase carries a bug from doing this per-file; one client makes that impossible.

---

## 4. The quiz

### 4.1 Two runners, one engine

| | Practice | CBT simulation |
|---|---|---|
| Assembled | On demand from filters | Pre-built by an admin |
| Timer | None | Server countdown, auto-submit |
| Feedback | After each question | After submission only |
| Navigation | Next, previous | Palette, flag, jump |
| Route | `/practice/...` → `/attempt/[attemptId]` | `/cbt/[quizId]` → `/attempt/[attemptId]` |

Both end in the same runner and the same attempt record, so scoring, review and history are written once.

### 4.2 Flow

```
  pick a mode                     pick a simulation
  /practice/quick                 /cbt/[quizId]
        │                               │
        └───────────┬───────────────────┘
                    ▼
        POST  create attempt          server freezes question order,
                                      option order and the answer key
                    ▼
        /attempt/[attemptId]          runner: question, options, palette,
                    │                 countdown (CBT), flag, calculator
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
  save answer   save answer   save answer     one call per answer, debounced,
   (per pick)    (per pick)    (per pick)     queued offline and retried
      └─────────────┼─────────────┘
                    ▼
        submit  (manual, or auto when the clock hits zero)
                    ▼
        /attempt/[attemptId]/result      score, %, time used, per subject
                    ▼                    and per topic breakdown
        /attempt/[attemptId]/review      each question, your answer, the
                                         correct answer, the working
```

### 4.3 Endpoints

The attempt endpoints already exist and already do the hard parts:

```
POST   /api/quizzes/:id/attempts                          start
GET    /api/quizzes/:id/attempts/:attemptId               resume
POST   /api/quizzes/:id/attempts/:attemptId/answers       save one answer
POST   /api/quizzes/:id/attempts/:attemptId/submit        submit
GET    /api/quizzes/:id/attempts/:attemptId/corrections   review
```

`QuizAttempt` stores `expiresAt`, a frozen `questionOrder`, an `optionOrder` map, `presentedQuestions` without answers, and a separate `answerKey` the client never receives before submission. Statuses are `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `EXPIRED`.

**The missing piece is assembly.** Every call above needs a `:id` for a quiz an admin already created. Quick, topic, mixed and past-question practice are assembled per student, on demand. Recommended: a `POST /api/practice/sessions` that takes `{ subject, topic, examination, year, difficulty, count }`, materialises a hidden single-student quiz and returns an attempt, so all five endpoints above are reused unchanged. See PRD §2.2.

### 4.4 The CBT runner looks and behaves like JAMB

A candidate should sit down in front of Scholars Drill and recognise it. The
simulation copies the real UTME interface, because practising on a different
layout is practising the wrong thing.

**Layout**

```
┌──────────────────────────────────────────────────────────────┐
│ Name · Reg no.                                    01:47:12   │   timer, always visible
├──────────────────────────────────────────────────────────────┤
│ [ English ] [ Mathematics ] [ Physics ] [ Chemistry ]        │   subject tabs, switch freely
├──────────────────────────────────────────────────────────────┤
│  Question 14 of 60                                           │
│                                                              │
│  A body starts from rest and accelerates uniformly...        │
│                                                              │
│   ( ) A.  0 m/s                                              │
│   (o) B.  5 m/s                                              │
│   ( ) C.  10 m/s                                             │
│   ( ) D.  20 m/s                                             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  1  2  3  4  5  6  7  8  9 10 11 12 13 [14] 15 ...           │   per-subject grid
│  ← Previous            Next →                    Submit      │
└──────────────────────────────────────────────────────────────┘
```

**Rules taken from the real thing**

1. **Four options, A to D**, shown as radio buttons with the letter beside each.
2. **Subject tabs.** One sitting spans several subjects and the candidate moves
   between them at will. No backend change is needed: an attempt's
   `presentedQuestions` already carry `subjectId`, so tabs are a grouping of one
   attempt, never four separate attempts.
3. **One countdown for the whole sitting**, not per subject or per question.
4. **A numbered grid per subject**, showing answered against unanswered, with
   any number clickable to jump straight there.
5. **No feedback during the exam.** No right or wrong, no explanation, no score
   until submission. Practice mode is where feedback lives.
6. **The score appears immediately on submit**, as it does at a JAMB centre.
7. **Keyboard**: `A` to `D` select, arrow keys or `P` and `N` move, and the
   grid is reachable by Tab. Many candidates practise on a laptop.
8. **Mobile is not a shrunken desktop.** Subject tabs scroll horizontally, the
   grid becomes a bottom sheet, and the timer stays pinned. The question and
   its options never require a horizontal scroll.

**Default UTME shape**, admin-configurable per simulation: four subjects,
English 60 questions and 40 each for the rest, 180 in total, 120 minutes.

**Known gap: shared passages.** JAMB's Use of English puts one comprehension
passage in front of several questions, and cloze tests share an instruction
across a run of them. `Question` has no `passage` or `instruction` field, so
today each question would have to repeat the passage in its own text. That is
workable but ugly, and it breaks "read the passage once". Recommended before
English content is loaded: add an optional `passage` (or a `QuestionGroup` the
questions point at) so the runner can render it once above a run of questions.

### 4.5 Rules the runner must not break

1. The countdown displays server time. It never decides when time is up; the server does, on submit.
2. Answer keys and explanations are never in a response before submission.
3. The client never computes or sends a score.
4. Every answer is saved as it is picked. Navigating, refreshing or reopening resumes an `IN_PROGRESS` attempt.
5. Offline answers queue locally and sync on reconnect.
6. One attempt produces exactly one valid submission. Second submits are rejected.
7. One live attempt per student per quiz. A second tab joins the same attempt, it does not start another.
8. Every question carries a report control, in practice and in review.

---

## 5. Enforcement

Three layers, in order:

1. **`proxy.ts`** (Next 16; this was `middleware.ts` before). An optimistic check only: is there a session cookie? If not, redirect `/dashboard`, `/content`, `/admin` to `/login`. The Next.js docs are explicit that proxy is not a session or authorisation solution, so it never reads roles from the client or makes it the last word.
2. **Group layouts.** `(student)/layout.tsx`, `(content)/layout.tsx` and `(admin)/layout.tsx` call `lib/auth/guards.ts`, which fetches `GET /api/auth/me` server-side and redirects when the role does not match. This is what stops a URL typed by hand.
3. **The API.** Every privileged call is re-authorised by the backend against the real role. If layers 1 and 2 were removed, nothing would leak. That is the test for whether they are written correctly.

Entitlement caps (free vs paid) resolve in `lib/entitlements.ts` from the user's `accessLevel` plus `AccessSettings`, and are enforced by the API on the request that matters. A page never hardcodes "free users get 3".

---

## 6. Build order

| Step | What | Blocked by |
|---|---|---|
| 1 | `(auth)` login, API client, session cookie, `proxy.ts` | Nothing. Login works against the live API today |
| 2 | `(student)` shell, onboarding, dashboard | Step 1 |
| 3 | Scholars Drill question bank created through the existing endpoints | Nothing |
| 4 | ~~Question fields: exam, year, topic, subtopic, difficulty, source~~ **Done 12 Sep 2026** | Shipped |
| 5 | CBT simulation runner on the existing attempt endpoints | Step 2 |
| 6 | Practice assembly, then the four practice modes | §4.3 endpoint |
| 7 | Results, review, history, performance | Step 5 |
| 8 | Signup and free registration | **B1** |
| 9 | `(content)` and `(admin)` | **B2** |
| 10 | Billing | **B5** |

Steps 1, 2, 3 and 5 are buildable now. Nothing in `(content)` or `(admin)` should ship before roles are namespaced, or a DSA admin silently becomes a Scholars Drill admin.
