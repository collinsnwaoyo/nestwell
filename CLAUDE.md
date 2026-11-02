# Nestwell

Nestwell is a rent and occupancy manager for a fictional Lagos co-living operator. It's a public portfolio prototype that should feel like a tool Collins uses every day. The full spec is in `docs/PRD.md`. Read it before starting any feature. If the PRD and this file disagree, the PRD wins. If the PRD is silent, ask.

## Ground rules

- Never read, edit or move anything in `../Venus`. That's a live business folder.
- Build in the order of the PRD build plan (day 1, day 2, day 3). Don't add features that aren't in the PRD. Put new ideas under "Ideas" in `docs/BUILD_LOG.md` instead.
- Work in small steps: one feature, run it, test it, commit. Use conventional commit messages (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- At the end of each working session, add an entry to `docs/BUILD_LOG.md` (what was asked, what was built, what went wrong, what was decided). Keep entries short.
- Never commit secrets. `.env.local` stays out of git; keep `.env.example` up to date.

## Stack

- Next.js 15 (App Router), TypeScript strict, server actions for writes.
- Tailwind CSS + shadcn/ui, Lucide icons, Framer Motion for transitions.
- Supabase: Postgres and Storage (private bucket `tenant-docs`). Server-side access only, via the service role key. The browser never talks to Supabase directly.
- date-fns + @date-fns/tz. All date maths in `Africa/Lagos`.
- Vitest for domain logic.
- Deployed on Vercel. Cron in `vercel.json`: reminders at 08:00 UTC (9:00am Lagos), reset at 01:00 UTC (2:00am Lagos). Cron routes check `Authorization: Bearer ${CRON_SECRET}`.

## Scaffolding note

`create-next-app` refuses a folder that already has files in it. Scaffold into a temporary subfolder (for example `npx create-next-app@latest tmp-app --ts --tailwind --app --src-dir --eslint --use-npm`), move its contents up to the root, merge `.gitignore`, then delete `tmp-app`. Keep `CLAUDE.md` and `docs/` where they are.

## Suggested structure

```
src/app/                 routes: / (welcome), /home, /properties/[id], /messages
src/app/api/cron/        reminders, reset
src/components/          UI, incl. components/ui for shadcn
src/lib/domain/          due dates, status, balances, reminders, templates (pure, tested)
src/lib/db/              Supabase client and queries
src/config/rules.ts      grace days, late fee, offsets, send time, templates
supabase/migrations/     schema SQL
supabase/seed.ts         demo seed, dates relative to today
docs/                    PRD.md, BUILD_LOG.md
```

## Domain rules (must have unit tests)

- Rent is monthly, paid one full month at a time. No partial payments.
- The due day is the tenant's move-in day of the month. If that day doesn't exist in a month, use the last day of that month.
- Reminders: 3 days before, on the due day at 9:00am, then at 3 days late.
- Grace is 3 days. At 3 days late, add one ₦10,000 late fee charge per missed month, once only.
- Unpaid after that: flag for notice. Never issue notice automatically.
- Statuses: paid, due soon, due today, overdue, notice, vacant. Balances and statuses are derived from tenancies, payments and charges, never stored.
- Every change writes an append-only row to `events`.
- Money is stored as integer Naira. Display as `₦280,000` with `Intl.NumberFormat('en-NG')` and tabular figures.

## WhatsApp

- No API. Messages are sent with click-to-chat links: `https://wa.me/<digits>?text=<encodeURIComponent(body)>`, opened in a new tab.
- Phone numbers are stored in E.164 (`+2347025762759`). The link uses digits only (`2347025762759`).
- Message statuses: ready, opened, marked_sent. Never claim delivered or read.
- Broadcasts fan out to one message per recipient with merge fields filled in, and send as a step-through queue (one chat at a time, Next button).

## Seed data

- Follow the property, room and tenant tables in the PRD exactly: 4 properties, 11 beds, 9 occupied, ₦2,010,000 monthly rent roll.
- Every phone number in the seed (tenant, next of kin, emergency contact) is `+2347025762759`.
- Seeded documents are obvious placeholder images marked "SAMPLE". Never generate anything that looks like a real ID.
- Generate dates relative to today so the story always holds: Babatunde Lawal due today, Damilola Ogunleye due in 3 days, Halima Bello overdue with a late fee, Emeka Obi on notice, Ikota shared room on automatic.
- About four months of payment and message history per tenant.

## UI rules

- The visual system lives in `DESIGN.md` (and `PRODUCT.md` for intent). It supersedes the original Revolut-style direction: Luma-style black and white, light by default (dark tokens kept for a later switch), Inter, borderless cards, no shadows. The home dashboard is the reference board for every page.
- Detail views (tenant, Configure rooms) open in the push-aside side panel on desktop and a bottom sheet on mobile.
- Status colours only on labelled chips, never on whole tiles or cards.
- Font: Inter (self-hosted in `public/fonts`). Tabular figures for amounts.
- Mobile first. It must work at 375px wide, with a bottom tab bar on mobile and a sidebar on desktop.
- Sidebar: Home, Properties and Messages are live. Tenants, Payments, Payment history, Reports and Settings are visible but disabled, with a lock icon and a "Not in this demo" tooltip.
- The welcome screen at `/` has no login fields, just the note and a Continue button. After Continue, the greeting is "Good morning / afternoon / evening, Collins" in Lagos time.
- Every action ends in a toast. Every empty state has a next action.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
DEMO_OWNER_NAME=Collins
DEMO_OWNER_PHONE=+2347025762759
```

## Commands

Fill these in once scaffolded: `npm run dev`, `npm test`, `npm run lint`, `npm run db:seed`.

## Definition of done

The acceptance checks at the end of `docs/PRD.md` all pass on the deployed link.
