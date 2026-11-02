---
name: Nestwell
description: Rent and occupancy manager for a fictional Lagos co-living operator. Black and white, Luma-style, colour only where it carries meaning.
colors:
  ink-black: "oklch(0.155 0.002 260)"
  panel-graphite: "oklch(0.212 0.003 260)"
  sidebar-graphite: "oklch(0.19 0.003 260)"
  raised-graphite: "oklch(0.255 0.003 260)"
  paper-white: "oklch(0.97 0 0)"
  ash-grey: "oklch(0.66 0.005 260)"
  hairline: "oklch(1 0 0 / 7%)"
  envato-green: "oklch(0.72 0.16 142)"
  chart-green: "oklch(0.74 0.15 150)"
  chart-amber: "oklch(0.78 0.14 70)"
  chart-blue: "oklch(0.68 0.13 250)"
  chart-violet: "oklch(0.70 0.13 300)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  section:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
components:
  card:
    backgroundColor: "{colors.panel-graphite}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
    padding: "16px"
  button-primary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System: Nestwell

## 1. Overview

**Creative North Star: "The Quiet Ledger"**

The home dashboard is the reference board for every page. It follows Luma's product UI: near-black page, graphite cards with no borders, a lighter sidebar, bold white headings, grey supporting text, and almost no colour. The interface is black and white so that the few coloured things carry meaning: a status tag says something is wrong, a chart line says which way a number is moving.

This system rejects the project's starting point (Revolut-style glowing hero numbers, pill buttons, soft shadows) and also the first pivot attempt (a green-tinted surface with coloured icon badges on every card), which read as too colourful.

**Key Characteristics:**
- Black and white surfaces; colour on status tags, chart lines and the small brand mark only.
- Sections separated by a hairline rule, each with a bold title and an optional right-hand aside (a date, a "+ Create").
- Borderless graphite cards on a near-black page; depth comes from one lightness step.
- Detail views open in a push-aside side panel on desktop, a bottom sheet on mobile.

## 2. Colors

Neutral greys with the faintest cool cast, so the page reads as black and white rather than tinted.

### Primary
- **Envato Green** (`oklch(0.72 0.16 142)`): the brand mark. Used for the logo square, the active nav item, and switches that are on. Never on buttons, cards or text blocks.

### Secondary (chart lines and glance figures only)
- **Chart Green** (`oklch(0.74 0.15 150)`): money coming in (Revenue).
- **Chart Amber** (`oklch(0.78 0.14 70)`): money coming due (Payments due).
- **Chart Blue** (`oklch(0.68 0.13 250)`): occupancy (Vacant beds).
- **Chart Violet** (`oklch(0.70 0.13 300)`): portfolio size (Properties, rent roll).

### Neutral
- **Ink Black** (`oklch(0.155 0.002 260)`): page background.
- **Sidebar Graphite** (`oklch(0.19 0.003 260)`): the sidebar, a step lighter than the page.
- **Panel Graphite** (`oklch(0.212 0.003 260)`): cards, list containers, the side panel.
- **Raised Graphite** (`oklch(0.255 0.003 260)`): hover and selected rows, muted fills.
- **Paper White** (`oklch(0.97 0 0)`): primary text and the primary button.
- **Ash Grey** (`oklch(0.66 0.005 260)`): captions, labels, secondary text, faded corner icons.
- **Hairline** (`oklch(1 0 0 / 7%)`): section rules and dividers between list rows.

### Status tags
Paid green, Due soon / Due today amber, Overdue red, Notice issued purple, Vacant grey. Each is a small rounded tag with a 10 to 15% fill of its colour and full-strength text. These are the loudest colour on any screen.

### Named Rules
**The Tags Speak Rule.** Status colour lives only on labelled tags. A row, tile, card or banner is never filled with a status colour; put a tag inside it instead.

