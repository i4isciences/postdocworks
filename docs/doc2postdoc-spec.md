# Doc2Postdoc — Reference Spec

> Internal reference, condensed from i4iSciences' Doc2Postdoc Concept, Developer Build Guide, and
> Unified Onboarding Flow developer note (proprietary & confidential materials). Kept here so future
> work on this feature starts from the actual spec instead of re-deriving it from chat history.
> Source docs referenced but not reproduced in full: `Doc2Postdoc_Concept_and_Plan.docx`,
> `doc2postdoc-profile-form.html`.

## 1. What Doc2Postdoc is

**Tagline:** "Where the Next Step Has Already Been Taken."

Real peer mentorship for PhD students and postdocs, built **into** PostdocWorks Navigator — not a
separate app or a separate account.

- **PhD student** — completing a doctoral degree, starting to think about what's next.
- **Postdoc** — already made that jump, working in a further-specialized research role.

Doc2Postdoc connects a PhD student directly with a postdoc who has already made *that exact
transition*. Not generic career advice — a guide who has walked the same path, in the same field,
at a comparable institution/geography.

### The problem it solves
- Advisors/career offices rarely know what the postdoc jump feels like in your exact field.
- Generic career advice fits no one specifically.
- It's hard to know whose "mentor" credentials online are actually real.

### How matching works (3 inputs)
1. **Research area & specialty** — field/subfield overlap, not just "academia in general."
2. **Career stage** — matched to someone at a relevant point in their own trajectory.
3. **Institution & geography** — shared context, weighted but not required.

### Built on real credibility
Every postdoc mentor has a **Research Credibility Profile** built from their actual academic
record (publications, endorsements) — not self-reported claims. This is the same trust layer as
the rest of PostdocWorks Navigator's badge system, not a parallel one.

### Confidentiality & IP
Matched-pair conversations are private by default. Shared drafts/work keep the original author's
ownership — no implicit IP transfer between mentor and mentee. (Spec calls this an "8-layer
protection model" — full layer list lives in the Concept & Plan doc; build the mechanics, not just
messaging copy.)

### It's not one-way
Mentoring builds the **mentor's own standing** — visible recognition on the platform, feeding into
the same signal that drives the Platform-Proven badge tier. Not a quiet favor; a tracked activity.

---

## 2. Developer Build Guide — 5 steps

**Where it fits:** one more module inside the existing Navigator shell, alongside Verified Badges
(existing, 3 tiers) and Application Triage (existing, 4 tiers). Doc2Postdoc is new.

> Note: the original guide describes the platform stack as "Next.js · Express · Mongoose · Claude
> API" (i.e. MongoDB). **This repo's actual stack is Next.js (App Router) + Supabase/Postgres**, not
> Express/Mongoose. Section 4 below maps every spec item to the real schema/routes already in this
> codebase — treat section 4 as the source of truth for *this* implementation, and this section as
> the product intent.

### Step 1 — Research Credibility Profile Scorer
Same pattern as the existing Verified Badge scorer — a parallel, dedicated engine.
- Input: academic record, publications, endorsements already on file.
- Engine: 5-component weighted model (exact weights in the Concept & Plan doc — do not guess them).
- Output: a credibility score stored on-profile, feeding directly into the matching engine (Step 2).

### Step 2 — Matching Engine
Three inputs, ranked and paired, no manual matchmaking: research area/specialty, career stage,
institution/geography (see §1). Must handle:
- **No valid match found** → graceful fallback state, not an error.
- **Duplicate/conflicting matches** when a profile qualifies against multiple mentors.

### Step 3 — Confidentiality & IP Layer
An 8-layer protection model — build technical controls per layer, not just a policy page:
- Matched-pair conversations private by default; not visible to other users or exposed in admin
  views "without cause."
- Shared documents/drafts retain original author's ownership — no implicit IP transfer.
- Disputes route through the **existing** Appeals & Dispute Policy — no new parallel process.

### Step 4 — Reputation & Career-Advancement Tracking
- Track completed mentorship activity **against the mentor's own profile**, visibly.
- Feed sustained, high-quality mentoring into the Platform-Proven badge signal.
- **Avoid double-counting**: one mentoring relationship counts once, not once per message/session.

