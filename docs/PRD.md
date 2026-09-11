# Scholars Drill — Product Requirements Document

**Version:** 1.2 — Integration-Grounded Draft
**Date:** 11 September 2026
**Supersedes:** `ScholarDrill_PRD_v1.1_Dev_Ready.pdf` (product spec) and `distingushed-scholars-academy/docs/Scholars-Drill-PRD.md` (identity spec)
**Repository:** `wamp64/www/scholars-drill` — Next.js 16.3.4, React 19.2.8, Tailwind 4, TypeScript
**Backend:** the existing DSA API — `https://api.distinguishedscholarsacademy.com`, Swagger at `/api-docs`

---

## 0. Basis of this document

### 0.1 What this version adds

v1.1 was written as a product spec and closed with ten Open Items, several of which said "not yet defined." Those items are no longer open in the abstract — the backend that Scholars Drill will run on **already exists and was read for this document**: `wamp64/www/dsa_backend`, an Express + Mongoose service, plus its live frontend consumer `wamp64/www/distingushed-scholars-academy`.

So this version does three things v1.1 could not:

1. Answers the Open Items that the backend already answers, with file references.
2. Names precisely which endpoints Scholars Drill **reuses as-is**, which need **extension**, and which must be **built from nothing**.
3. Isolates the small number of hard blockers that stop v1 from being buildable at all.

Everything in the v1.1 PDF that is not contradicted below still stands. This document does not restate the feature narrative — it makes it executable.

### 0.2 Decisions confirmed

| # | Decision |
|---|---|
| D1 | Scholars Drill is a **separate Next.js application** with its own codebase and its own domain |
| D2 | It consumes the **same REST API** as DSA — `https://api.distinguishedscholarsacademy.com/api` — and the same MongoDB Atlas database behind it |
| D3 | Scholars Drill **never implements its own auth**: no password hashing, no token signing, no session store. It calls `/api/auth/*` and holds the returned JWT |
| D4 | A DSA student signs in to Scholars Drill with their existing DSA credentials. No second signup, no forced password reset |
| D5 | Scores, timers, and entitlements are **server-authoritative**. The client is never trusted with any of them |
| D6 | The independent national candidate (no DSA relationship) signs up **free** — this is the growth model, and it is currently impossible (see B1) |

### 0.3 Naming

The PDF says **Scholars Drill**, the DSA docs say **Scholars Drill**, the repo is `scholars-drill`, and the DSA frontend ships routes under `quiz360pro`. Four names for one product. This document uses **Scholars Drill** throughout; the name needs one owner's decision before any user-facing copy is written. *(Open Item #11.)*

---

## 1. Integration architecture

### 1.1 The contract

```
┌────────────────────┐         ┌────────────────────┐
│  DSA frontend      │         │  Scholars Drill      │
│  Next.js           │         │  Next.js 16        │
│  dsa.com           │         │  scholarsdrill.com  │
└─────────┬──────────┘         └─────────┬──────────┘
          │                              │
          │   HTTPS + Bearer JWT         │
          └──────────────┬───────────────┘
                         ▼
        ┌────────────────────────────────────┐
        │  DSA API (Express)                 │
        │  api.distinguishedscholarsacademy  │
        │  .com/api/*   ·  Swagger /api-docs │
        └────────────────┬───────────────────┘
                         ▼
              ┌────────────────────┐
              │  MongoDB Atlas     │
              │  shared `users`    │
              └────────────────────┘
```

**Environment variable, matching DSA's own convention** (`distingushed-scholars-academy/.env.example`):

```
NEXT_PUBLIC_API_URL=https://api.distinguishedscholarsacademy.com
```

Origin only — **no trailing `/api`**. DSA's own codebase carries a warning about this: its admin clients append `/api` per path and a base ending in `/api` produces `/api/api/...` and a 404 on admin login. Scholars Drill adopts a single API client that normalises the base once, so the mistake cannot be repeated per-file.

### 1.2 Auth flow

