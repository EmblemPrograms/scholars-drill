# Scholars Drill

Exam-practice platform for Nigerian JAMB, WAEC, NECO and Post-UTME candidates: CBT simulation under real exam conditions, a verified question bank, performance analytics, and an explanation for every answer.

Scholars Drill is a sister product to **Distinguished Scholars Academy (DSA)**. It shares DSA's backend and DSA's accounts, so a DSA student signs in with the email and password they already have.

> **Status: pre-implementation.** This repository is a fresh Next.js scaffold. The product is specified in [docs/PRD.md](docs/PRD.md), and several backend changes it depends on don't exist yet (PRD §3, "Blockers"). Read the PRD before building a feature.

---

## How it fits together

Scholars Drill has no backend of its own. It's a second frontend for the existing DSA API.

```
DSA frontend ─┐
              ├──▶  DSA API  ──▶  MongoDB Atlas (shared users)
Scholars Drill┘     api.distinguishedscholarsacademy.com
```

- **Shared accounts.** One `users` collection serves both products. Scholars Drill signs people in through `/api/auth/*` and never hashes passwords, signs tokens, or stores sessions itself.
- **The server is the authority.** Scores, timers, answer keys and entitlements are computed and enforced by the API. The client displays them and is never trusted to set them.
- **API docs:** Swagger at <https://api.distinguishedscholarsacademy.com/api-docs>

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3.4 (App Router) |
| UI | React 19.2.8 |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 5 |
| Backend | DSA API: Express + Mongoose, REST |
| Database | MongoDB Atlas (owned by the DSA API) |
| Payments | Paystack, via the DSA API |
| Media | Cloudinary signed uploads, via the DSA API |

## Getting started

**Prerequisites:** Node.js 20.9 or later, and npm.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure the environment.** Create `.env.local` in the project root:

   ```
   NEXT_PUBLIC_API_URL=https://api.distinguishedscholarsacademy.com
   ```

   Use the origin only, with no trailing `/api` and no trailing slash. A base ending in `/api` produces `/api/api/...` requests and 404s. The DSA frontend has already hit this bug.

3. **Run the dev server on port 3001.** The DSA frontend uses 3000, so run Scholars Drill on 3001 to have both up at once:

   ```bash
   npm run dev -- -p 3001
   ```

   Open <http://localhost:3001>.

> **Known blocker: CORS.** The DSA API's allowlist (`dsa_backend/app.js`) doesn't yet include `http://localhost:3001` or any Scholars Drill domain, so browser requests to the API fail until the backend adds them. See PRD blocker **B6**.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server (append `-- -p 3001`, see above) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | DSA API origin, e.g. `https://api.distinguishedscholarsacademy.com` |

Anything prefixed `NEXT_PUBLIC_` is bundled into the browser, so never give a secret that prefix. Secret keys (Paystack secret, Cloudinary API secret, JWT secret) live only on the API server.

`.gitignore` excludes every `.env*` file. Share environment values through a secure channel, not through commits.

## Next.js 16: read before writing code

This project runs **Next.js 16**, which has breaking changes from earlier versions in its APIs, conventions and file structure. Don't rely on older habits or tutorials. Check the documentation bundled with the installed version first:

```
node_modules/next/dist/docs/
```

See [AGENTS.md](AGENTS.md). Heed any deprecation notices.

## Project structure

```
app/            App Router: layout.tsx, page.tsx, globals.css
docs/PRD.md     Product requirements and the API integration plan
public/         Static assets
```

The `@/*` import alias resolves to the project root.

## Conventions

**Naming.** The product is **Scholars Drill**. Quiz360Pro is retired and should not appear anywhere.

| Context | Form |
|---|---|
| Prose, UI copy | Scholars Drill |
| Routes, slugs, env keys | `scholars-drill` |
| Components, symbols | `ScholarsDrill` |

**API access**
- All requests go through one shared API client. The client normalizes the base URL, so individual files never build API URLs by hand.
- The JWT lives in an `httpOnly`, `Secure`, `SameSite=Lax` cookie, set by a route handler that proxies login. Never put it in `localStorage` or anywhere else page scripts can read it.
- Only build against endpoints that exist. If a feature depends on an endpoint that doesn't exist yet, agree the contract with the backend team first and mock it behind the API client.

**Exam integrity**
- Never send answer keys or explanations to the client before submission.
- Never compute a score on the client, or send one to the API.
- Treat the server's timer as the real one. The on-screen countdown only displays it.

**Mobile first.** Most candidates practise on phones. Design the quiz experience for mobile and test it on real devices.

## Related repositories

| Repository | Role |
|---|---|
| `distingushed-scholars-academy` | DSA frontend (Next.js), the other consumer of the same API |
| `dsa_backend` | The DSA API that Scholars Drill runs on (Express + Mongoose) |

Scholars Drill needs changes in `dsa_backend` before v1 can ship: free registration, product-namespaced roles, question-bank fields, and CORS. [docs/PRD.md](docs/PRD.md) §3 describes each one.
