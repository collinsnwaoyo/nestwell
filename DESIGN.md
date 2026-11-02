---
name: Nestwell
description: Rent and occupancy manager for a fictional Lagos co-living operator. Calm, light and precise, in the manner of the Stripe Dashboard; colour only where it means something.
colors:
  bg: "oklch(0.975 0.004 150)"
  surface: "oklch(0.995 0.002 150)"
  surface-sunk: "oklch(0.96 0.005 150)"
  border: "oklch(0.91 0.006 150)"
  border-strong: "oklch(0.85 0.008 150)"
  text: "oklch(0.22 0.012 150)"
  text-2: "oklch(0.45 0.012 150)"
  text-3: "oklch(0.58 0.01 150)"
  primary: "oklch(0.24 0.012 150)"
  positive: "oklch(0.55 0.13 150)"
  warning: "oklch(0.62 0.14 70)"
  danger: "oklch(0.55 0.17 27)"
  info: "oklch(0.55 0.11 250)"
typography:
  display: { fontFamily: Inter, fontSize: 28px, lineHeight: 34px, fontWeight: 600, letterSpacing: -0.02em }
  h2: { fontFamily: Inter, fontSize: 17px, lineHeight: 24px, fontWeight: 600, letterSpacing: -0.01em }
  h3: { fontFamily: Inter, fontSize: 15px, lineHeight: 22px, fontWeight: 600 }
  body: { fontFamily: Inter, fontSize: 14px, lineHeight: 21px, fontWeight: 400 }
  meta: { fontFamily: Inter, fontSize: 12.5px, lineHeight: 18px, fontWeight: 450 }
  stat: { fontFamily: Inter, fontSize: 32px, lineHeight: 36px, fontWeight: 600, letterSpacing: -0.02em }
  stat-sm: { fontFamily: Inter, fontSize: 22px, lineHeight: 28px, fontWeight: 600 }
rounded:
  control: 6px
  card: 10px
  round: 999px
---

# Design System: Nestwell

## 1. Overview

Calm, light and precise, in the manner of the Stripe Dashboard: a soft grey-green page, white surfaces with a hairline border and a very soft layered shadow, confident numbers, considered charts. Not flashy and not monochrome-brutal. Every token lives in `src/app/globals.css` and is mapped into Tailwind; components never use raw colours, radii, shadows or durations.

This replaces two earlier directions: the original Revolut-style softness and the black-and-white Luma board.

## 2. Colour

Neutrals lean slightly green; nothing is pure black or white.

- **Surfaces**: `--bg` page and sidebar, `--surface` cards, tables and drawers, `--surface-sunk` insets (balance box, hovered and selected rows).
- **Text**: `--text` primary, `--text-2` secondary and meta (7:1 on surface), `--text-3` for placeholders and disabled items only.
- **Primary action**: near-black `--primary`, hover `--primary-hover`.
- **Semantic, for meaning only**: positive (collected, paid), warning (due), danger (overdue, notice), info (opened), each with a `-bg` tint. Small text on a tint uses the matching `-text` token, one step darker, so pills clear 4.5:1. The tones themselves are for fills, icons and large numbers.
- Numbers are `--text` unless the colour carries meaning: revenue collected in positive, payments due in warning, overdue in danger. Purple is not used.

**The Meaning Rule.** If colour isn't saying paid, due, overdue or opened, it shouldn't be there.

## 3. Typography

Inter, self-hosted (latin and latin-ext, so ₦ renders in Inter), with `cv11` and `ss01` on globally and tabular figures on every amount, date, table and count. The scale is Tailwind utilities: `text-display`, `text-h2`, `text-h3`, `text-body`, `text-meta` (`text-meta-style` adds the weight and `--text-2`), `text-stat`, `text-stat-sm`, `text-th`. Table headers are sentence case, never uppercase. Money is `₦1,490,000`, no decimals.

## 4. Space, radius, depth