| Step | Call | Notes |
|---|---|---|
| Sign in | `POST /api/auth/login` | Email + password → JWT |
| Session | `Authorization: Bearer <jwt>` | On every authenticated request |
| Identity | `GET /api/auth/me` | Populates the Scholars Drill session |
| Sign up | `POST /api/auth/register` | **Blocked — see B1** |
| Verify | `POST /api/auth/verify-otp` | 4-digit OTP by email → `status: active` |
| Resend | `POST /api/auth/send-otp` \| `/resend-otp` | |
| Forgot | `POST /api/auth/forgot-password` | |
| Reset | `POST /api/auth/reset-password/:token` | Token expires in 10 minutes |
| Profile | `PUT /api/auth/updatedetails` | |
| Password | `PUT /api/auth/updatepassword` | |

There is **no Google OAuth** and no social login. Password only.

**"Same login" means shared credentials, not silent SSO.** Separate domains cannot share cookies. A student signed in on DSA who opens Scholars Drill signs in again with the same email and password. Cross-domain token handoff is a Phase 2 decision, not v1.

**Token storage.** The JWT must not be readable by page scripts. Store it in an `httpOnly`, `Secure`, `SameSite=Lax` cookie set by a Scholars Drill route handler that proxies `/api/auth/login`; the browser never holds the raw token. This is a deliberate departure from DSA's current client-side pattern.

### 1.3 What the account record actually looks like

From `dsa_backend/models/User.js`:

| Field | Values | Relevance to Scholars Drill |
|---|---|---|
| `email` | unique, lowercased, trimmed | The cross-product identity key |
| `role` | `student` \| `admin` \| `moderator` \| `guardian` \| `tutor` \| `parent` \| `staff` | **Single string — see B2** |
| `status` | `pending_payment` \| `pending_otp` \| `active` \| `payment_failed` \| `suspended` \| `deleted` | `protect` rejects suspended/deleted at the middleware |
| `accessLevel` | `free` \| `portal` \| `tutorial` | The entitlements hook already exists |
| `paymentStatus` | `none` \| `pending-offline` \| `active` \| `expired` \| `disabled` | |
| `accessEnabled` | boolean | Admin kill-switch per user |
| `studentId` | `DSA/2026-XXXXXX` | Unique, sparse. Issued **only** on DSA registration |
| `programmes` | `["JAMB","WAEC"]` | Required for students |
| `examTrack`, `department`, `currentLevel`, `learningMode` | | Prefill Scholars Drill onboarding from these |
| `staffRoleId` → `StaffRole.permissions[]` | | A real permission system, already built |

`studentId` is a **DSA enrolment attribute**, not a universal user id. A free Scholars Drill signup must not receive one — guardian linking (`linkedStudentId`) and class rosters key on it. Note also that `isDsaStudent` in the DSA frontend means *physical vs online study mode*; it does not mean "came from DSA." Do not reuse it for product origin.

---

## 2. Endpoint inventory

### 2.1 Reuse as-is

| Capability | Endpoints | PDF section |
|---|---|---|
| Auth, OTP, password reset | `/api/auth/*` | 4 |
| Current user | `GET /api/auth/me` | 4, 28 |
| Image upload signing (Cloudinary) | `POST /api/uploads/sign` | 33, Open #6 |
| In-app notifications | `GET /api/notifications`, `PATCH /:id/read`, `PATCH /read-all` | 27 |
| Payment initiation (Paystack) | `POST /api/payments/online` | 43, Open #4 |
| Offline payment with proof | `POST /api/payments/offline` | 43 |
| Plan catalogue | `GET /api/plans` | 43 |
| Student self-analytics | `GET /api/analytics/me` | 17, 18 |
| Admin user management | `GET /api/admin/users`, `PATCH /users/:id/status`, `PATCH /users/:id`, `DELETE /users/:id` | 31 |
| Admin entitlement override | `PATCH /api/admin/users/:id/access`, `GET\|PATCH /api/admin/settings/access` | 43 |
| Admin plan CRUD | `GET\|POST\|PATCH\|DELETE /api/admin/plans` | 43 |
| Admin platform stats | `GET /api/admin/stats` | 30 |
| Staff role/permission CRUD | `GET\|POST\|PUT\|DELETE /api/admin/roles` | 3.3 |

### 2.2 The CBT engine — reuse the mechanism, replace the assembly

`dsa_backend/models/QuizAttempt.js` is genuinely good, and it already satisfies most of PDF sections 12, 13, 14 and 44:

| PDF requirement | Already implemented |
|---|---|
| §13 server-side timer as source of truth | `expiresAt` set server-side at `startAttempt` |
| §12 answers save immediately, survive navigation | `POST /:id/attempts/:attemptId/answers` — incremental per-question save |
| §12 autosave | Same endpoint; client debounces |
| §14 auto-submit at zero | `AUTO_SUBMITTED` status in the enum |
| §44 duplicate submissions | Attempt status machine `IN_PROGRESS → SUBMITTED` |
| §44 timer manipulation | `answerKey[]` stored server-side only, never sent before submit |
| §11 stable question/option order | Frozen `questionOrder[]` and `optionOrder` map per attempt |
| §16 question review | `GET /:id/attempts/:attemptId/corrections` |

Attempt endpoints, all under `/api/quizzes`:

```
POST   /:id/attempts                          start
GET    /:id/attempts/:attemptId               resume
POST   /:id/attempts/:attemptId/answers       save one answer
POST   /:id/attempts/:attemptId/submit        submit
GET    /:id/attempts/:attemptId/corrections   review
```

**The gap is assembly, not execution.** Every one of those calls needs an `:id` — an existing `Quiz` document authored in advance by an admin, reached by `accessLink` + `accessCode`. Scholars Drill's Quick Drill, Topic Practice and Mixed Practice (§9.1–9.3) assemble a session **on demand from filters**, for one student, at the moment they tap "Continue Practising."

Two ways out, and the backend team picks one:

- **(a) Ephemeral quiz** — a `POST /api/practice/sessions` that takes `{ subject, topic, examination, year, difficulty, count }`, materialises a hidden single-student `Quiz`, and returns an attempt. Maximum reuse of everything above; adds throwaway `Quiz` documents.
- **(b) First-class `PracticeSession`** — a sibling collection with the same attempt semantics and no `Quiz` parent. Cleaner model; duplicates the attempt state machine.

**(a) is the recommendation.** It ships v1 on a state machine that already works, and (b) can be a later refactor behind the same client-facing endpoint.

Full CBT Simulation (§9.5) is admin-configured with fixed subjects, duration and distribution — that is the existing `Quiz` model almost unchanged, and it should use it directly.

### 2.3 Extend

| # | Endpoint | Extension needed |
|---|---|---|
| E1 | `POST /api/auth/register` | A no-payment path (B1) |
| E2 | `/api/questions`, `/api/question-banks` | Exam / year / difficulty / subtopic / source fields + filtering (B3) |
| E3 | `GET /api/analytics/me` | Per-subject and per-topic breakdown, accuracy trend over time (§17, §18) |
| E4 | `GET /api/admin/stats` | DAU, WAU, retention, challenge participation (§30, §39) |
| E5 | `GET /api/notifications` | Trigger types for drill/streak/challenge/achievement (§27) |
| E6 | `GET /api/plans` | Scholars Drill plan kinds alongside `portal`/`tutorial` (B5) |
| E7 | CORS allowlist in `dsa_backend/app.js` | **Scholars Drill's origins are not in it (B6)** |

### 2.4 Build from nothing

None of the following exists in the backend today. Each needs a model, endpoints, and Swagger entries.

| Domain | PDF §§ | New entities |
|---|---|---|
| Practice sessions | 9.1–9.4 | `PracticeSession` (or ephemeral quiz per 2.2a) |
| Subject/topic taxonomy | 7, 9 | `Subject`, `Topic`, `Subtopic` — currently free-text strings |
| XP economy | 20, 21 | `XpLedger`, `XpRule` (admin-configurable), level thresholds |
| Streaks | 22 | `Streak` with a defined qualifying activity |
| Badges | 23 | `Badge`, `UserBadge` |
| Daily drill | 24 | `DailyDrill` |
| Weekly challenge | 25 | `Challenge`, `ChallengeEntry` |
| Global leaderboard | 26 | `LeaderboardSnapshot` — weekly / monthly / all-time |
| Recommendations | 6, 19 | `WeakArea` derivation + `Recommendation` |
| Question reports | trust model | `QuestionReport` + review queue |
| AI explanations | 41 | `AiExplanation` cache keyed by (questionId, chosenOption) |
| Question analytics | 40 | Attempt/correct/avg-time/skip aggregates per question |

The existing `GET /api/quizzes/:id/leaderboard` is **per-quiz**, not the weekly/monthly/all-time global board §26 describes. It is not a substitute.

---

## 3. Blockers

These stop v1. Each needs a decision before the corresponding sprint starts, not during it.

