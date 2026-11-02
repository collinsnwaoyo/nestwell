# Nestwell build log

How Nestwell was built with Claude Code. One entry per working session, newest at the bottom. This log becomes the case study in the README.

## Session template

### Session N, date

- Goal:
- What I asked Claude Code to do:
- What it built:
- What went wrong and how it was fixed:
- Decisions made:
- Commits:
- Time spent:

## Session 0, 1 November 2026: planning

- Goal: turn the Venus operations board idea into a spec for a deployable multi-property product.
- Wrote the PRD with Claude: four fictional Lagos properties, monthly rent, due-date engine, WhatsApp click-to-chat reminders and broadcasts at portfolio, property, room and tenant level.
- Decisions: Next.js + Supabase on Vercel; no login, with a welcome screen instead; public demo that resets nightly; Revolut-style design patterns; all seeded phone numbers point to my own WhatsApp so tests are visible.
- Next: day 1 of the build plan.

## Session 1, 1 November 2026: day 1 — repo, schema, domain logic, seed

- Goal: day 1 of the build plan — repo, schema, seed script, due-date/fee logic with tests, welcome screen, dashboard and property views reading real data, sidebar with disabled modules.
- What I asked Claude Code to do: read CLAUDE.md and the PRD, propose a day-1 plan, then build it one step at a time, stopping after each step to run it myself.
- What it built, step by step:
  - Scaffolded Next.js 15 (App Router, TS strict, Tailwind v4, shadcn/ui, Vitest) into the existing repo.
  - Pure domain logic in `src/lib/domain` (due dates, status, balance, late fees, reminders, templates, money formatting), all in Africa/Lagos time, with 44 Vitest cases covering month-end and timezone edge cases.
  - Schema migration (`supabase/migrations/0001_init.sql`) and a server-only Supabase client.
  - A Supabase project, with `supabase/seed.ts` seeding the exact PRD portfolio (4 properties, 11 beds, 9 tenancies, ₦2,010,000 rent roll) by reusing the tested domain functions to generate payment/charge history, so derived statuses always match the PRD story relative to today.
  - Welcome screen (`/`) with the PRD's exact copy, shown once per browser session via sessionStorage, plus the app shell: a desktop sidebar and mobile bottom tab bar with Home/Properties/Messages live and Tenants/Payments/Payment history/Reports/Settings disabled with a lock icon and tooltip.
  - Dashboard (`/home`): Lagos-time greeting, expected revenue vs. collected so far, a properties/tenants summary strip, and a property card per property with real beds-filled, amount-owed and status-chip data, all computed server-side in `getDashboardData`.
  - Property view (`/properties/[id]`): one card per room (type, rent/bed, Auto/Manual reminder pill) with its beds as small status-coloured tiles; clicking a bed opens a tenant drawer (bottom sheet on mobile, panel on desktop) with contact details, next of kin, balance, next due date, payment history and recent messages, all read from `getPropertyDetail`.
- What went wrong and how it was fixed:
  - Turbopack couldn't fetch Google Fonts in this environment (local TLS interception from antivirus); switched Manrope to a self-hosted font so the build has no network dependency.
  - The hand-written `Database` type was missing fields (`Relationships`, `Views`, `Functions`) that supabase-js's generics need, so every query silently typed as `never`. Only surfaced once `seed.ts` became the first real caller — fixed and will need the same care if the type is edited by hand again before it's regenerated from the live schema.
  - `server-only` throws unconditionally outside Next's own module graph, so `seed.ts` can't import `src/lib/db/client.ts` — it creates its own Supabase client inline instead.
  - The same local TLS interception also broke live `fetch` calls to Supabase from Node intermittently (`unable to verify the first certificate`); fixed by running dev/build/start/seed with `NODE_OPTIONS=--use-system-ca` so Node trusts the OS certificate store.
  - A manual-mode room's reminder pill used `bg-muted`, which blended into the room card's own muted background and was effectively invisible — swapped it for an outlined style so Auto and Manual are both legible.
- Decisions: pasted the Supabase service-role key directly into `.env.local` via Claude Code (local file only, git-ignored, never committed) rather than me setting it up by hand. Scoped the property view to what's read-only and backed by seeded data — contact details, balance, payment history, recent messages — and left the "Add room"/"Edit property"/"Message" actions and the tenant drawer's document/timeline sections for day 2, matching the same call on the dashboard's action buttons.
- Not done yet: `/properties` (the properties list) and `/messages` are still placeholder stubs; all write actions are day 2.
- Commits: scaffold, domain logic, schema + client, seed script, welcome screen + app shell, dashboard, property view.

## Session 2, 2 November 2026: day 2 — every write action, messages, broadcasts, reminder job

