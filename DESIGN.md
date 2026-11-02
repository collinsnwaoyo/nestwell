---
name: Nestwell
description: Rent and occupancy manager for a fictional Lagos co-living operator — Airtable-flat, Envato-green, dark-mode-first.
colors:
  envato-green: "oklch(0.64 0.145 142)"
  envato-green-ink: "oklch(0.16 0.01 142)"
  night-charcoal: "oklch(0.16 0.006 142)"
  slate-panel: "oklch(0.205 0.007 142)"
  bone: "oklch(0.94 0.004 142)"
  moss-muted: "oklch(0.65 0.01 142)"
  hairline: "oklch(1 0 0 / 8%)"
  alert-red: "oklch(0.704 0.191 22.216)"
typography:
  display:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
components:
  stat-card:
    backgroundColor: "{colors.slate-panel}"
    textColor: "{colors.bone}"
    rounded: "{rounded.lg}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.envato-green}"
    textColor: "{colors.envato-green-ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
---

# Design System: Nestwell

## 1. Overview

**Creative North Star: "The Operator's Ledger"**

Nestwell is being pivoted away from its original Revolut-flavored softness toward something that reads like a tool built for someone who runs real numbers every day: flat, structured, Airtable-adjacent. The surface stays quiet — dark, tinted-neutral panels with a single confident green doing the talking — so that the only thing competing for attention is the data itself: who owes rent, who's due today, what's collected this month.

This system explicitly rejects the project's own starting point: oversized glowing hero numbers, heavy pill/bubble chrome, and soft drop-shadow bloom (Revolut's fintech-consumer register). It also rejects the generic SaaS-dashboard reflex of gradient-text metrics and rows of identical icon-and-heading filler cards. Depth comes from one deliberate lightness step between page and panel plus a hairline border, never from shadow.

**Key Characteristics:**
- Flat, dark-mode-first panels, tinted toward the brand green rather than true black/grey.
- One accent color (Envato-style green) used sparingly: primary actions, the one metric that should pop, status chips.
- Equal-weight stat cards instead of one oversized hero number — properties, tenants, and revenue sit as peers.
- Tight corners (6–10px) and hairline borders instead of 20px pill-soft radii.

## 2. Colors

A tinted-neutral dark base (never pure black) with a single olive-leaning green accent carrying all emphasis. Status colors (paid / due / overdue / notice) stay confined to chips — they are information, not atmosphere.

### Primary
- **Envato Green** (`oklch(0.64 0.145 142)`, ≈ `#5fa33c`): the one accent. Primary buttons, active/selected states, the single figure on the dashboard that should read as "good news" (collected revenue), icon badges. Flat fill, no glow, no gradient.

### Neutral
- **Night Charcoal** (`oklch(0.16 0.006 142)`, ≈ `#15190f`): page background. Barely green-tinted, not a true `#000`.
- **Slate Panel** (`oklch(0.205 0.007 142)`, ≈ `#1c2117`): card/panel background — one deliberate lightness step above the page, the only "elevation" this system uses.
- **Bone** (`oklch(0.94 0.004 142)`, ≈ `#ececea`): primary text.
- **Moss Muted** (`oklch(0.65 0.01 142)`, ≈ `#9aa092`): secondary text, labels, captions.
- **Hairline** (`oklch(1 0 0 / 8%)`): the only border/divider token. 1px, always.

### Named Rules
**The Flat Ledger Rule.** No `box-shadow` carries visual weight anywhere in this system. Depth is one lightness step (background → panel) plus a 1px hairline border. If it needs a shadow to read as a card, the contrast step is wrong, not the shadow.

**The One Voice Rule.** Envato Green appears on primary actions, one hero metric, and status-chip fills only. If more than roughly a third of a screen is green, pull it back — its rarity is what makes it read as a decision, not decoration.

## 3. Typography

**Display Font:** Manrope (self-hosted variable font, weights 200–800), with `system-ui, sans-serif` fallback.
**Body Font:** Manrope.