### B1 — There is no way to create a free account

`dsa_backend/controllers/authController.js` → `exports.register`:

```js
const amount = parseFrontendPrice(price);   // must be an integer > 0, in kobo
...
status: 'pending_payment'
```

Registration requires a price, initialises Paystack, and parks the user at `pending_payment`. **No payment, no account.** `accessLevel` defaults to `'free'` but registration never lands a user there — the only routes to an active account today are a successful Paystack webhook, an offline payment with proof, or admin creation via `POST /api/admin/students`.

D6 — the entire national growth model — is free signup. So Scholars Drill cannot use `POST /api/auth/register` as it stands.

**Required:** a registration path producing `register → pending_otp → verify-otp → active` with `accessLevel: 'free'` and **no payment step**. Whether that is a new endpoint, a `product: 'scholars-drill'` parameter, or a `price: 0` branch is the backend team's call. Two constraints are not negotiable:

- The resulting account is a first-class `User`, not a lesser record.
- It carries **no `studentId` and no DSA enrolment**. Free Scholars Drill signup must never become a back door into DSA's paid portal.

*Severity: blocks all of P2 acquisition. Owner: backend.*

### B2 — One `role` string means a DSA admin is a Scholars Drill admin on day one

Every account carries a single `role`. `middleware/auth.js` → `authorize(...roles)` compares that one string. If Scholars Drill checks `role === 'admin'`, every DSA administrator — and anyone reaching DSA's admin bypass — becomes a national platform administrator with question-publishing rights the moment Scholars Drill launches.

Compounding it: DSA's live `.env.local` carries `NEXT_PUBLIC_ENABLE_ADMIN_BYPASS=true`, and its `admin_token` cookie is the literal string `true`, not a JWT. That is a DSA problem today. Once two products share one `users` collection it is Scholars Drill's problem too.

**Required, before launch:**

```js
roles: {
  dsa:          'student'|'tutor'|'parent'|'staff'|'admin'|'super_admin'|null,
  scholarsdrill: 'student'|'content_manager'|'admin'|null
}
```

- Scholars Drill authorises **only** on `roles.scholarsdrill` and never reads the legacy top-level `role`.
- `role` stays populated as a compatibility field for the un-migrated DSA frontend.
- Cross-product rights are granted explicitly, never inherited.
- The admin bypass is disabled and the code removed.

The `StaffRole.permissions[]` system already in the backend is the right shape for §3.3's "restricted admin" Content Manager — reuse it rather than inventing a parallel scheme.

*Severity: privilege escalation across products. Owner: backend + DSA frontend.*

### B3 — The question bank cannot express a past question

PDF §7 requires per question: subject, **topic, subtopic, examination, examination year, difficulty**, source, and a five-state status. What actually exists:

**`models/BankQuestion.js`** (flat, tutor Excel imports):
`subject`, `topic`, `body`, `options[]`, `correctAnswer`, `explanation`, `imageUrl`, `mark`, `createdBy`, `batchName`.
→ no examination, no year, no difficulty, no subtopic, no source, **no status at all**.

**`models/Question.js`** (v2, bank-scoped):
`questionBankId`, `subjectId`, `subject`, `questionText`, `questionType`, `imageUrl`, `marks`, `options[{text,isCorrect,explanation}]`, `status`.
→ no topic, no examination, no year, no difficulty, no source. Status is `DRAFT | ACTIVE | ARCHIVED` — three states where §7 needs five (`Draft → Under Review → Approved → Published → Archived`).

**Consequence:** §9.4 Past Questions — "JAMB → English → 2024" — is **not implementable** on today's schema. Neither is difficulty-based selection (§10), difficulty analytics (§40), or the topic-level weak-area detection (§6, §19) that the entire recommendation engine depends on.

This is the largest single gap in the whole project, and it is upstream of most of the product. It also forces a decision the backend has so far avoided: **`BankQuestion` and `Question` are two competing question models.** Scholars Drill should target exactly one — v2 `Question`, extended — and the flat `BankQuestion` should be migrated or explicitly frozen as legacy tutor import only.

Subject and topic are currently free-text strings with no controlled vocabulary. "Maths", "Mathematics" and "mathematics" are three subjects. A taxonomy has to land with this work or the filters will be unusable at scale.

*Severity: blocks §9.4, §10, §19, §40 and the recommendation engine. Owner: backend.*

