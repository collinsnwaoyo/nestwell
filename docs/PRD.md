# Nestwell PRD

Last updated: 1 November 2026. Owner: Collins.

## Overview

Nestwell is a working rent and occupancy manager for a fictional Lagos co-living operator: four properties, 11 beds, monthly rent, due-date tracking, and WhatsApp reminders and broadcasts. It's a portfolio prototype built with Claude Code and deployed on a public link, and it should feel like a tool someone runs their business on today.

It's presented as the tool Collins uses to run his own properties, opened up as a demo for the viewer. It grows out of the Venus operations board but is a separate product with its own repo. The Venus files stay untouched.

### Goals

- A visitor on the live link can do every core job without help: add a property, add rooms, onboard a tenant with documents, record rent, send a reminder or broadcast, issue notice and check someone out.
- The seeded data reads like a business in use: months of history, a late payer, a vacancy, a tenant on notice.
- Clean enough that another small operator could use it for the same kind of business.
- Shipped in 2 to 3 days, with a README that shows how it was built with Claude Code.

### Non-goals for this version

- Automated WhatsApp delivery through the Business API (click-to-chat links instead).
- Online payments, partial payments, real logins or user roles.
- Tenant-facing screens, maintenance tickets, expenses and P&L.

## The business: Nestwell

Nestwell runs four properties in Lagos, two of them on the Lekki axis, with 11 beds across four room types. Rent is paid monthly, one full month at a time. Each tenant also pays a refundable ₦100,000 caution deposit at move-in.

| Property | Area | Layout | Rooms and monthly rent per bed |
| --- | --- | --- | --- |
| Lekki studio | Lekki Phase 1 | Studio | 1 studio, ₦795,000 |
| Yaba studio (Akoka side) | Akoka, Yaba | Self-contained room, one tenant | 1 single, ₦425,000 |
| Surulere 3-bedroom | Surulere | 3-bedroom flat | 1 triple, ₦170,000; 1 double, ₦215,000; 1 single, ₦285,000 |
| Ikota 2-bedroom | Ikota GRA | 2-bedroom flat | 1 double, ₦365,000; 1 single, ₦490,000 |

Properties are named the way an owner talks about them (area and layout), not with a brand prefix.

### Pricing

The business leases each unit from a landlord a year upfront, furnishes it, and lets it room by room (or bed by bed) month to month with power, internet, cleaning and maintenance covered. Tenants just move in and pay monthly. Rent is cost-plus, computed by `src/lib/demo/pricing.ts`:

- Monthly cost = annual lease plus 20% agency and legal fees, divided by 12; plus furnishing written off over 36 months; plus the bills the business covers.
- Price per bed = monthly cost ÷ 90% occupancy ÷ (1 − 20% margin), split across beds with a sharer discount (a bed in a double is 0.75 of a private room, in a triple 0.6), rounded to ₦5,000.

| Unit | Lease / year | Furnishing | Bills / month | Monthly cost |
| --- | --- | --- | --- | --- |
| Lekki studio | ₦3,000,000 | ₦3,000,000 | ₦190,000 | ₦573,000 |
| Yaba studio (Akoka side) | ₦1,300,000 | ₦2,000,000 | ₦120,000 | ₦306,000 |
| Surulere 3-bedroom | ₦4,000,000 | ₦5,000,000 | ₦345,000 | ₦884,000 |
| Ikota 2-bedroom | ₦4,500,000 | ₦4,500,000 | ₦305,000 | ₦880,000 |

Inputs are October 2026 figures: leases from annual listings (Akoka self-contains about ₦1.2M to ₦1.3M; Lekki Phase 1 studios ₦2.5M to ₦3.5M; Ikota flats from Nigeria Property Centre and PropertyPro), bills at Band A power tariffs plus internet, cleaning and estate charges. The results sit inside the market for furnished, bills-included monthly rooms: Lekki and Ikota rooms of that kind list at ₦500,000 to ₦800,000 a month including power and service.

Room-type defaults for a new room (furnished, bills included), overridable per room:

