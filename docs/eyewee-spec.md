# eyewee — Reference Spec

> Internal reference, condensed from i4iSciences' eyewee landing-page copy deck, the eyewee Chat
> Page developer instructions, the "Organize (PI-side) integration readiness" note, and the
> Document Search developer instructions (proprietary & confidential materials). Kept here so
> future work on eyewee starts from the actual spec instead of re-deriving it from chat history.
> Reference files mentioned but not reproduced here: `eyewee-eye-states.html` (verified eye
> animation reference), `repository-connect-workflow.html`, `eyewee_document_search_demo.html`,
> `Doc2Postdoc_Concept_and_Plan.docx` (for the shared wellbeing guardrail).

## 1. What eyewee is

**Master line (locked):** "You say it — eyewee carries it, guides it, and cracks the toughest
problems."

eyewee is the AI companion built into PostdocWorks Navigator (not a separate app, not a standalone
chatbot). It's framed around three "crossings":

| Crossing | Meaning | Primary line | Alt line |
|---|---|---|---|
| **Translate** | language crossing | "Say it your way. eyewee carries it the rest of the way." | "No language should stand between you and your work." |
| **Navigate** | everyday-logistics crossing | "The guide for everything nobody hands you on day one." | "From visa paperwork to lab paperwork, one place to ask." |
| **Leverage** | cracking the unsolved project | "Your PI handed you the hard problem. We help you crack it." | "200 papers deep, one clear next step." |

This copy is **confirmed/locked** — don't rewrite it, only re-lay it out.

### Already reflected in this codebase
- The home page nav wordmark already carries a version of the master line: "You say it, Eyewee
  carries it, guides it and cracks the toughest problems" (`app/components.tsx`).