### Step 5 — Launch sequencing
- **Doc2Postdoc** unlocks once real Badge data exists. Does **not** wait on the employer waitlist.
- **Job matching** waits on employer waitlist outreach — a separate, later gate.
- In short: postdocs showing up + earning badges → unlocks Doc2Postdoc. Employers showing up →
  unlocks job matching. These are independent gates.

---

## 3. Unified Onboarding Flow (binding decision — do not re-litigate)

**Decision:** One Navigator account. Two *optional, independent* layered forms. No duplicate
signup, no re-collection of shared fields.

### Why
- Doc2Postdoc launches inside Navigator, not standalone — one legal/trademark track.
- Credential form → trust/badges (Publication-Verified, Faculty-Endorsed, Platform-Proven).
- Doc2Postdoc profile → peer matching.
- Asking for name/email/career stage twice is friction with no benefit.

### The flow
1. **Sign-up** — one Navigator account: full name, email, career stage. (Core identity, shared.)
2. **Credential verification** (optional, any time) — ORCID, publications, professional links,
   faculty endorsement, patents & trademarks. Unlocks badges.
3. **Doc2Postdoc match profile** (optional, any time, independent of badge status) — field,
   location, personal/lifestyle, network, matching preferences. Enables peer matching + "Ring the
   Bell."

A fellow can complete step 2, step 3, both, or neither. **Matching does not require a badge.
Credentialing does not require a match profile.**

### Field ownership table

| Shared account (write once, read by both) | Credential form only | Doc2Postdoc profile only |
|---|---|---|
| Full name | ORCID iD / PMID | Primary field (pillar) |
| Email address | Dissertation / abstract link | Research credibility notes |
| Career stage | LinkedIn / Scholar / ResearchGate | Academic & social memberships |
| | Faculty endorsement details | Institution / dept / city / state / country / US region |
| | Patents & trademarks | Languages, hobbies, marital status, dietary preference |
| | | Peer in field, professional connection |
| | | Match radius, broadcast opt-in |

### Build notes (hard constraints)
- Do **not** re-collect full name, email, or career stage on the Doc2Postdoc form — pull from the
  shared account record.
- A fellow with **only** a credential-form account and no Doc2Postdoc profile → does **not** appear
  in the match pool.
- A fellow with **only** a Doc2Postdoc profile and no completed credential form → **can** still
  match, but shows **no verification badges** on their card.
- Reference files: `doc2postdoc-profile-form.html` (Doc2Postdoc fields) and the existing
  PostdocWorks credential verification form (badge fields).

---

## 4. Mapping spec → this repo's actual implementation

### Already built (as of 2026-09-17)
- **Shared account / auth**: real Supabase Auth (magic link + password), `auth.users`. Session
  handled via `lib/doc2postdoc/server.ts` (`createDoc2PostdocServerClient`, cookie-based).
- **`doc2postdoc_profiles`** table (1:1 with `auth.users.id`, auto-created by
  `handle_doc2postdoc_user` trigger on signup): `display_name`, `role` (enum: phd_student / postdoc
  / faculty / industry), `career_stage` (enum, legacy — see gap below), `research_area`,
  `specialties[]`, `institution`, `institution_type`, `geography`, `bio`, `about`, `interests[]`,
  `avatar_url`, `is_mentor`, `mentor_available`, `credibility_score`, `credibility_profile jsonb`,
  `verified_badges[]`. **Plus columns added for the Doc2Postdoc form**: `email`, `department`,
  `academic_memberships`, `social_memberships`, `languages`, `hobbies`, `marital_status`,
  `dietary`, `peer_field`, `professional_connection`, `match_radius`, `broadcast_opt_in`,
  `usa_region`, `career_stage_label` (free-text form value, distinct from the legacy enum).
- **`doc2postdoc_signups`** staging table — anon-insertable pre-verification form submissions
  (full profile-form payload + `signup_role: 'doc'|'postdoc'`), merged into `doc2postdoc_profiles`
  once the account's email is verified. See `app/verify-credential/page.tsx` →
  `markDoc2PostdocSignupVerified`.
- **Credential form** (separate, badge-earning flow) — `app/credentials/CredentialForm.tsx`,
  `credential_applications` staging table, live ORCID/PubMed checks, USPTO checks gated behind an
  unset `USPTO_ODP_API_KEY` (honestly reports "pending" until configured).