### B4 — Nothing behind the gamification layer exists

XP, levels, streaks, badges, daily drills, weekly challenges and the global leaderboard (§20–§26) have **no model, no endpoint, no stored state**. Roughly a third of the PDF describes a subsystem that is entirely greenfield.

This is not a blocker in the sense of being wrong — it is a blocker in the sense of being **unscoped**. Treated as "part of v1" it will consume the schedule that the CBT engine needs. See the release split in §4.

Two design constraints worth fixing now, because retrofitting them is painful:

- §22 — a streak's qualifying activity must be defined precisely and be non-trivial (e.g. *completing* at least one drill of ≥10 questions per calendar day, in a stated timezone), or streaks inflate on opening the app.
- §26 — ranking on accuracy and qualified XP, never raw attempt volume, or the board is won by whoever clicks most.

*Severity: scope. Owner: product, then backend.*

### B5 — Two incompatible pricing models

The PDF states one-time pricing: **Gold ₦2,000, Platinum ₦4,000**. The backend's `PaymentPlan` has `kind: 'portal' | 'tutorial'`, `grantsLevel: 'portal' | 'tutorial'`, `durationMonths`, and a `track` scoping plans to a programme. `User.accessLevel` is `free | portal | tutorial`.

There is no Gold, no Platinum, and the model is duration-based where the PDF is one-time. `durationMonths: 0` can express "one-time," so the mechanism fits — but the tier names, what each grants, and whether Scholars Drill tiers are separate from DSA's portal/tutorial levels all need a product decision before the paywall is coded.

**The important part is architectural, and the PDF gets it right (§43):** access rules live in **one entitlements layer**, not scattered through the app. `AccessSettings` (`freeTests`, `freeMaterials`, `freeLiveClasses`, and the `portal*` equivalents) is already that layer. Extend it — do not build a second one.

*Severity: blocks the paywall. Owner: product.*

### B6 — Scholars Drill's origin is not in the CORS allowlist

`dsa_backend/app.js`:

```js
app.use(cors({
    origin: [
        'https://distinguished-scholars-academy.vercel.app',
        'http://localhost:3000',
        'https://distinguishedscholarsacademy.com'
    ]
}));
```

Every browser call from Scholars Drill fails until its production domain, its preview domains, and its local dev port are added. DSA already occupies `localhost:3000`, so Scholars Drill dev needs its own port (`3001`) added explicitly.

Small, cheap, and a guaranteed day-one halt if it is not done first.

*Severity: trivial to fix, blocks all local development. Owner: backend.*

---

## 4. Release scope

The PDF's 47 sections are the full product. They are not one release. The split below protects the thing the product cannot be wrong about — question accuracy and exam-condition practice — from being crowded out by XP mechanics.

### v1 — Practice that works and can be trusted

- Shared login against `/api/auth/*` (§4)
- Free registration (B1)
- Onboarding: exam, year, subjects, target score (§5)
- Question bank with exam / year / topic / difficulty and the five-state workflow (§7, B3)
- Quick Drill, Topic Practice, Mixed Practice, Past Questions (§9.1–9.4)
- Full CBT Simulation on the existing `Quiz` model (§9.5)
- Quiz setup, interface, palette, flagging (§10, §11)
- Answer autosave, offline tolerance, server timer, submission and timeout (§12–§14)
- Results, question review, subject/topic breakdown (§15–§17)
- Admin: student management, question CRUD, bulk import, review workflow (§31–§36)
- Question reporting and the review queue
- Free vs paid entitlements through one layer (§43, B5)
- Edge cases (§44), responsive (§45), security (§47)

### v1.1 — Feedback loops

- Performance trend (§18)
- Personal recommendations and weak areas (§6, §19)
- AI explanation engine, cached, student-triggered, grounded in the stored answer (§41)
- Question analytics (§40)
- Admin analytics beyond `GET /api/admin/stats` (§39)

### v2 — Engagement

- XP, levels, streaks, badges (§20–§23)
- Daily drill, weekly challenge (§24, §25)
- Global leaderboard (§26)
- Notification triggers beyond in-app (§27)

### Later

- AI personalised study plan (§42) — the data layer is designed for it in v1, the feature is not built
- Institutional/school accounts
- Cross-domain silent SSO

---

## 5. Requirements

### 5.1 Identity

