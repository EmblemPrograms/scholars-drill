# Scholars Drill — AI Study Mode

**Version:** 1.0
**Date:** 12 September 2026
**Companion to:** [PRD.md](PRD.md), [APP-STRUCTURE.md](APP-STRUCTURE.md)
**Status:** specification. Nothing here is built yet.

---

## 1. What AI Study Mode is

Three capabilities, in the order a student meets them:

| # | Capability | The question it answers |
|---|---|---|
| C1 | **Corrections** | "Why was I wrong?" |
| C2 | **Topic guidance** | "I keep failing this topic. Teach me." |
| C3 | **Study efficiency** | "What should I study next, and for how long?" |

All three exist because of one thing a CBT app normally cannot give a candidate at 11pm: a reason. **Most of it should cost nothing to run** — see §5.4. The rest of the product tells a student *that* they were wrong. This tells them *why*, and what to do about it.

### The rule everything else hangs from

**The model never decides what the correct answer is.** It is given the stored, reviewed answer and the stored working, and its job is to explain them. If the model believes the stored answer is wrong, it must say so through a flag that reaches the review queue, and must not tell the student a different answer.

Getting this backwards would be worse than having no AI at all: a confident explanation of a wrong answer teaches the wrong thing and destroys the one claim the product is built on. See PRD §3.8 and the review workflow in APP-STRUCTURE §0.

---

## 2. C1 — Corrections

**When:** after the student has answered, in practice mode, and after submission in CBT mode. Never during a timed attempt (§6).

**Input to the model (all from the database, none from the student):**

- question text, all options, and which option is correct
- the stored explanation or worked solution
- the option the student actually picked
- subject, topic, difficulty, examination and year

**Output:** why the correct option is correct, and specifically why *their* option is wrong. Two short paragraphs at the level of a senior secondary candidate, not a textbook page.

**Degradation:** if the API is slow, rate-limited or down, show the stored worked solution. The student should never meet a blank space where an explanation was promised.

**Every AI explanation carries its own "This doesn't look right" control**, feeding the same queue as question reports. AI output is never promoted into the question bank without a human approving it.

---

## 3. C2 — Topic guidance (the agent)

A **deliberately small agent**, scoped to one topic at a time. It is not a general chatbot, and it should not answer "what is the capital of France".

**Scope:** the student opens it from a weak topic ("Probability, 51%") or from a question they just got wrong. The session carries that topic, the student's exam and year, their recent accuracy on it, and the two or three questions they most recently failed in it.

**What it does:** explains the idea in plain language, works one example, then hands back to practice with a drill on the same topic. The measure of success is that the student leaves the conversation and answers questions, not that they keep chatting.

**Build it as a single call with a system prompt, not a tool loop.** The one thing it may need beyond conversation is "give me practice on this", which the UI can do directly. Reach for tool use only if that stops being true.

**Guard rails**
- Refuses to leave the topic, politely, and offers the relevant drill instead.
- Never reveals the answer to a question the student has not yet attempted.
- Cannot be opened while a CBT attempt is in progress.
- Its replies are capped in length. A wall of text is a failure mode here, not thoroughness.

---

## 4. C3 — Study efficiency, from analytics

This is the part most likely to be got wrong by handing it to a model. Split it in two:

### 4.1 The numbers are computed, never generated

Every statistic comes from a database aggregation. The model is not asked to count anything, and is never in a position to invent "you improved 23%".

**Per question** (also how bad questions get caught):

| Metric | Used for |
|---|---|
| Times attempted | Confidence in the other numbers |
| Correct rate | Real difficulty, against the label a human gave it |
| Average time | Questions that eat the clock |
| Skip rate | Confusing or badly worded questions |
| Distractor spread | Which wrong option attracts most picks |

Two payoffs. First, a question labelled EASY that 80% of candidates fail is either mislabelled or wrong, and it goes to review. Second, a distractor that attracts most students is a **named misconception** — that is the most valuable teaching signal in the whole system, because it says exactly where the class goes astray.

**Per student:** accuracy by subject and topic, trend over recent attempts, recency, attempts per topic, average time per question, and improvement since the last attempt on the topic.

### 4.2 The model does the sequencing and the wording

Given those numbers, it produces a short plan: which topics, in what order, how many questions each, and one sentence of reasoning per topic that a 17-year-old will act on.