- Goal: day 2 of the build plan — add property/room, onboarding with uploads, record payment, notice and check-out, messages, broadcasts, reminder job, auto/manual toggle, deploy.
- What I asked Claude Code to do: run through all of day 2 in one sitting rather than stopping after each step, same build-and-verify discipline as day 1.
- What it built, step by step, each committed and verified live before moving on:
  - Shared infra: toast notifications (sonner) and a reusable bottom-sheet/panel component (`Sheet`) that every form below uses.
  - Add property and add room, with bed/rent defaults by room type (`src/config/rules.ts`).
  - Tenant onboarding: guided form with the three required uploads (passport photo, driver's licence, one government ID) to a new private `tenant-docs` Storage bucket (created and emptied by `seed.ts`), 5MB/JPEG-PNG-WEBP-PDF limits, tenant starts "Verification pending".
  - Record payment (transfer/cash, one tap) with a WhatsApp receipt.
  - Push reminder, issue notice, check out (deposit refund/partial/kept) — each composes its WhatsApp message from the same shared templates and a reusable `WhatsAppSendButton` that tracks ready → opened → marked sent honestly.
  - Edit tenant/room/property, with delete blocked (clear message, not a raw DB error) whenever tenancy history exists for that room or property.
  - `/messages`: the real WhatsApp outbox, filterable by property/tenant/type/trigger.
  - Broadcasts at portfolio, property, room and tenant scope: template picker with merge-field preview, untick-anyone recipient list, then a step-through send queue (Open WhatsApp, Next) matching the PRD's one-chat-at-a-time flow.
  - Daily reminder job for Auto rooms (`/api/cron/reminders`, `vercel.json` at 08:00 UTC) plus a "Run today's reminders" button for demoing without waiting for the cron; dedupes against anything already sent today for that tenancy.
- What went wrong and how it was fixed:
  - Found three places in `seed.ts` where a message template's merge field was left blank or unformatted (`{room}` empty in the due-soon and notice messages, raw ISO dates instead of "d MMM yyyy" in due-soon and every receipt) — pre-existing gaps from day 1 that only became visible once the Messages page could show the whole history at once. Fixed all of them and threaded the room name through `seedTenancy`.
  - A manual-mode room's reminder-mode pill blending into its own card background came back once more on the edit-room pill until the outlined style was applied there too.
  - No other real bugs; the domain logic from day 1 (balance, due-date, status) held up correctly through every new action without changes.
- Decisions: deletion is blocked by an upfront "does any tenancy exist for this room/property" check rather than the schema's `ON DELETE RESTRICT`, so the operator always gets a clear message instead of a raw foreign-key error — this is slightly stricter than the PRD's literal "no active tenancies" (it also blocks on checked-out history), which is what the schema's RESTRICT constraints actually allow without a migration.
- Not done yet: deploy (needs my own GitHub and Vercel accounts — see below). Day 3: reset job and button, demo banner, mobile pass, dark mode, empty states, README.
- Commits: toasts + sheet, add property/room, storage bucket + seed dedupe, tenant onboarding, record payment, push reminder (+ seed fix), issue notice, check out (+ seed fix), edit tenant/room/property, messages page (+ seed fixes), broadcasts, reminder job.

## Session 3, 2 November 2026: design pivot

- Goal: the Revolut-style UI felt off. Find a direction I'd actually use, starting from the dashboard.
- What I asked Claude Code to do: three rounds of feedback with reference screenshots (Airtable, then Fireflies and Luma). The Luma dashboard became the reference board for every page.
- What it built:
  - Black and white dark theme, Inter (self-hosted, with the ₦ glyph), borderless graphite cards, no shadows. Colour only on status tags, chart lines and a small green brand mark. `PRODUCT.md` and `DESIGN.md` hold the rules; `CLAUDE.md`'s UI section now points at them.
  - Dashboard: two-tone greeting; "At a glance" with four Luma-style cards (Revenue, Payments due, Vacant beds, Properties), each with a sparkline built from tested helpers in `src/lib/domain/series.ts`; four quick actions (Send message, Add a room, View overdue, Add a tenant) with faded corner icons; properties as a table with free beds first.
  - A side panel that pushes the page narrower on desktop instead of covering it (bottom sheet on mobile). Tenant details and Configure rooms open in it, and `?bed=` deep links open a tenant from the dashboard.
  - Property page: no inline edit or address, "Active since", equal-weight Send message / Configure rooms, beds as rows with full names and labelled status tags, a labelled reminders switch. Shared rooms renamed Double.
- What went wrong and how it was fixed:
  - First pivot (green-tinted, coloured icon badges) read as too colourful; second still had too much colour. Settled on black and white with colour on tags only.
  - A dev `.next` cache got corrupted on Windows (ENOENT on `_buildManifest.js.tmp`); clearing `.next` fixed the blank page.
  - Found that `seed.ts` pins every move-in to July 2026, so the story only holds on one date (Babatunde shows Overdue instead of Due today from 2 Nov). Not fixed yet.
- Decisions: property editing moves to Settings (not in this demo); the server actions stay for then. Glance Revenue shows money collected in the last 30 days rather than a calendar month, so the line doesn't dip at the start of each month.
- Commits: dashboard trial, icon pass, side panel + property page, Luma board.

## Ideas (not in this build)

-