- **Unified onboarding is already respected**: the Doc2Postdoc profile form does *not* ask for
  name/email/career stage again — wait, **check this**: as first built, `Doc2PostdocProfileForm`
  actually *does* still collect `fullName`/`email`/`careerStage` in its own "About you" section,
  because at signup time there is no account yet (same pattern as the credential form: fill form →
  passwordless verify → account created). **This is a deliberate deviation from the onboarding
  note for the pre-account case only** — once a Navigator account already exists (e.g. a fellow who
  already completed the credential form), the Doc2Postdoc form must switch to pulling
  name/email/career stage from the existing account and only ask for what's unique to it (see Gaps
  below).
- **Matching primitives already in the DB** (from the original schema, mostly unused by any UI
  yet): `doc2postdoc_connections` (requester/recipient, status: pending/accepted/declined/blocked),
  `doc2postdoc_posts` (feed posts, `author_id`, `body`, `tags[]`), `doc2postdoc_conversations` +
  `doc2postdoc_messages` (1:1 chat, gated on an accepted connection), and a SQL matching function
  `find_doc2postdoc_matches(match_user uuid, result_limit int)` — ranks candidates who are
  `is_mentor = true and mentor_available = true` by research_area / career_stage / geography /
  institution_type overlap + credibility_score. **This function already implements a version of
  Developer Guide Step 2**, but scores on the *legacy* `career_stage` enum and doesn't know about
  the 12-Pillar taxonomy or the new free-text `career_stage_label` / `research_area` (primary
  field) captured by the new form.
- **Profile editing UI**: `app/doc2postdoc/ProfileEditor.tsx` + `/api/doc2postdoc/profile` (GET/PATCH,
  allow-listed fields) + `/api/doc2postdoc/profile/sections` (experience/education/certifications/
  achievements) + `/api/doc2postdoc/profile/avatar`.
- **Workspace shell**: `app/doc2postdoc/Doc2PostdocWorkspace.tsx` is a **fully wired LinkedIn-style
  app**, not a shell — see the correction below.

> **Correction (2026-09-18):** the "Already built" list above understated this repo significantly.
> A closer read of `supabase/migrations/202609130002` through `...006` and every
> `app/api/doc2postdoc/*` route showed that connect, chat, feed, matching, credibility scoring, and
> mentor reputation were **already fully implemented** — real API routes, real RLS-scoped Postgres
> tables, and real UI wired together in `Doc2PostdocWorkspace.tsx`, `HomeExperience.tsx`,
> `RequestsView.tsx`, and `ProfileEditor.tsx`. The "gaps" list below was written without having read
> those files closely enough and was wrong on several points (credibility weights, matching engine,
> and the feed/connect/chat surface were **not** actually missing). Section 4a replaces it with the
> real, tested state as of 2026-09-18.

### 4a. Real state, verified end-to-end (2026-09-18)

Verified live against the production Supabase project using two real accounts signed in with real
sessions (not code review) — connect, accept, message both directions, publish a post, toggle
mentoring on, score credibility, record a mentorship outcome, read reputation, file and isolate a
dispute. Everything below is confirmed working, not assumed:

- **Connect** — `doc2postdoc_connections` + `/api/doc2postdoc/connections` (GET/POST/PATCH). Send a
  request, the recipient accepts/declines, accepting auto-creates the conversation. Real, tested.
- **Chat** — `doc2postdoc_conversations` + `doc2postdoc_messages` + `/api/doc2postdoc/messages`.
  Real two-way messaging, RLS-scoped to the two matched parties. `MessagesView` now polls the open
  conversation every 4s and auto-scrolls (added 2026-09-18 — previously required a manual reselect
  to see a new reply from the other side).
- **Feed** — `doc2postdoc_posts` (+ image upload to the `doc2postdoc-avatars` bucket) +
  `/api/doc2postdoc/posts`. Publish and read, real.
- **Matching** — `find_doc2postdoc_matches(match_user, result_limit)` SQL function, ranking by
  research-area/specialty overlap, career stage, geography, and credibility score. Called from
  `/api/doc2postdoc/matches`. **This already covers Developer Guide Step 2** — it was never missing.
