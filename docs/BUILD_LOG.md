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

## Ideas (not in this build)

-