- `/api/eyewee` (`app/api/eyewee/route.ts`) is a canned, pattern-matched responder used inside the
  Doc2Postdoc workspace's "Ask Eyewee" panel (`HomeExperience.tsx`) — **this is intentionally not a
  real model call**, which lines up with the crisis-response hold described below (build the
  surface, don't wire a freely-conversing model until that gate clears).
- `app/eyewee/` now hosts a real landing page (`EyeweeLanding.tsx`) using the eye mark and the
  Translate/Navigate/Leverage copy above. Linked from the main nav (home page + careers page).

---

## 2. eyewee Chat Page — backend & frontend build spec

Source files it replaces the placeholders in: `eyewee-page.html`, `repository-connect-workflow.html`.

### 2.1 The hold (read this before building anything in this section)
- **Every** endpoint below requires an authenticated, **email-verified** session — the same
  account-level lock already built for registration. Not new policy, just enforced here too.
- Separately, and more importantly: **the endpoint that actually sends a user's message to eyewee
  and returns a live reply stays behind the crisis-response protocol hold** — legal clearance +
  mental-health-professional review, before any surface where eyewee can freely converse goes
  live.
- **Build the schema, the conversation list, and the message-history endpoints now. Do not flip on
  real message-sending for real users until that gate clears.** ("Build it, don't launch it.")

### 2.2 Data model
Spec is written against Mongoose/MongoDB. **This repo uses Supabase/Postgres** — translate
collections to tables, `ObjectId` refs to `uuid` foreign keys, and enum arrays to Postgres `enum`
or `check` constraints when it's actually implemented. Don't build a second database.

- **User/Account** — add (or confirm/rename) two fields: `emailVerifiedAt` (already the account-lock
  flag), `platformGateOpen` (already the Doc2Postdoc platform-lock flag). Don't rebuild these —
  find the existing equivalents first.
- **StorageConnection** — `userId`, `repository` (enum: zenodo / osf / dryad / figshare),
  `accessTokenEncrypted` (required, encrypted at rest — never plaintext), `refreshTokenEncrypted`,
  `externalAccountLabel` (display label, e.g. the connected email at that repo), `connectedAt`.
  Unique on `(userId, repository)`.
- **MemoryFact** — `userId`, `text`, `category` (enum: field / focus / badge / preference / other),
  `sourceConversationId`, `createdAt`, `lastReferencedAt`. **Schema is settled; the write path is
  not** — see §2.5.
- **Conversation** — `userId`, `title` (default "New conversation"), `createdAt`, `updatedAt`.
- **Message** — `conversationId`, `sender` (enum: user / eyewee), `text`, `createdAt`.

### 2.3 API endpoints

**Storage**
- `GET /api/storage/connections` — list this user's connections + status.
- `GET /api/storage/connect/:repository` — redirect to that vendor's OAuth authorize URL.
- `GET /api/storage/callback/:repository` — OAuth callback; exchange code, store token.
- `DELETE /api/storage/connections/:repository` — remove the stored link **only**. Must never call
  anything that deletes/modifies data at the vendor — disconnecting removes PostdocWorks' link, not
  the postdoc's actual deposits.

**Memory**
- `GET /api/memory` — list this user's memory facts, for sidebar display. **No write endpoint
  yet** (§2.5).

**Conversations & messages**
- `GET /api/conversations` — list this user's conversations, newest first.
- `POST /api/conversations` — create a new conversation, return its id.
- `GET /api/conversations/:id/messages` — load a conversation's full message history.
- `POST /api/conversations/:id/messages` — send a message, return eyewee's reply. **This is the
  endpoint held behind the crisis-response gate (§2.1).**

### 2.4 Frontend integration mapping (from `eyewee-page.html`)
Every hardcoded value / `PLACEHOLDER` comment maps to a real endpoint:
- Sidebar **Storage** rows → `GET /api/storage/connections` on load; each row's "Connect" →
  `GET /api/storage/connect/:repository`.
- Sidebar **Memory** list → `GET /api/memory` on load.
- Sidebar **Recent** list → `GET /api/conversations` on load; click → `GET
  /api/conversations/:id/messages`, re-render the thread.
- **New conversation** button → `POST /api/conversations`, clear thread, focus input.
- `sendMessage()`'s placeholder `setTimeout` canned reply → `POST /api/conversations/:id/messages`.
  **Keep the `setBehavior("thinking")` / `setBehavior("idle")` calls exactly where they are** —
  thinking starts the instant the request goes out, ends the instant the reply lands. Only the
  function body changes, not the state-transition shape around it.
- `repository-connect-workflow.html`'s two placeholder blocks (OAuth redirect, disconnect call) →
  `GET /api/storage/connect/:repository` and `DELETE /api/storage/connections/:repository`.

### 2.5 Open product decision — blocks the Memory write path only
Needs a decision from Ran before the write path is built (does **not** block §2.2–2.4, which don't
depend on it):
1. **Automatic extraction** — background process decides what's durable enough to save (like
   Claude's own memory system).
2. **Explicit-only** — only facts the postdoc states directly and confirms get saved. More
   conservative, more auditable, no "magic."
3. **Hybrid** — system suggests candidate facts, postdoc approves before anything saves.

### 2.6 Security & privacy requirements
- `accessTokenEncrypted` / `refreshTokenEncrypted` encrypted at rest, never logged in plaintext.
- `MemoryFact.text` must **never** contain a mental-health disclosure, crisis-related content, or
  anything covered by eyewee's wellbeing guardrail ("no mental health disclosures ever stored in
  profile/badge/matching data") — whichever write path gets chosen in §2.5 needs this filter built
  in from the start, not bolted on after.
- Every endpoint in §2.3 sits behind the authenticated + email-verified session check.

### 2.7 Suggested build order
1. Conversations + Messages schema and list/create/load endpoints (send endpoint built, not
   launched).
2. Storage connections — independent of the crisis-protocol hold, ships on its own.
3. Recent-conversations sidebar — ships alongside #1 (same schema).
4. Memory — blocked on §2.5's decision; don't start the write path before that's settled.

### 2.8 The eye mark
The animated eye SVG (idle / thinking / stuck / spark states, crack tiers by usage) is a **verified
reference asset** — copied exactly from `eyewee-eye-states.html`, not rebuilt. When the real chat
page is built in this repo, port the SVG + its CSS keyframes as-is; only the trigger wiring changes
(thinking fires on real send/receive, not a button; stuck/spark have no defined real trigger
condition yet — flag as open when reached).

---

## 3. Organize (PI-side) integration readiness

Organize (PI-facing lab administration) **launches later, not now**. This section is about what to
architect *today* so that later launch is additive, not a rebuild. Zero new features, zero new UI
right now.

1. **Account/role model** — add a `role`/`account_type` field to the user schema now (`postdoc`,
   `pi`, room for more). Only `postdoc` accepts signups today, but don't hardcode "postdoc" as the
   only possible identity in the schema. Note: the existing Faculty Endorsement flow already
   collects a PI's name/email/relationship — worth deciding whether that should seed a lightweight,
   inactive PI-record automatically, so existing PI relationships don't need re-collecting later.
2. **Organize's own data model** — reserve category slots now as inactive/placeholder entries (same
   pattern as the 12-pillar taxonomy placeholder): Research Output (Papers, Reviews); Grants
   (National, NIH R01, International, R21); People (Students, Trainees, Postdocs); Lab
   Administration (Admin, Accounting, Budgeting, Travel, Conferences, Collaborations, Overhead
   Expenses, Vendors); Lab Resources (Instrument Maintenance, Animal Experiments, Animal Food
   Supply, Reagents & Chemicals, Kits, Software, Data). They don't do anything yet — just exist.