| ID | Requirement | Priority |
|---|---|---|
| R-1 | One `users` record per person, shared by both products | Must |
| R-2 | Scholars Drill consumes `/api/auth/*` and never writes credentials, hashes or tokens | Must |
| R-3 | Existing DSA credentials authenticate unchanged — no forced reset (D4) | Must |
| R-4 | A free registration path creating an `active` account with no payment | **Blocker (B1)** |
| R-5 | Free registration issues no `studentId` and no DSA enrolment | Must |
| R-6 | Product-namespaced roles; Scholars Drill reads only `roles.scholarsdrill` | **Blocker (B2)** |
| R-7 | `NEXT_PUBLIC_ENABLE_ADMIN_BYPASS` disabled and the bypass code removed before launch | **Blocker (B2)** |
| R-8 | The JWT is held in an `httpOnly` `Secure` `SameSite=Lax` cookie, never in `localStorage` | Must |
| R-9 | A signup with an existing email is handled as a sign-in prompt, never a duplicate or a bare error | Must |
| R-10 | An account already `active` is not asked to re-verify OTP on the second product | Must |
| R-11 | Password change or reset invalidates sessions on both products | Must |
| R-12 | Rate limiting on login, registration and password reset, per IP and per account | Must |
| R-13 | Cross-domain silent SSO is explicitly **not** in v1 | Constraint |

### 5.2 Question bank

| ID | Requirement | Priority |
|---|---|---|
| R-14 | One question model. v2 `Question` extended; `BankQuestion` migrated or frozen as legacy | **Blocker (B3)** |
| R-15 | Questions carry examination, examination year, topic, subtopic, difficulty and source | **Blocker (B3)** |
| R-16 | Status `Draft → Under Review → Approved → Published → Archived`; only `Published` is served to students | Must |
| R-17 | A controlled subject/topic taxonomy replaces free-text strings | Must |
| R-18 | Every question in the student UI carries a report control; N reports removes it from the servable pool | Must |
| R-19 | Approval records reviewer identity and timestamp in `AuditLog` | Must |
| R-20 | Bulk import validates, reports per-row errors, rejects duplicates, and returns a summary (§35) | Must |
| R-21 | Images are Cloudinary URLs via `POST /api/uploads/sign` — never base64 (matches existing backend rule) | Must |

### 5.3 Practice and CBT

| ID | Requirement | Priority |
|---|---|---|
| R-22 | Sessions assemble on demand from filters (2.2a) | Must |
| R-23 | The server is the sole authority on elapsed time and expiry | Must |
| R-24 | Answers persist per-question as they are chosen; navigation never discards one | Must |
| R-25 | Connectivity loss preserves answers locally and syncs on reconnect (§12) | Must |
| R-26 | Refresh or reopen resumes an `IN_PROGRESS` attempt within its window | Must |
| R-27 | Concurrent attempts on the same session across tabs or devices are prevented | Must |
| R-28 | One attempt yields exactly one valid submission | Must |
| R-29 | Scores are computed and stored server-side; a client-supplied score is never accepted | Must |
| R-30 | Answer keys and explanations are withheld from all responses until submission | Must |
| R-31 | Submissions after a challenge closes are rejected | Must |

### 5.4 Platform

| ID | Requirement | Priority |
|---|---|---|
| R-32 | Scholars Drill's origins are in the API CORS allowlist | **Blocker (B6)** |
| R-33 | Every privileged action is re-validated server-side against role and permissions (§47) | Must |
| R-34 | Privileged actions are written to `AuditLog` — who, what, when | Must |
| R-35 | All list endpoints paginate; question lists are indexed on the filter fields | Must |
| R-36 | Access rules resolve through a single entitlements layer, never hardcoded per feature | Must |
| R-37 | The mobile quiz experience is designed for mobile, not a scaled desktop layout, and tested on devices | Must |
| R-38 | Secrets never reach the client or source control; only `NEXT_PUBLIC_*` values ship to the browser | Must |

---

## 6. Open Items

### 6.1 Resolved by reading the backend