| Room type | Beds | Default rent / bed / month |
| --- | --- | --- |
| Triple | 3 | ₦170,000 |
| Double | 2 | ₦250,000 |
| Single | 1 | ₦350,000 |
| Studio | 1 | ₦650,000 |

Seeded tenants, with about four months of payment and message history each. Statuses are as of the demo date (today).

| Tenant | Property and room | Status | Why it's there |
| --- | --- | --- | --- |
| Tolulope Adebayo | Lekki studio | Paid up | The calm, on-time tenant |
| Babatunde Lawal | Yaba studio, single | Due today | Shows the due-day reminder |
| Ifeoma Nwosu | Surulere, triple bed 1 | Paid up | |
| Halima Bello | Surulere, triple bed 2 | Overdue, late fee added | Shows grace, fine and the overdue reminder |
| (empty) | Surulere, triple bed 3 | Vacant bed | Vacancy at bed level |
| Kelechi Eze | Surulere, double bed 1 | Paid up | |
| Damilola Ogunleye | Surulere, double bed 2 | Due in 3 days | Shows the advance reminder |
| Emeka Obi | Surulere, single | Notice issued | Shows the eviction flow mid-way |
| Zainab Yusuf | Ikota, double bed 1 | Paid up, room on automatic reminders | Shows a room on automatic |
| Funmilayo Ajayi | Ikota, double bed 2 | Paid up | |
| (empty) | Ikota, single | Vacant room | Vacancy at room level |

That's 9 of 11 beds occupied and ₦3,005,000 of monthly rent roll. Seeded tenants get obviously fake sample documents. Every phone number in the seed (tenants, next of kin, emergency contacts) is Collins's own WhatsApp number, +234 702 576 2759 (stored as +2347025762759, used in links as wa.me/2347025762759), so any message a visitor sends from the demo lands with him.

## Core model

Everything hangs off one chain, property to room to bed to tenancy. Balances and statuses are worked out from payments, charges and events, never typed in by hand.

- Property: name, area, address, photo, notes.
- Room: type (triple, shared, single, studio), monthly rent per bed, and a reminder mode toggle, automatic or manual.
- Bed: created automatically from the room type's capacity. It's either vacant or holds one active tenancy.
- Tenant: the person and their onboarding documents.
- Tenancy: tenant on a bed, with move-in date, monthly rent, deposit and status (active, notice issued, checked out). The due day is the move-in day of the month.
- Payment: one full month against a tenancy, with method (transfer or cash), date and the month it covers.
- Charge: a late fee added to a tenancy.
- Message: a WhatsApp message (reminder, receipt, notice or part of a broadcast), with recipient, text, trigger (auto, manual or broadcast), status and a click-to-chat link.
- Broadcast: one message composed for a scope (portfolio, property, room or tenant), fanned out to one message per recipient.
- Event: an append-only log line for every change (checked in, paid, reminder sent, broadcast sent, notice issued, checked out). It powers each tenant's timeline and the activity feed.

## Welcome screen

The link opens on a single welcome screen that sits where a login would. It frames the product as Collins's own tool, opened up for the viewer.

- Layout: the Nestwell mark, a short note and one Continue button. No email or password fields.
- Copy: "Hi there." then "I built this tool to run my own monthly rental properties in Lagos: furnished rooms with power, internet and cleaning covered, so tenants just move in and pay month to month. I've opened up a demo copy so you can look around." A meta line: "The data resets every night." Button: "Continue". Beside the copy, a small preview of the demo's own rent status (three seeded tenants and the rent roll).
- Continue opens the app on the dashboard, signed in as Collins. There's no real authentication behind it.
- The welcome screen is only shown on first visit in a browser session; a small "About this demo" link in the sidebar brings it back.

## Features

There are two levels of navigation, portfolio then property, plus the actions that change data. Every action works on the live link.

### Dashboard (home)

- Greeting at the top: "Good morning, Collins" (changes with the time of day in Lagos).
- A summary strip under it with three numbers: Properties (4), Tenants (9 of 11 beds filled), and Expected revenue this month (₦3,005,000, with collected so far shown beneath it).
- Below that, one card per property: photo, name, area, beds filled (e.g. 5 of 6), amount owed, and a status chip if anyone is overdue or on notice. Clicking a card opens the property.
- No filters or search. With four properties they add clutter, not value.