3. **Postdoc ↔ PI data visibility** — don't architect postdoc badge/credential/Doc2Postdoc data as
   permanently postdoc-private in a way that blocks a future PI view. Model visibility as a
   configurable permission layer (every "PI can see X" flag OFF today is fine) rather than a
   single-user-only assumption that has to be unwound later.
4. **eyewee's routing layer** — eyewee currently only needs to know "I'm serving a postdoc." Build
   a `context.role` check now (before conversation logic branches) even though only the postdoc
   branch (Translate/Navigate/Leverage) exists today — so adding the PI's Organize branch later is
   additive.

**Explicitly not building yet:** Organize functionality itself, PI signup/onboarding, postdoc-to-PI
data-sharing permissions UI.

---

## 4. Document search — developer instructions

Reference build attached in the source material: `eyewee_document_search_demo.html`.

### 4.1 In-app search bar — build this
A toggle-able find bar shaped like a browser's own: search input (focuses on open), highlights
every match as the user types, match counter ("2 of 8"), next/previous (buttons + Enter/Shift+Enter),
Esc closes + clears highlights. **Fully free, plain JS** — regex over the text, wrap hits in
`<mark>`, `scrollIntoView()` to jump. No paid search API needed for single-document search. The
reference file implements this exactly — reuse the logic as-is when this is built.

### 4.2 Native Ctrl+F compatibility — the important catch
Ctrl+F only finds real, selectable text in the DOM. **The trap:** a canvas-based PDF viewer renders
a *picture* of the text — Ctrl+F finds nothing, even though the text is visible. **The fix:** if the
PDF viewer is built on PDF.js (the standard free/open-source library), enable its **text layer**
feature — an invisible layer of real, selectable text positioned over the canvas rendering. It is
**not on by default**. **Action item for whichever PDF viewer gets chosen**: confirm it has an
equivalent text-layer feature and that it's turned on, *before* it becomes the default way postdocs
read papers — otherwise this fails silently (no error, Ctrl+F just does nothing).

### 4.3 Scope clarification — one document vs. the whole library
- **Built/demoed:** search within one open document (§4.1).
- **Not yet built or scoped:** search across a postdoc's entire ~200-paper stack at once, jumping to
  the right paper *and* the right spot. This needs an actual search index, not DOM text-matching —
  a meaningfully bigger feature. Still free/client-side/no paid API: **FlexSearch**, **MiniSearch**,
  or **Lunr.js**. Needs its own scoping/estimate pass — don't fold it into the single-document
  search bar by default.

---

## 5. Gaps vs. this repo (what "finish eyewee" actually requires)

### Done as of 2026-09-17
- Landing page at `/eyewee` (`app/eyewee/EyeweeLanding.tsx`) with the locked master line and the
  three confirmed crossing punchlines (primary + alt shown together).