| # (v1.1) | Item | Resolution |
|---|---|---|
| 2 | Tech stack & API design | Express + Mongoose + MongoDB Atlas, REST, Swagger at `/api-docs`. Frontend Next.js 16.3.4 / React 19 / Tailwind 4 |
| 3 | DSA account linking | Shared `users` collection; shared credentials via `/api/auth/login`. Not SSO — see 1.2 |
| 4 | Payment gateway | **Paystack**, already integrated: `POST /api/payments/online`, signed webhook, plus an offline path with proof upload. *Tier naming and one-time-vs-duration remain open — B5* |
| 6 | Image/diagram storage | **Cloudinary**, signed uploads via `POST /api/uploads/sign`. *Size limits and accepted formats still need sign-off* |
| 8 | Audit trail | `models/AuditLog.js` exists. *Scope of what gets logged still needs sign-off — R-34* |

### 6.2 Partially resolved

| # | Item | State |
|---|---|---|
| 1 | Data model | `User`, `Question`, `QuestionBank`, `Quiz`, `QuizAttempt`, `PaymentPlan`, `Notification`, `AuditLog`, `AccessSettings`, `StaffRole` exist. Everything in §2.4 does not |
| 7 | Notification channel | In-app exists (`Notification` + `/api/notifications`). Push / SMS / email fan-out for §27 triggers is undecided |

### 6.3 Still open

| # | Item |
|---|---|
| 5 | **CBT anti-cheating.** No handling for tab-switching, multi-device concurrent login, or screen recording during timed exams. Note this trades against §12's offline tolerance — decide the balance deliberately |
| 9 | **NDPR compliance.** The platform collects phone, email, exam year and performance history on minors. Consent capture, retention period and deletion rights are unaddressed. `status: 'deleted'` is a soft delete — it does not satisfy a deletion request |
| 10 | **Environments & QA.** No staging/production separation. The API's CORS list points at one Vercel preview and production. New questions have no pre-publish test gate |
| 11 | **Product name.** Scholars Drill / Scholars Drill / Quiz360Pro / scholars-drill — four names, no decision |
| 12 | **Quiz360Pro overlap.** The DSA frontend already ships `/quiz360pro`, `/rapid-quiz`, `/dashboard/quiz360`, `/dashboard/simulator`, `/dashboard/community`, `/dashboard/rankings`. Either extract them into Scholars Drill or keep them in DSA — but leaving both is how two divergent CBT implementations happen |
| 13 | **Backend ownership.** Scholars Drill needs roughly a dozen new collections and several endpoint extensions in a repository owned by the DSA team. Who writes them, against what schedule, and how are breaking changes to shared endpoints coordinated? |

---

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| B3 slips | §9.4, §19, §40 and the recommendation engine all slip with it | Schedule the schema extension in sprint 1, before any practice UI |
| Free registration never lands | No national growth; the product is a DSA add-on | Escalate B1 now — it is a one-endpoint change with a large blast radius |
| Wrong answers in the bank | The one failure a practice app cannot survive; it is the stated reason students distrust the incumbents | Five-state workflow, reviewer recorded, report control on every question, only `Published` served |
| AI explains a wrong answer confidently | Amplifies the above | Ground explanations in the stored verified answer; the model is never the source of truth; degrade to the stored explanation on failure |
| Two apps writing one `users` document | Silent field clobbering | Field-level atomic updates only; one owning service per field |
| DSA admin bypass reaches Scholars Drill | National platform admin for anyone who finds it | B2, before launch, not after |
| Gamification absorbs the v1 schedule | CBT ships late and thin | The §4 split; XP is v2 |

---

## 8. Next steps

1. **Decisions needed from product** — B5 tier definition, Open Items #11 (name), #12 (Quiz360Pro overlap), #13 (backend ownership), and the §22 streak definition.
2. **Decisions needed from backend** — B1 registration shape, B2 role namespacing, B3 question schema and which model wins, and 2.2 (a) vs (b) for practice sessions.
3. **Fix immediately** — B6, the CORS allowlist. It costs one line and unblocks all local work.
4. **Then** — data model and API contract for §2.4, reviewed against this document before any Scholars Drill UI is written.

Nothing in the Scholars Drill client should be built against an endpoint that does not yet exist. Where a v1 feature depends on one, the contract is agreed first and mocked behind the shared API client.

---

*End of v1.2. Product narrative from the v1.1 Dev-Ready PDF; identity model from the DSA `Scholars-Drill-PRD.md`; all API, schema and constraint claims verified against `wamp64/www/dsa_backend` and `wamp64/www/distingushed-scholars-academy` on 10 September 2026.*