- Spacing steps 4, 8, 12, 16, 20, 24, 32, 40, 56, 72: 32 to 40 between sections, 16 to 20 inside cards, 12 between related rows.
- Radius: 6 for buttons, inputs and pills; 10 for cards, tables and drawers; 999 for avatars and toggles.
- Shadows: `shadow-1` for cards and tables, `shadow-2` for hovered cards, popovers and tooltips, `shadow-3` for the drawer.
- Cards are `surface` + 1px `border` + `shadow-1`. Never nest a card in a card; inside one, use spacing, a divider or a sunk inset.

## 5. Layout

One page frame (`Page` in `components/shell/page.tsx`): aligned to the sidebar, 40px side padding from 768px, at most 1200px wide, never centred in leftover space. Every page header is title (and meta line) on the left, actions on the right, 32px above the content.

- 1024px and up: 240px sidebar. Property detail has rooms (2fr) and a summary rail (1fr).
- 1280px and up: Home is two columns, main (2fr) and side rail (1fr). Below that it stacks: revenue, stats, needs attention, quick actions.
- 768 to 1023px: the sidebar is a 64px icon rail with tooltips.
- Below 768px: a bottom tab bar (Home, Properties, Messages, More), tables become stacked rows, the drawer becomes a bottom sheet, and touch targets grow to 44px.

## 6. Components

- **Button** (`ui/button.tsx`): primary, secondary, ghost, plus destructive for the final confirm of an irreversible action. 36px, 32px compact, 44px on touch; every hit area is at least 40px. Icon-only buttons have an aria-label and a tooltip.
- **StatusPill** (`ui/status-pill.tsx`): the only pill. `RentStatusPill`, `MessageStatusPill` (Ready, Opened in WhatsApp, Sent) and `MessageTypePill` map onto it. Notices carry a warning icon so status is never colour alone.
- **Table** (`ui/table.tsx`): whole-row links, 64px rows, chevron that nudges on hover. Properties use Property, Occupancy (beds, a 64px bar and beds free) and Rent roll.
- **Drawer** (`ui/drawer.tsx`): the only overlay. 440px from the right over a scrim on 768px and up, a draggable bottom sheet below. Traps focus, closes on Escape, returns focus to the row that opened it. The page underneath never moves.
- **Popover, Menu, Listbox, SegmentedControl, Tooltip**: in `ui/`. Tooltips wait 300ms on hover and appear at once on keyboard focus.
- **WhatsApp send actions**: the same per stage everywhere. Ready: Send and Mark sent. Opened: Mark sent and Resend. Sent: a check and the time.
- **Toggle**: 32x18, positive when on.

## 7. Motion

Motion only when state changes or content arrives; nothing loops or moves on idle. Only transform and opacity animate (plus stroke-dashoffset for the chart and colour crossfades). Easing is ease-out-quart by default, ease-out-expo for the drawer, never bounce.

| Moment | Spec |
|---|---|
| Route change | content fades in and rises 6px, 280ms; the sidebar stays still |
| First render of a list | rows rise 4px and fade, 30ms apart, first eight only |
| Filter change | the list crossfades, 100ms out, 200ms in |
| Drawer | slides in 280ms (ease-out-expo), out 220ms; scrim fades 200ms |
| Status change | pill colours crossfade; the label swaps with a 4px slide |
| Record payment | balance counts down over 400ms; toast with Undo for 4s |
| Home numbers and chart | count up and draw in on the first Home visit of the session only |
| Hover | background or shadow only, 120ms; buttons press to 0.98 |

`prefers-reduced-motion` turns movement off everywhere (MotionConfig for Framer, a CSS rule for the rest); state changes stay instant.

## 8. Copy

No em dashes and no doubled punctuation, in the UI or in message templates. Dates are "18 Nov 2026" in details and "2 Nov, 11:43am" in timestamps, always in Lagos time. Every action ends in a toast; every empty state has a next action.