**Character:** A single geometric-leaning grotesque sans used at every scale — no serif, no mono accent. Hierarchy comes from size and weight, not from mixing families.

### Hierarchy
- **Display** (700, `clamp(1.75rem, 4vw, 2.5rem)`, 1.1): the "Good morning, Collins" greeting — the single largest, most dominant line on the dashboard.
- **Title** (600, 1.5rem, 1.2): section headings ("Properties"), card values that need to anchor a stat card.
- **Body** (400, 0.9375rem, 1.5): list rows, descriptions, secondary copy.
- **Label** (500, 0.8125rem, 1.3): stat-card captions, chip text, muted metadata lines.

### Named Rules
**The Tabular Money Rule.** Every Naira figure and every numeric count renders with `font-variant-numeric: tabular-nums`, no exceptions, so columns of figures stay scannable.

## 4. Elevation

Flat by default, everywhere. There is no shadow vocabulary in this system — depth is conveyed by exactly one lightness step (Night Charcoal → Slate Panel) plus a 1px Hairline border. Interactive states (hover on a list row) shift background lightness slightly; they never introduce a shadow.

### Named Rules
**The No-Glow Rule.** Buttons, badges, and cards never emit a colored glow (no `box-shadow` using the accent color, no blurred colored halos). This was the single biggest complaint about the previous Revolut-style system and is now a hard ban.

## 5. Components

### Buttons
- **Shape:** 8px radius (`rounded.md`), not a pill.
- **Primary:** Envato Green fill, Envato Green Ink text, `10px 20px` padding, flat — no shadow, no gradient.
- **Hover / Focus:** a single-step lightness shift on the fill; focus ring uses the accent at reduced opacity, no glow blur.
- **Secondary / Ghost:** Slate Panel background (secondary) or transparent with Hairline border (ghost); text in Bone.

### Chips
- **Style:** flat fill in the status color at reduced opacity, full text contrast, no border, small rounded rectangle (6px), never a glowing pill.
- **State:** one fill per status (paid / due soon / due today / overdue / notice / vacant); no animation.

### Cards / Stat Cards
- **Corner Style:** 10px (`rounded.lg`) — noticeably tighter than the original 20px.
- **Background:** Slate Panel on Night Charcoal.
- **Shadow Strategy:** none (see Elevation). The lightness step is the only depth cue.
- **Border:** 1px Hairline.
- **Internal Padding:** 20px.
- **Equal-hierarchy rule:** the three dashboard stat cards (Properties, Tenants, Revenue) render at identical size, weight, and type scale. None is allowed to dominate the others — that imbalance is exactly what's being corrected.

### Inputs / Fields
- **Style:** Slate Panel background, Hairline border, 8px radius.
- **Focus:** border shifts to Envato Green at full opacity; no glow.

### Navigation
- Sidebar/tab bar keep their current structural role; restyle to Night Charcoal background with Hairline dividers and Envato Green for the active-item indicator (flat fill or left-edge accent via background tint, never a decorative colored stripe).

## 6. Do's and Don'ts

### Do:
- **Do** keep every panel one lightness step above the page background, with a 1px Hairline border — that's the whole elevation system.
- **Do** keep Envato Green confined to primary actions, the one hero metric, and chip fills.
- **Do** render every stat card (Properties, Tenants, Revenue) at the same visual weight — no single card may be larger or bolder than its siblings.
- **Do** use tabular figures on every Naira amount and count.

### Don't:
- **Don't** reintroduce Revolut-style softness: no oversized glowing hero numbers, no heavy pill/bubble chrome, no soft drop-shadow bloom.
- **Don't** use `box-shadow` for elevation anywhere — flat panels plus a hairline border only.
- **Don't** use gradient-text for any metric or heading.
- **Don't** build rows of identical icon+heading+text filler cards — every card on screen should carry a specific, real number.
- **Don't** reach for a modal/bottom-sheet as the first answer for tenant/room detail (the team is moving toward a push-aside side panel instead); treat overlay sheets as a fallback, not the default.
- **Don't** use `border-left`/`border-right` as a colored accent stripe on any card, row, or chip.
