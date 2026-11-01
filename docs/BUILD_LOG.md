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
- What went wrong and how it was fixed:
  - Turbopack couldn't fetch Google Fonts in this environment (local TLS interception from antivirus); switched Manrope to a self-hosted font so the build has no network dependency.
  - The hand-written `Database` type was missing fields (`Relationships`, `Views`, `Functions`) that supabase-js's generics need, so every query silently typed as `never`. Only surfaced once `seed.ts` became the first real caller — fixed and will need the same care if the type is edited by hand again before it's regenerated from the live schema.
  - `server-only` throws unconditionally outside Next's own module graph, so `seed.ts` can't import `src/lib/db/client.ts` — it creates its own Supabase client inline instead.
- Decisions: pasted the Supabase service-role key directly into `.env.local` via Claude Code (local file only, git-ignored, never committed) rather than me setting it up by hand.
- Not done yet: welcome screen, dashboard and property views (rest of day 1).
- Commits: scaffold, domain logic, schema + client, seed script.

## Ideas (not in this build)

-