**The Black and White Rule.** If colour appears anywhere other than a tag, a chart line, a glance figure or the brand mark, remove it. Primary buttons are white, not green.

## 3. Typography

**Font:** Inter (self-hosted variable, both latin and latin-ext subsets so ₦ renders in Inter), falling back to the system UI font. Inter is the closest web font to the SF Pro look of the Luma reference.

### Hierarchy
- **Display** (700, 26px, 1.25): page titles and the greeting name.
- **Section** (600, 18px, 1.3): section titles ("At a glance", "Quick actions", "Properties", "Rooms").
- **Title** (600, 15px): card titles, quick-action labels, room names.
- **Body** (400 to 500, 14px, 1.5): list rows, tenant names, form text.
- **Caption** (400, 12px): card captions ("Last 30 days"), axis labels, column headers.

### Named Rules
**The Two-Tone Greeting Rule.** The greeting is two lines at the same size: "Good morning," in Ash Grey regular, the name in Paper White bold.

**The Tabular Money Rule.** Every ₦ amount and count uses tabular figures.

## 4. Elevation

Flat. No shadows anywhere. Depth is the lightness step from page to card (or sidebar), and hairline rules between sections and rows. Hover raises a row or card one more step to Raised Graphite.

## 5. Components

### Section
A hairline rule on top, then a Section-weight title with an optional aside on the right (date, "+ Create", "View all"). Sections are spaced 32px apart.

### Glance card (signature)
Graphite card, no border, 16px padding. Top left: title and a one-line caption. Top right: the figure in its chart colour, regular weight, 24px. Below: a sparkline in the same colour over a dashed baseline, then three axis captions (start, what the line measures, end). Four of them in a 2×2 grid on desktop, stacked on mobile.

### Quick action card
Short graphite card (64px tall): bold label with a grey arrow, and a large faded grey icon (48px, 30% opacity, thin stroke) clipped into the bottom-right corner. 2×2 grid at every width. Each opens a side panel or the composer.

### List container (properties, rooms)
One graphite card holding rows separated by hairlines. Desktop shows a caption-sized column header row. No icons on rows; a grey chevron on the right. Properties list puts beds available first.

### Buttons
- **Primary:** Paper White fill, Ink Black text, 8px radius.
- **Outline:** transparent with a hairline border, white text. Used for most actions, including Issue notice and Check out.
- **Destructive:** red, only on the final confirm step of a destructive action.

### Side Panel
On desktop (≥1024px) a right-hand panel sits beside the page and pushes the main column narrower; it never covers the page. Panel Graphite, hairline left edge, sticky header with a close button, Escape closes, one open at a time. Below 1024px it becomes a bottom sheet. Pages can open it from the URL (`?bed=`).

### Room card
Room name and "N beds · ₦X/bed" header; one row per bed with the label, tenant's full name, status tag and chevron; vacant beds read "+ Add tenant". Footer: a labelled switch, "Reminders: Automatic / Manual", with a one-line explanation.

### Navigation
Sidebar Graphite background, 15px medium labels with 20px outline icons, active item in Envato Green (no fill), disabled items faded with a lock. Owner initial and name at the bottom. Mobile uses a bottom tab bar.

## 6. Do's and Don'ts

### Do:
- **Do** treat the home dashboard as the reference board for every new page.
- **Do** keep surfaces black and white; let tags and chart lines carry the colour.
- **Do** separate sections with a hairline rule and a bold section title.
- **Do** use faded grey corner icons on quick-action cards, and no icons on list rows.
- **Do** open details in the side panel on desktop.

### Don't:
- **Don't** reintroduce Revolut-style softness: glowing hero numbers, pill buttons, drop shadows.
- **Don't** put coloured icon badges on cards, or colour a whole row, tile or banner by status.
- **Don't** make primary buttons green; they're white.
- **Don't** add borders to cards; the lightness step is enough.
- **Don't** use gradient text, glassmorphism or side-stripe borders.
