# Nestwell

A rent and occupancy manager for a small Lagos co-living business: furnished rooms with power, internet and cleaning covered, let month to month. It tracks who owes what across properties, rooms and beds, and drives rent reminders and broadcasts over WhatsApp.

It's a working portfolio prototype, built with [Claude Code](https://claude.com/claude-code), presented as the tool I use to run my own properties and opened up as a demo.

**Live demo:** _link coming once it's deployed_

## What you can do

- See the month at a glance: revenue collected, payments due, vacant beds, and a list of who needs attention today.
- Browse properties, rooms and beds, each with a status: paid, due soon, due today, overdue, notice issued or vacant.
- Open a tenant to see their balance, payment history and messages, record a payment (with undo), push a reminder, issue notice or check them out.
- Onboard a new tenant into a vacant bed, with document uploads.
- Send WhatsApp messages and broadcasts to a tenant, a room, a property or everyone, stepping through one chat at a time.
- Turn on automatic reminders per room: 3 days before rent is due, on the day, and at 3 days late, when a ₦10,000 late fee is added.

There's no login. The demo opens on a welcome note; everything else works on real data.

## How it's built

- **Next.js 15** (App Router, server actions), **TypeScript** strict, **Tailwind CSS v4**, Framer Motion.
- **Supabase** Postgres and Storage, accessed server-side only.
- **Vitest** for the domain logic: due dates (including month-end), statuses, balances, late fees, reminder timing and the pricing model. All date maths runs in `Africa/Lagos`.
- WhatsApp through click-to-chat links (`wa.me`), so messages are tracked honestly as ready, opened or sent, never "delivered".

```
src/app/            routes: welcome, home, properties, property detail, messages, cron
src/components/     UI, with shared primitives in components/ui
src/lib/domain/     pure, tested business rules
src/lib/db/         Supabase client and queries
src/config/rules.ts grace days, late fee, reminder offsets, message templates
supabase/           schema, demo seed, pricing model, demo story
docs/               PRD and build log
```

The demo data is generated relative to today, so the story always holds: one tenant due today, one due in three days, one overdue with a late fee, one on notice, two vacant beds. Rents come from a cost-plus model of the business (lease, furnishing and bills, at 90% occupancy and a 20% margin); see `supabase/pricing.ts` and the PRD.

The design system is in [`DESIGN.md`](DESIGN.md), product intent in [`PRODUCT.md`](PRODUCT.md), the spec in [`docs/PRD.md`](docs/PRD.md), and how it was built, session by session, in [`docs/BUILD_LOG.md`](docs/BUILD_LOG.md).

## Run it locally

You'll need Node 20+ and a Supabase project.

1. Copy `.env.example` to `.env.local` and fill in your Supabase URL, service role key and a cron secret.
2. Apply `supabase/migrations/0001_init.sql` to your database.
3. Install and seed:

   ```bash
   npm install
   npm run db:seed
   ```

4. Start it with `npm run dev` and open http://localhost:3000.

Other commands: `npm test`, `npm run lint`, `npm run build`.