### Sidebar

The left sidebar shows the full product so it reads like a real tool, but only some modules are live in the demo.

- Live: Home, Properties, Messages.
- Shown but disabled: Tenants, Payment history, Reports, Settings. Each is greyed out with a small lock and a "Not in this demo" tooltip, and nothing happens on click.
- Tenants and payments are still reachable inside properties, rooms and the tenant drawer. Only the standalone modules are disabled.

### Property view

- Every room as a card showing type, rent, its beds as small tiles coloured by status (paid, due soon, due today, overdue, notice, vacant), and the room's Auto/Manual reminder toggle.
- Clicking a bed opens the tenant drawer: contact details, next of kin, documents, move-in date, next due date, balance, payment history, messages sent and the full timeline.
- "Add room", "Edit property" and "Message" actions.

### Actions

1. Add property: name, area, address, optional photo. Then add rooms by picking a type; beds are created to match.
2. Add tenant (onboarding): a guided form from a vacant bed. Required: full name, WhatsApp number (+234 format), email, occupation or employer, next of kin (name, relationship, phone), emergency contact, passport photo, driver's licence upload, and one government ID upload with its type (NIN slip, international passport or voter's card). Then move-in date, rent (pre-filled from the room) and deposit. It won't submit until every required field and both documents are in. The tenant starts as "Verification pending" until the operator marks the documents verified.
3. Record payment: one tap marks the next unpaid month paid, picking transfer or cash. It shows a receipt and an optional "Send receipt on WhatsApp" message.
4. Push reminder: from any tenant or room, send the right reminder now. The message is pre-written with name, amount, due date and any late fee.
5. Issue notice: reason plus a move-out date. Status changes to Notice issued, with an optional WhatsApp notice message.
6. Check out (evict or move out): confirm the move-out date, settle the deposit (refund, part-deduct with a reason, or keep). The bed becomes vacant and the tenant's record and history stay.
7. Edit tenant, edit room rent and edit property. Deletion is only allowed for a room or property with no active tenancies.

### Messages (WhatsApp outbox)

Sending uses WhatsApp's click-to-chat links (`https://wa.me/<number>?text=<url-encoded message>`). Nothing external is needed: no API, account or approval. Clicking Send opens WhatsApp (app or web) with the chat and the message already typed. You can edit it there before pressing send.