**Ranking is a formula in code, not a vibe.** A topic rises when accuracy is low, the topic is heavy in the exam, it has not been practised recently, and there are enough attempts to trust the number. The model orders and explains what the formula surfaces; it does not invent the ranking.

Use **structured outputs** (`output_config.format`) so the plan comes back as data the UI renders, rather than prose the UI has to parse.

---

## 5. Technical shape

### 5.1 Where it runs

**The DSA backend owns the AI endpoints.** Scholars Drill calls them with the student's JWT, exactly as it calls everything else.

```
Scholars Drill (Next.js)  ──JWT──▶  DSA API /api/ai/*  ──▶  Claude API
                                          │
                                          ├─ grounding data (question, answer, working)
                                          ├─ explanation cache
                                          ├─ rate limits + entitlements
                                          └─ audit log
```

Why not call Claude straight from Next.js: the cache, the rate limits and the grounding data all live next to Mongo. Putting the model call anywhere else means shipping the answer key out of the backend and rebuilding three things that already exist there. **`ANTHROPIC_API_KEY` lives only on the backend** and never reaches the browser or a `NEXT_PUBLIC_` variable.

### 5.2 Endpoints to add

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ai/explanations` | C1. `{ questionId, chosenOptionId, attemptId }` |
| `POST` | `/api/ai/guidance` | C2. Topic-scoped turn |
| `GET` | `/api/ai/study-plan` | C3. Ranked plan for the signed-in student |
| `GET` | `/api/analytics/questions/:id` | Per-question stats (admin) |
| `GET` | `/api/analytics/me/topics` | Per-topic stats (student) |
| `POST` | `/api/ai/explanations/:id/report` | "This doesn't look right" |

### 5.3 Collections to add

- **`AiExplanation`** — cache, keyed by `(questionId, chosenOptionId, promptVersion)`, with the model id, token counts and created date.
- **`QuestionStat`** — rolling per-question aggregates, updated on attempt submission rather than computed per request.
- **`StudyPlan`** — the last plan per student, so the dashboard does not regenerate on every load.
- **`AiUsage`** — per student per day, for rate limits and cost visibility.

### 5.4 Cheapest-first: most corrections should cost nothing

The cheapest model call is the one you never make. Three layers, in order, and the
model is the last of them:

**Layer 1 — the explanation a human already wrote (free, forever).**
The question schema stores an `explanation` on the question *and* one per option.
A content manager writing "B is wrong because you used the diameter instead of the
radius" once means every student who picks B, forever, gets a correct, reviewed
answer with no API call and no waiting. This is better than AI output, not a
budget compromise: it is reviewed, consistent, and instant.

**Make per-option explanations part of the authoring standard**, at least for the
distractor that question analytics (§4.1) shows attracts the most picks. The
analytics tell you exactly which twenty explanations to write first, and those
twenty will cover a large share of all wrong answers.

**Layer 2 — the cache (paid once, then free).**
When the model does run, the result is stored in `AiExplanation` against
`(questionId, chosenOptionId, promptVersion)`. The same wrong answer to the same
popular question is explained thousands of times and paid for once. Expect most
requests to be cache hits within weeks of launch.

**Layer 3 — the model, for gaps only.**
Only when no human explanation exists for that option and nothing is cached.

Result: the API bill scales with *unique* gaps in the bank, not with student
traffic. It falls as the bank matures instead of rising as the product grows.

### 5.5 Model and API

Use the official SDK (`@anthropic-ai/sdk`), not raw HTTP. `ANTHROPIC_API_KEY`
lives only on the backend.

**Default model: `claude-haiku-4-5`** — $1 per million input tokens, $5 per
million output, 200K context. It is the cheapest model in the family and it is
well suited to the actual job here, which is restating a stored, verified answer
in plain language for a 17-year-old. It is not being asked to work out the
physics; the working is already in the prompt.

| Where | Model | Why |
|---|---|---|
| C1 corrections | `claude-haiku-4-5` | Explaining a supplied answer. Cheap and fast |
| C3 study plan | `claude-haiku-4-5` | The ranking is computed in code; the model only words it |
| C2 topic guidance | `claude-haiku-4-5`, `claude-sonnet-5` if quality falls short | Actual teaching is the hardest of the three |

Settings that cut cost without touching quality much:

- `output_config: { effort: "low" }` for corrections. There is little to reason about.
- **Prompt caching** (`cache_control: { type: "ephemeral" }`) on the stable system
  prompt. Cached reads cost about a tenth of normal input.
- **Cap output length.** A correction is two short paragraphs; a guidance reply is
  a few sentences. Output tokens cost five times input.
- **Cap a guidance session** at roughly six turns, then push the student into a drill.
- **Batch API** (50% off, results within 24h) for one targeted job: filling
  explanation gaps on the questions analytics shows are most-missed. This is the
  one sanctioned form of pre-generation (see rule 4), because it is aimed at a
  ranked list of real gaps rather than the whole bank.

### 5.6 What this actually costs

Assumptions stated so you can re-run them: a correction is roughly 1.5K input and
350 output tokens.

| | Per call | 10,000 calls |
|---|---|---|
| `claude-haiku-4-5` | about $0.003 | about $33 |
| With system-prompt caching | about $0.002 | about $22 |
| Cache hits and human-written explanations | $0 | $0 |

10,000 *uncached* explanations is a lot of unique gaps. With layers 1 and 2 doing
their job, a realistic monthly bill early on is a few dollars, and it shrinks as
the bank fills in. Watch it through `AiUsage` rather than guessing, and put a hard
monthly ceiling in place that disables AI features and falls back to stored
workings when crossed.

**On genuinely free models:** Anthropic has no free tier. If you want to run this
on a provider's free allowance instead, that is a different SDK and a different
set of limits, and worth deciding deliberately rather than drifting into. Say the
word and I will price the options. My recommendation is the design above: it makes
the AI bill small and shrinking, without putting the product's core promise on a
free allowance that can be withdrawn.

## 6. Rules that must not bend

1. **No AI during a timed CBT attempt.** Not corrections, not guidance, not the plan. The button is not merely hidden; the endpoint refuses while an attempt is `IN_PROGRESS`.
2. **The stored answer wins.** The model explains it and cannot contradict it.
3. **Never reveal an answer to an unattempted question.**
4. **Student-triggered only**, with one exception: the batch job that fills explanation gaps on the most-missed questions (§5.5). Never pre-generate across the whole bank — that is a bill with no student attached.
5. **Rate-limited per account and per day**, by tier, and enforced server-side.
6. **Degrade, never blank.** API failure falls back to the stored working.
7. **No PII leaves the backend.** Send the question, the answer, the topic and anonymous performance figures. Never name, email, phone or Student ID.
8. **Log every call** — student, question, model, tokens, cache hit or miss — for cost tracking and for answering "what did it tell my child?"

---

## 7. Privacy (NDPR)

This sends a Nigerian student's performance data to a third-party processor, and many of these students are minors. Before launch:

- Say so plainly in the privacy policy, and name the processor.
- Capture consent at signup, with an off switch in profile settings that genuinely disables AI features.
- Send anonymous identifiers only, per rule 7.
- Set a retention period for `AiExplanation` and `AiUsage`.

This is the same open item as PRD §6.3 #9 and it now has a second reason to be closed.

---

## 8. Where it lives in the app

```
app/(student)/
├─ study/
│  ├─ page.tsx                   # C3: the plan, ranked topics with reasons
│  └─ [topic]/page.tsx           # C2: guided session, scoped to one topic
└─ attempt/[attemptId]/review/
   └─ _components/
      ├─ ai-explanation.tsx      # C1: on demand, per question
      └─ report-explanation.tsx  # "This doesn't look right"

app/(admin)/admin/
└─ questions/analytics/page.tsx  # per-question stats, miscalibration flags
```

---

## 9. Build order

| Step | What | Depends on |
|---|---|---|
| 1 | ~~`QuestionStat` aggregation on attempt submission~~ **Done 12 Sep 2026** | Shipped |
| 2 | ~~Per-topic student analytics endpoint~~ **Done** `GET /api/analytics/me/topics` | Shipped |
| 3 | C1 corrections, with the cache from day one | Step 1, question bank |
| 4 | Report control on AI output, into the review queue | Step 3 |
| 5 | C3 study plan, formula first, wording second | Step 2 |
| 6 | C2 topic guidance | Steps 3 and 5 |
| 7 | ~~Admin question analytics and miscalibration flags~~ **Done** `GET /api/analytics/questions` | Shipped |

**Steps 1, 2 and 7 are built** (12 September 2026), documented in `dsa_backend/docs/analytics.md`. They need no AI at all, and were worth building regardless: knowing which questions are broken and which topics a student fails is useful on its own, and it is the input everything else depends on.

**None of this is v1.** v1 is practice that works and answers that are right. This is what makes the second version worth upgrading to.