- **Credibility scoring** — `score_my_doc2postdoc_credibility()` SQL function with **real, already-
  decided weights** (academic record 25%, publication impact 30%, endorsements 20%, trajectory 15%,
  platform activity 10%; `model_version: doc2postdoc-credibility-v1`), called from
  `/api/doc2postdoc/credibility`. **This already covers Developer Guide Step 1 with real weights —
  they were not missing or unknown, they were just never read before writing this doc.**
- **Reputation** — `doc2postdoc_mentorship_outcomes` table + `doc2postdoc_mentor_reputation` view +
  `/api/doc2postdoc/reputation`. Recording an outcome updates the mentor's `completed_mentorships`
  and `average_quality_score` immediately, keyed one row per `connection_id` (upsert on conflict) —
  **double-counting per Guide Step 4 is already prevented by the schema**, not something left to
  build.
- **Disputes** — `doc2postdoc_disputes` table existed with RLS but **had no API route at all**. Added
  2026-09-18: `app/api/doc2postdoc/disputes/route.ts` (GET own, POST new) plus a "Report" action
  inside an open conversation in `MessagesView`, routing to category (content/conduct/ip/privacy) +
  description. Verified a reporter can read their own report and the other party cannot see it.

### 4b. Real bug found and fixed by live testing (2026-09-18)

**The credibility scorer was completely broken for every user before this fix.**
`score_my_doc2postdoc_credibility()` runs `security invoker` and inserts a row into
`doc2postdoc_credibility_runs` on every call — but that table had a `select` RLS policy only, no
`insert` policy. Every real call failed with Postgres `42501` (RLS violation), silently surfaced by
the API route as a generic 500. This was only caught by signing in as a real user and calling the
real endpoint — code review alone did not surface it, since the SQL and the route both look correct
in isolation. Fixed in `202609171231_credibility_runs_insert_policy.sql`.

### 4c. Real gaps closed on 2026-09-18

- **Mentor toggle** — `is_mentor`/`mentor_available` existed as columns and were already allow-listed
  in `PATCH /api/doc2postdoc/profile`, but **no UI ever exposed them**. Since matching requires both
  to be `true` and they default to `false`, **matches were empty for every user, always** — the
  single biggest reason the app could feel "not really working." Added a real toggle in
  `ProfileEditor.tsx` ("Available to mentor a PhD student"), and set sensible signup defaults: a
  `signup_role: 'postdoc'` account gets `is_mentor/mentor_available = true` by default on
  verification (editable any time), a `signup_role: 'doc'` account gets `false` by default.
- **Legacy duplicate auth modal removed** — `Doc2PostdocWorkspace.tsx` had its own dead
  password-based signup/signin modal (`authOpen`/`submitAuth`), left over from before the
  consent-gated, email-verified onboarding flow (`Doc2PostdocLanding` + `Doc2PostdocProfileForm`)
  was built. It could never normally trigger (Workspace only renders once the Gate has already
  confirmed a session) but was a real, live bypass of Terms consent and email verification if it
  ever did. Replaced with a redirect to `/doc2postdoc` on a failed session check, and removed the
  dead code (`HomeOverview`, `HomeView`, `SectionHead`, `ProfileView`, `ProfileSection`, and a
  second unused `ProfileEntries`, none of which were reachable — the real profile UI is
  `ProfileEditor.tsx`).
- **Reputation surfaced on match cards** — `find_doc2postdoc_matches` now left-joins
  `doc2postdoc_mentor_reputation` and returns `completed_mentorships`; `MatchCard` shows "N completed
  mentorships on Doc2Postdoc" when greater than zero.
- **A real, pre-existing type bug fixed as a side effect of this pass**: `HomeExperience.tsx`'s local
  `Profile` type was missing `id`, which made the whole project fail `tsc --noEmit`. Fixed by adding
  the field. The project now typechecks clean.

### 4e. 12-Pillar taxonomy — received and implemented (2026-09-18)

The finalized taxonomy (Concept & Plan doc §5) was provided: 12 pillars, each with a "representative"
Level 2 field list, plus an open/extensible Level 3 specialization and an optional secondary
cross-pillar tag for interdisciplinary work. Implemented in full:

- `lib/doc2postdoc/taxonomy.ts` — the 12 pillars + fields + the doc's own dual-tag hints (Virology/
  Immunology → Medicine, Robotics → Computer Science, Archaeology → Earth Sciences,
  Architecture/Design → Engineering), as a single shared source of truth for client and server.