- Every message is logged on the Messages page with its recipient, text, trigger (auto, manual or broadcast) and status.
- Statuses are honest about what the app can know: Ready, Opened in WhatsApp, and Marked sent (one tap after you've sent it). The app can't see WhatsApp delivery or read receipts without the Business API.
- "Automatic" rooms prepare their reminders on schedule and put them at the top of a Ready to send queue. Fully hands-off sending is a later phase on the Business API.
- Filters by property, tenant, type and trigger.

### Broadcasts

Message everyone at the level you're on: the whole portfolio, a property, a room or one tenant. This replaces typing the same update over and over in WhatsApp.

- A Message button sits on the dashboard, each property, each room and each tenant. It opens a composer already scoped to the people at that level, with the recipient count shown (e.g. "Surulere, 5 tenants").
- Starter templates: rent increase, maintenance or plumbing work, house rules reminder, general update, plus a blank message.
- Merge fields personalise each copy: {first name}, {room}, {property}, {rent}, {new rent}, {effective date}, {due date}.
- Preview shows the message as one recipient will see it, and you can untick anyone before sending.
- Sending runs as a queue: click-to-chat opens one chat at a time, so the composer steps through the recipients one by one, with each message pre-filled and a Next button. That's one tap per person, still far faster than typing.
- Each broadcast is saved as a single entry on the Messages page, expandable to show who it reached.

## Rent rules and reminders

Rent falls due on the tenant's move-in day each month. Three reminders go out around it, then a late fee after a 3-day grace period. Someone who moved in on the 14th pays on the 14th of every month. If that day doesn't exist in a month (moved in on the 31st), the due date is the last day of that month.

| When | What happens | Status after |
| --- | --- | --- |
| 3 days before due | "Rent due soon" reminder | Due soon |
| Due day, 9:00am | "Rent due today" reminder | Due today |
| 1 to 3 days late | Grace period, no fine | Overdue |
| 3 days late | ₦10,000 late fee added, "Rent overdue" reminder with the new total | Overdue |
| Still unpaid after that | Flagged on the property card and tenant drawer for the operator to issue notice | Overdue, flagged |

Notice is never issued automatically. The system flags the tenant and a person decides.

How the per-room toggle works:

- Automatic: a daily job (9:00am Lagos time) prepares each due reminder for that room's tenants, marked Auto, and puts it at the top of the Ready to send queue.
- Manual: the same reminders are generated only when the operator presses "Remind" on a room or tenant, or runs today's reminders.
- Either way, the operator can push any reminder manually at any time.

The grace days, late fee, reminder offsets and send time are fixed in config for the demo. The Settings module that would edit them is shown in the sidebar but disabled.

Message templates (stored in config):

- Due soon: "Hi {first name}, a reminder that your Nestwell rent of {amount} for {room} is due on {due date}. Thank you!"
- Due today: "Hi {first name}, your rent of {amount} is due today. Please pay to {account details} and send proof here."
- Overdue: "Hi {first name}, your rent is now {days} days overdue and a late fee of {fee} has been added. Total due: {total}."
- Receipt: "Thanks {first name}, we've received {amount} for {month}. Next due date: {next due}."
- Notice: "Hi {first name}, this is formal notice to vacate {room} by {date}. Reason: {reason}."

## Public demo

The live link has no login. Anyone can use every feature, and the data restores itself every night.

- Nightly reset at 2:00am Lagos time: a Vercel cron job wipes the tables and uploaded files, then re-runs the seed. Seeded dates are generated relative to today, so the story stays the same (Babatunde is always due today, Halima is always overdue).
- A "Reset demo" button in a thin demo banner does the same on demand. Useful right before a presentation.
- A "Run today's reminders" button runs the daily job immediately, so you can show automatic reminders live without waiting for 9:00am.
- An upload warning on the onboarding step: "Demo only, please don't upload real ID documents." Files go to a private storage bucket and are deleted at reset.
- Basic abuse limits: file size cap of 5 MB, images and PDFs only, and a rate limit on writes per visitor.
- Visitors share one dataset until the next reset.

## Design direction

The design follows Revolut's design language: big confident numbers, soft rounded cards, pill buttons and very little chrome. It borrows the patterns, not the brand. No Revolut logo, name or font files.

- Hero: the dashboard opens like a Revolut account screen. The greeting is small, Expected revenue this month is the large headline number, and a row of round icon buttons sits under it (Add tenant, Record payment, Message, Add property).
- Cards: large radius (about 20px), no borders, separated by soft surface contrast rather than lines. Property cards stack like Revolut's account and pocket cards.
- Lists: tenants and messages as Revolut-style transaction rows, with a round avatar or initials on the left, name and detail in the middle, and amount and status on the right.
- Controls: pill buttons, segmented pill tabs (e.g. Rooms / Tenants / Activity on a property), and bottom sheets on mobile for forms and the tenant drawer.
- Colour: near-white background in light mode, deep near-black in dark mode, one vivid accent for primary actions, and status in green, amber, red and purple used sparingly on chips only.
- Type: a geometric sans with tight, heavy headings (Manrope or Inter Display as a free stand-in), tabular figures for every amount, and Naira formatted as ₦280,000.
- Motion: quick, springy transitions when cards open into views, and a count-up on the headline numbers on first load.
- Mobile first: it should feel like an app on a phone, with the sidebar collapsing to a bottom tab bar.

## Tech stack and deployment

Next.js (App Router, TypeScript) on Vercel, with Supabase for Postgres and file storage. The whole thing ships from a new GitHub repo, `nestwell`, pushed from Claude Code.

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js 15, TypeScript, server actions | One codebase for UI and backend logic |
| UI | Tailwind CSS + shadcn/ui, Lucide icons, Framer Motion | Fast to build, polished out of the box |
| Database | Supabase Postgres | Real relational data, free tier |
| Files | Supabase Storage, private bucket | ID and licence uploads, signed URLs to view |
| Scheduled jobs | Vercel Cron: reminders 9:00am, reset 2:00am (Lagos) | Free tier allows daily jobs |
| Dates | date-fns + @date-fns/tz, all due-date maths in Africa/Lagos | Avoids off-by-one days |
| Tests | Vitest for the due-date, fee and status logic | The part that must be right |

Tables (Supabase):

```
properties(id, name, area, address, photo_url, created_at)
rooms(id, property_id, name, type, rent_per_bed, reminder_mode)  -- auto | manual
beds(id, room_id, label)
tenants(id, full_name, phone, email, occupation, next_of_kin_name,
        next_of_kin_relation, next_of_kin_phone, emergency_contact,
        photo_url, licence_url, gov_id_type, gov_id_url, verified)
tenancies(id, bed_id, tenant_id, move_in, rent, deposit, status,
          notice_reason, move_out, deposit_outcome)
payments(id, tenancy_id, period_month, amount, method, paid_at)
charges(id, tenancy_id, kind, amount, created_at)          -- late_fee
broadcasts(id, scope_type, scope_id, template, body, created_at)
messages(id, tenancy_id, broadcast_id, phone, template, body, trigger,
         status, wa_link, created_at)                       -- trigger: auto | manual | broadcast
events(id, tenancy_id, type, payload jsonb, created_at)    -- append-only
```

Next due date, balance and bed status are computed in one shared module from tenancies, payments and charges, never stored. Rent rules and templates live in a config file, not a table.

Deployment steps:

1. Create the repo and push from Claude Code.
2. Create a free Supabase project, run the schema migration and seed script.
3. Import the repo into Vercel and add the Supabase URL, service key and a cron secret as environment variables.
4. Check the cron jobs and the live link, then add the link to the README.

## Build plan

Three days, with the deployed link live by the end of day 2 and day 3 for polish and the write-up.

| Day | Build | Done when |
| --- | --- | --- |
| 1 | Repo, schema, seed script, due-date and fee logic with tests, welcome screen, dashboard and property views reading real data, sidebar with disabled modules | Seeded portfolio renders correctly with the right statuses |
| 2 | Add property and room, onboarding with uploads, record payment, notice and check-out, messages, broadcasts, reminder job, auto/manual toggle, deploy | Every action works on the live link |
| 3 | Reset job and button, demo banner, mobile pass, dark mode, empty states, README with screenshots and the Claude Code build log | A stranger can use it cold and the README tells the story |

Acceptance checks before sharing the link:

- [ ] Dashboard numbers match a hand count of the seed (4 properties, 9 of 11 beds, expected revenue ₦3,005,000), and Continue on the welcome screen lands on "Good morning, Collins".
- [ ] Onboarding blocks submission without both documents and a valid +234 number.
- [ ] Recording a payment moves the due date forward one month and clears the status.
- [ ] Switching a room to Automatic and pressing "Run today's reminders" creates the right messages in the outbox.
- [ ] A property broadcast with a merge field opens WhatsApp once per recipient with the right personalised text.
- [ ] Notice then check-out frees the bed, and the tenant stays in history.
- [ ] Reset brings back the exact demo story.
- [ ] Usable at 375 px wide.

Later phases, deliberately out of this build: WhatsApp Business API for hands-off sending and delivery receipts, Paystack virtual accounts, partial payments, operator and staff logins, the Tenants, Payment history, Reports and Settings modules, expenses and P&L, maintenance requests, a tenant-facing view.

Risks:

- Time. Three days only works if scope holds, so new ideas go on the later list.
- Timezones. Due-date bugs are the easiest way to look broken in a demo; tests cover month-ends and the Lagos offset.
- Public uploads. Someone may upload a real ID; the warning, size limits and nightly wipe keep that contained.
- Free-tier limits. Supabase pauses free projects after a week of inactivity; the nightly reset writes to the database every day.
- Public phone number. Collins's number is visible on every seeded record and link.

Open question: the company and role this is for, so the README and build log speak to what they asked for.
