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

## Session 4, 2 November 2026: speed, Record payment, light mode

- Goal: clicking between pages felt slow; Record payment matters more than Add a room as a quick action; switch to light mode.
- What I asked Claude Code to do: make navigation smoother, swap the quick action, then (mid-task) move the whole app to light.
- What it built:
  - Measured first: each Supabase round trip from here costs ~210ms, and the property page made six of them one after another (messages page five). Rewrote both queries to fetch in parallel: property page 2 rounds, messages 1. Warm dev times went from 2.2s to 0.9s (property) and 1.7s to 0.6s (messages); a production build serves every page in 0.3 to 0.5s.
  - `loading.tsx` skeletons for Home, Properties, a property and Messages, so a click shows the page outline in ~40ms instead of freezing until the server answers.
  - Record payment quick action replaces Add a room (Add a room stays in each property's Configure rooms): every current tenant, soonest due first, with amount and status tag; pick one, choose Transfer or Cash, then send the WhatsApp receipt.
  - Light theme as the default: pale grey page, white borderless cards, ink primary buttons, darker chart colours for contrast. The dark tokens stay under `.dark` for a later switch. `DESIGN.md` updated.
- What went wrong and how it was fixed:
  - After recording, the panel re-read fresh data and showed next month's period and a Paid-in-advance status. Fixed by keeping a snapshot of the chosen tenant and flipping the tag to Paid on success.
  - The switch knob and the Unverified tag were hard-coded for dark mode; fixed for both themes.
  - "Record payment" wrapped to two lines in the half-width card on phones; the arrow now hides below 640px.
- Decisions: fetch small lookup tables (beds, tenancies, rooms) portfolio-wide rather than chaining dependent queries; at this portfolio size one parallel round beats several narrow ones. On Vercel, put the functions in the same region as the Supabase project to cut each round trip further.
- Seed dates fixed: `seed.ts` pinned every move-in to July 2026, so the story only held on one date. Each tenant's place in the story now lives in `supabase/story.ts` as "next unpaid rent is N days from today" plus months paid, and `moveInForNextDue` works back to a move-in date (trying a neighbouring month count when a month-end makes an exact date impossible). `supabase/story.test.ts` checks every tenant's status, Halima's single late fee and Emeka's 30+ days behind on every day of 2026 and 2027.
- Commits: perf + skeletons, record payment quick action, light mode, relative seed dates.

## Session 5, 2 November 2026: design polish brief

- Goal: a finish pass from a written brief, Stripe Dashboard feel: calm, light, soft colour, gentle depth, confident numbers. UX and flows unchanged.
- What I asked Claude Code to do: work through the brief page by page (tokens, frame, components, Home, properties, Messages, motion, accessibility), committing after each step.
- What it built:
  - Tokens for colour (green-tinted neutrals, semantic tones for meaning only), type scale, radius, layered shadows, easing and durations, all mapped into Tailwind.
  - One page frame aligned to the sidebar (no centred column); a 240px sidebar, a 64px icon rail at tablet width, a bottom tab bar with a More sheet on phones; locked items under "In the full version".
  - One button system, one StatusPill, one table, a 32x18 toggle, popover/menu/listbox/segmented control/tooltip, and one overlay Drawer that replaced the push-aside panel (zero layout shift, focus trap, Escape, focus returns to the row).
  - Home: revenue panel with change vs the previous 30 days and an area chart, a stat strip, a Needs attention rail and quick actions as a list. Property page: summary rail, compact room headers with an "Auto reminders" switch. Messages: segmented type filter, a Filter popover with chips, day groups, the same actions per stage.
  - Motion per the brief (route fade, row stagger, drawer, pill swaps, count-up and chart draw-in on the first visit only, toast Undo), all off under reduced motion.
- What went wrong and how it was fixed:
  - `cn` (tailwind-merge) didn't know the new type scale, so `text-stat-sm text-positive` silently lost its size. Configured it with the custom sizes and shadows.
  - Three pill tones fell short of 4.5:1 for small text (warning was 3.3:1). Added darker `-text` tokens for small text on tints and kept the brief's tones for fills, icons and large numbers.
  - A notice reason ending in a full stop produced "follow-up.." in the template; fillTemplate now drops the second stop. Em dashes removed from templates and seed data.
  - Tabular figures on whole message bodies widened hyphens in Inter ("follow -up"); now only ₦ amounts get them.
  - Lighthouse first ran against an old production server still holding port 3001. Stopped it and re-ran: accessibility 100 on every page.
- Decisions: kept Inter self-hosted by hand rather than via next/font, since next/font can't keep the latin/latin-ext unicode-range split that puts ₦ in Inter. Home stacks below 1280px (the Home section of the brief) while the property page keeps its rail from 1024px (the layout section). Marking a message opened or sent now writes an event, which also gives Sent its timestamp. Record payment's Undo removes the payment and receipt and logs a payment_undone event. Dark mode tokens were dropped; the brief is light only.
- Commits: tokens, frame and navigation, components, Home, property page, Messages, motion and contrast, docs.

## Session 6, 2 November 2026: real names, real rents, welcome screen

- Goal: make the demo read like someone's actual portfolio, and give the welcome screen more presence.
- What I asked Claude Code to do: rename properties the way an owner would, research what pay-monthly rooms actually cost in these areas around October 2026 and use that, drop Payments from the locked menu, and rework the welcome screen with new copy.
- What it built:
  - Properties renamed by area and layout: Lekki studio, Yaba studio (Akoka side), Surulere 3-bedroom, Ikota 2-bedroom.
  - Rents set per room from listings (Nigeria Property Centre's monthly filters, PropertyPro, Jiji, Flatmate): Lekki studio ₦500,000; Yaba ₦150,000; Surulere ₦65,000 / ₦85,000 / ₦120,000 per bed (triple, double, single); Ikota ₦150,000 per bed in the double, ₦250,000 for the single. Rent roll is now ₦1,370,000. Room-type defaults moved to mid-market mainland values.
  - Locked menu is Tenants, Payment history, Reports, Settings.
  - Welcome screen: "Hi there." headline, new copy ("I built this tool..."), a nightly-reset note, and a small preview card of today's rent status built from the seeded tenants.
- What went wrong and how it was fixed: the old rents were Lekki-level everywhere (₦280,000 for a Yaba self-contain against a market of about ₦100,000 to ₦150,000 a month furnished). Needs attention lowercased whole labels ("due 5 nov"); now only the first letter.
- Decisions: most Lagos rent is paid yearly upfront, so annual listings were only a floor; pay-monthly rooms are furnished and serviced and run two to three times the annual rate divided by twelve, which is the market this product is for. Names follow the actual layouts (Surulere has three rooms, Ikota two). Late fee (₦10,000) and caution deposit (₦100,000) are unchanged; ₦100,000 caution matches most listings.
- Commits: names and rents, locked menu, welcome screen.
- Follow-up, same session: market rents were the wrong lens. This is a business that leases units a year upfront, furnishes them and covers power, internet and cleaning, so rent has to be cost-plus. Added `supabase/pricing.ts` (lease plus 20% fees, furnishing over 36 months, bills, at 90% occupancy and a 20% margin, with a sharer discount per bed) and tests; the seed now takes rents from it. Rents: Lekki studio ₦795,000; Yaba ₦425,000; Surulere ₦170,000 / ₦215,000 / ₦285,000; Ikota ₦365,000 / ₦490,000. Rent roll ₦3,005,000. The welcome copy now says what the business is: monthly rentals, furnished, bills covered.

## Session 7, 2 November 2026: getting ready to publish

- Goal: put the code on my GitHub and give anyone a link to click around the app.
- What I asked Claude Code to do: push to GitHub so the link works like my portfolio.
- What it found: my portfolio is static and runs on GitHub Pages, but Nestwell needs a server (database writes, a secret key, scheduled jobs), so the code goes on GitHub and the live app on Vercel. The welcome screen promised a nightly reset that didn't exist yet.
- What it built:
  - The nightly reset: the seed moved into `src/lib/demo/seed.ts` (with the pricing model and demo story beside it), shared by `npm run db:seed` and a new `/api/cron/reset` route scheduled in `vercel.json` at 01:00 UTC (2:00am Lagos).
  - The seed now queues payments, charges, messages and events and writes one insert per table, and seeds tenants in parallel: 45 seconds down to under 10 from here, well inside a serverless time limit.
  - Cron routes refuse every request when `CRON_SECRET` isn't set, instead of accepting "Bearer undefined".
  - The build script no longer passes `--use-system-ca`, which only exists for my local network.
  - A proper README; branch renamed to `main`. Checked the whole git history for the service key and cron secret before publishing: never committed.
- What went wrong and how it was fixed: bulk inserts with rows that set different columns wrote null into `messages.created_at`; `defaultToNull: false` lets those columns use their defaults.

- Follow-up after going live: the welcome screen only showed once per browser tab, so a shared link straight to a page skipped it. It now works like a disclaimer: middleware sends every fresh page load (the browser's `Sec-Fetch-Dest: document` request) to the welcome screen with the requested page in `?next=`, and Continue goes there. In-app navigation is a background fetch, so it passes through. Next strips its own `RSC` header before middleware runs, which is why the check uses the browser's header instead.

## Ideas (not in this build)

-