- New columns on `doc2postdoc_profiles` and `doc2postdoc_signups`: `pillar`, `pillar_field`,
  `specialization`, `secondary_pillar` (`202609171245_pillar_taxonomy.sql`). Left as validated text
  rather than a Postgres enum, since Level 2 is explicitly a "representative set" expected to evolve
  and Level 3 is explicitly open-ended — the app layer validates Pillar/Field against
  `taxonomy.ts`, not the database.
- `Doc2PostdocProfileForm.tsx` — the old free-text "Primary field" is now a real Pillar → Field
  cascading select (Field options change with the chosen Pillar) + a Specialization text input +
  an optional Secondary pillar select, with the matching cross-tag hint shown inline when relevant.
  Pillar and Field are now required for signup.
- `ProfileEditor.tsx` — existing members get the same Pillar/Field/Specialization editor in a new
  "Field & specialization" section, PATCHing through `/api/doc2postdoc/profile` (now validates
  `pillar`/`pillar_field`/`secondary_pillar` against the taxonomy).
- `find_doc2postdoc_matches` — pillar match now scores the same 35 points the legacy research-area
  equality used to (whichever matches; not double-counted), plus a **new +10 bonus when both pillar
  and field match exactly** — sharper signal than free-text equality allowed. Old profiles without a
  pillar set still match via the legacy `research_area` fallback, so nothing already in the system
  broke. **Verified live**: two postdocs with a shared account and geography but different
  pillar/field — the same-pillar-and-field candidate scored 65%, the different-pillar candidate
  scored 20%, both computed correctly from the new formula, tested against the real database with
  real accounts, then deleted.
- Match cards now show the Pillar and Field as separate tags (falling back to the legacy free-text
  field for profiles that predate the taxonomy).

### 4d. Gaps that remain (accurate as of 2026-09-18)

1. **Onboarding edge case** — a fellow who already has a Navigator account (e.g. via the credential
   form) still has no path back into the rich `Doc2PostdocProfileForm` to add Doc2Postdoc-only
   fields (languages, hobbies, match radius, etc.) — `Doc2PostdocGate` sends any authenticated user
   straight to `Doc2PostdocWorkspace`, where `ProfileEditor` doesn't expose those fields. Not fixed
   in this pass; scope it separately (likely: a "complete your Doc2Postdoc profile" prompt inside
   Workspace that opens a trimmed version of the profile form, PATCHing the existing account instead
   of creating a new signup).
2. **Full 8-layer Confidentiality & IP model** — only the "private by default" and "no implicit IP
   transfer" layers have concrete technical controls (RLS scoping; no shared-draft feature exists to
   need an IP control yet). Disputes now route to a real table or the *existing* Appeals & Dispute
   Policy is still not located in this codebase — confirm whether it lives elsewhere before building
   a second one.
3. **Launch sequencing (Guide Step 5)** — no gate exists for "Doc2Postdoc unlocks once real Badge
   data exists, independent of the employer-waitlist gate for job matching." Not addressed in this
   pass.
4. **Platform-Proven badge feed** — the spec says sustained good mentoring should feed the
   Platform-Proven badge tier; `doc2postdoc_mentor_reputation` is real and queryable, but nothing
   reads it to affect a badge, because the "Verified Badges" module itself (3 tiers, referenced
   throughout the Dev Guide) does not exist anywhere in this codebase yet — only the separate
   `credential_applications` staging table for the *credential form* exists. Confirm whether Verified
   Badges lives in a different system before building it here.

---

## 5. Open questions to resolve before continuing (do not guess these)
- ~~The 12-Pillar taxonomy list~~ — **resolved 2026-09-18**, received and implemented (§4e).
- The full 8-layer Confidentiality & IP model (only 2 of 8 layers have concrete controls so far).
- Where the "existing Appeals & Dispute Policy" and the "Verified Badges" module (3 tiers) actually
  live — both referenced repeatedly by the spec as already existing, but neither is present in this
  codebase. Confirm whether they exist elsewhere (a different repo/system) or still need building —
  this blocks Guide Steps 3 (dispute routing) and 4/5 (badge feed, launch gate) respectively.