- `/eyewee` linked from the main nav on the home page and the careers page.
- The eye mark ported as a static idle-state SVG for the landing hero (gradients/paths match the
  verified reference; animation states not needed on a marketing page).

### Not started (all of §2–§4 above)
1. **Data model** — no `StorageConnection`, `MemoryFact`, `Conversation`, or `Message` tables exist
   yet in Supabase. `emailVerifiedAt`-equivalent already exists via Supabase Auth
   (`auth.users.email_confirmed_at` / our own `credential_applications.email_verified_at` /
   `doc2postdoc_signups.email_verified_at` patterns) — reuse that pattern, don't invent a new flag.
   `platformGateOpen` equivalent does not exist yet — needs to be defined (see Doc2Postdoc spec §2
   Step 5 "launch sequencing," which is the same kind of gate).
2. **Storage connections** (Zenodo/OSF/Dryad/figshare OAuth) — no endpoints, no OAuth app
   registrations, no encryption-at-rest utility for tokens exist in this repo yet. Can be built
   independently of the crisis-response hold.
3. **Conversations/messages** — no endpoints or UI beyond the fake `/api/eyewee` demo responder
   inside Doc2Postdoc's workspace. The real chat page (sidebar + main column + the full eye
   animation) from `eyewee-page.html` has not been ported into this repo as actual React yet — the
   HTML reference is a very complete, ready-to-adapt build, including the SVG and all state CSS.
4. **Memory** — table not built; write-path decision (§2.5) not made — do not start building the
   write path until that decision is made. `GET /api/memory` (read-only) can be built once the table
   exists even before the decision, it'll just return empty.
5. **Send-message gate** — no gate-check mechanism exists yet for "crisis-response protocol
   clearance." Needs an explicit, easy-to-find single switch (env var or DB flag) so the send
   endpoint can be built and tested against a fake/off state without any risk of accidentally
   shipping live model access.
6. **Document search** — no in-app find bar, no PDF viewer chosen yet at all in this repo (there's
   no document/paper viewing surface yet), so the Ctrl+F/text-layer catch doesn't apply yet but
   must be checked the moment a PDF viewer is chosen.
7. **Organize readiness hooks** — no `role`/`account_type` field on any profile schema in this repo
   yet (Doc2Postdoc's `role` enum is `phd_student | postdoc | faculty | industry`, which is a
   different axis — this new `role` is about *postdoc vs. PI account type*, not career stage. Keep
   these two concepts distinct when building it). No Organize category placeholders exist. No
   visibility-permission layer exists for postdoc data toward a future PI view. No `context.role`
   routing hook exists in the `/api/eyewee` demo endpoint.

### Suggested build order
1. Storage connections (independent, no gating, clear vendor-integration win).
2. Conversations + messages schema/endpoints (list/create/load only — send endpoint built but held
   behind an explicit gate flag) + port the real chat page UI from `eyewee-page.html` into this
   repo as React, wired to those endpoints.
3. Define the send-message gate mechanism itself (even before it's ever flipped on) so "build it,
   don't launch it" has a concrete, auditable off-switch.
4. Memory read endpoint once the table exists; hold the write path for Ran's decision (§2.5).
5. Organize readiness hooks (role field, category placeholders, visibility layer, routing hook) —
   cheap, additive, can happen any time in parallel with the above.
6. Document search — once a PDF viewer is chosen for wherever papers get displayed; scope the
   cross-library search as its own follow-up, not bundled in.

## 6. Open questions to resolve before continuing (do not guess these)
- Exact wellbeing-guardrail filter rules referenced in §2.6 (what counts as "mental-health
  disclosure or crisis-related content") — needs the actual locked policy text, not an
  approximation.
- The Memory write-path decision (§2.5) — needs Ran, not the developer.
- Where/how the crisis-response protocol clearance is actually granted (who flips the gate, and
  how that's recorded) — referenced as an existing process but the mechanics aren't specified here.
- Full stuck/spark trigger conditions for the eye mark — not yet defined per the HTML reference's
  own comments.
