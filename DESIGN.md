---
name: KK4 Document Register
description: Excel-familiar document control register for an SCG EPC project, with a light data-grid surface and a dark focused-task overlay.
colors:
  scg-red: "#C8102E"
  scg-red-deep: "#9E0A24"
  action-blue: "#3F5E7C"
  action-blue-hover: "#324B63"
  action-blue-ring: "#5B7796"
  positive-emerald: "#2A5E38"
  positive-emerald-deep: "#17391F"
  positive-emerald-soft: "#D7E4D8"
  warning-amber: "#B98C2E"
  warning-amber-soft: "#E8CE8E"
  destructive-rose: "#B23B31"
  destructive-red: "#dc2626"
  info-cyan: "#4A7A82"
  surface-paper: "#f1f5f9"
  surface-white: "#ffffff"
  surface-line: "#cbd5e1"
  surface-line-soft: "#e2e8f0"
  text-ink: "#172033"
  text-muted: "#475569"
  text-faint: "#64748b"
  overlay-surface: "#0f172a"
  overlay-surface-raised: "#1e293b"
  overlay-line: "#334155"
  overlay-text: "#f1f5f9"
typography:
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    letterSpacing: "0.03em"
  data-mono:
    fontFamily: "JetBrains Mono, 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
rounded:
  sm: "3px"
  md: "5px"
  lg: "6px"
  xl: "10px"
  grid: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.positive-emerald}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.positive-emerald-deep}"
  button-secondary-action:
    backgroundColor: "{colors.action-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-secondary-action-hover:
    backgroundColor: "{colors.action-blue-hover}"
  button-brand:
    backgroundColor: "{colors.scg-red}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-brand-hover:
    backgroundColor: "{colors.scg-red-deep}"
  badge-success:
    backgroundColor: "{colors.positive-emerald-soft}"
    textColor: "{colors.positive-emerald-deep}"
    rounded: "{rounded.md}"
  badge-warning:
    backgroundColor: "{colors.warning-amber-soft}"
    textColor: "#4A3510"
    rounded: "{rounded.md}"
  input-field:
    backgroundColor: "{colors.overlay-surface-raised}"
    textColor: "{colors.overlay-text}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
---

# Design System: KK4 Document Register

## Overview

**Creative North Star: "The Site Office Ledger"**

This is a working ledger, not a showcase — an EPC document controller's desk in software form. Density and legibility win over decoration; every pixel earns its place because the person using this screen is scanning hundreds of rows a day, not admiring it. The system runs on two surfaces with different jobs: a light, Excel-familiar **data surface** (the register grid and its chrome) where users scan and compare, and a dark, elevated **task surface** (modals for creating, editing, and reviewing a single document) where users focus on one record without the grid competing for attention. Both surfaces share the same accent vocabulary so the split reads as "different mode," never "different app."

Color is functional, not decorative: emerald means "this is the live, in-progress, or committed action" — the active sheet tab, the open Smart Register panel, and its "Save Row & Auto Issue" button, the highest-frequency action in the whole app — blue means "a default, lower-emphasis action" (links, secondary buttons inside modals), amber means "this needs attention," rose/red means "this is rejected or destructive," and SCG red is reserved for the brand mark alone — it never competes with emerald or blue for the user's eye on an interactive element.

**Key Characteristics:**
- Two deliberate surfaces: light data-grid, dark task-overlay — sharing one accent system.
- Functional color, not brand color, drives interaction: SCG red marks the brand only.
- Flat by default; borders and surface-tone shifts do the separating, shadow is reserved for things that truly float (modals, the active tab).
- Precise and procedural: compact type, tight rhythm, snappy feedback — built for all-day repeated use, not first impressions.

## Colors

Every functional color has exactly one job. Nothing shares a role.

These are custom scales, not Tailwind's stock hues — every `emerald-*`/`blue-*`/`amber-*`/`rose-*`/`cyan-*` class is overridden in `tailwind.config.js` so the whole app renders in this palette wherever those utilities are used. Muted and ink-like on purpose: this reads as a real document-control office (rubber-stamp reds, ledger greens, drafting blues) rather than a bright default SaaS dashboard.

### Primary (functional, not brand)
- **Positive Emerald** (`#2A5E38`, deep `#17391F`, soft `#D7E4D8`): the app's true primary — "live / in-progress / commit." A deep, desaturated forest-ledger green, not Tailwind's bright mint-emerald. Drives the active sheet tab, the open Smart Register panel and its border, and the "Save Row & Auto Issue" button: the single highest-frequency action in the app. Also carries success states (the "Uploaded to ConZoL" pill, success badges) — "committed" and "succeeded" read as one family here.
- **Action Blue** (`#3F5E7C`, hover `#324B63`): a secondary, lower-emphasis default — links, and buttons inside the dark task-surface modals (view/revise row actions, modal default buttons). A muted steel/drafting blue, never the loudest color on a light-surface screen.

### Secondary (status semantics)
- **Warning Amber** (`#B98C2E`, soft `#E8CE8E`): pending / needs-attention / SLA-near-due states. A warm ochre/mustard, like aged stamp ink, not a bright alert-yellow.
- **Destructive Rose/Red** (`#B23B31` badges, `#dc2626` buttons): rejected status, destructive actions, SLA-overdue rows. A deep vermillion rather than Tailwind's pink-leaning rose.
- **Info Cyan** (`#4A7A82`): informational/reviewed status badges, a muted slate-teal, distinct from both success and pending.

### Brand
- **SCG Red** (`#C8102E`, deep `#9E0A24`): the brand mark and any explicitly brand-flagged control (the `scg` button variant). Scoped tightly — it does not appear as a general-purpose accent.

### Neutral — Data Surface (light)
- **Surface Paper** (`#f1f5f9`): page background, tab-bar background.
- **Surface White** (`#ffffff`): header bar, grid card, active-tab fill.
- **Surface Line** (`#cbd5e1`) / **Surface Line Soft** (`#e2e8f0`): grid borders, dividers.
- **Ink** (`#172033`) / **Muted** (`#475569`) / **Faint** (`#64748b`): body text, header labels, secondary/meta text, in descending emphasis.

### Neutral — Task Surface (dark)
- **Overlay Surface** (`#0f172a`) / **Overlay Surface Raised** (`#1e293b`): modal body background and its header band.
- **Overlay Line** (`#334155`): modal borders and dividers.
- **Overlay Text** (`#f1f5f9`): primary text on the dark surface.

### Named Rules
**The One-Job Rule.** Every accent color has exactly one meaning system-wide. Amber never means "informational," rose never means "just cautionary," blue never means "success." If a new state needs color, give it a new role rather than reusing one — emerald's own job ("live / committed") is wide enough to cover both the primary action and success states, which is why the two don't need separate colors here.

**The Brand-Restraint Rule.** SCG red appears only as the brand mark and its one dedicated button variant. It is never the default action color — that keeps the brand legible as a signature, not wallpaper.

**The No-Stock-Hue Rule.** Never let `emerald-*`, `blue-*`, `amber-*`, `rose-*`, or `cyan-*` fall back to Tailwind's default values. Those exact hexes (`#059669`, `#2563eb`, `#f59e0b`, `#f43f5e`, `#06b6d4`) are the single most recognizable tell of unmodified AI-tool output; this system's whole identity depends on the overrides in `tailwind.config.js` staying in place. If a shade is missing from the override, add it there — never reach for the stock value as a stopgap.

## Typography

**Body Font:** Inter (with `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`)
**Data/Mono Font:** JetBrains Mono (with `"Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace`)

**Character:** Inter carries all UI prose and labels at small, dense sizes; JetBrains Mono is reserved for values that are literally data — document numbers, dates, project codes, row numbers — so the eye can tell "this is a fact from the record" from "this is interface chrome" at a glance.

### Hierarchy
- **Title** (700 weight, `text-sm`/14px, tight tracking): the app title in the header.
- **Body** (400 weight, ~13px, 1.4 line-height): default UI and grid text.
- **Label** (600 weight, ~11.5px, uppercase, 0.03em tracking): grid column headers and section labels — small and shouting just enough to separate structure from data.
- **Data-Mono** (400-700 weight, ~11-11.5px, monospace): document numbers, dates, project codes, row numbers.

### Named Rules
**The Data-Is-Mono Rule.** Any value that is a literal fact from the register (a document number, a date, a project code) renders in JetBrains Mono. Prose, labels, and UI chrome never do.

## Layout

Container is a centered `max-w-7xl` column with responsive `px-4 sm:px-6 lg:px-8` gutters, matching the header and main content width so nothing in the data surface feels wider or narrower than its neighbors. The grid itself is the dominant element on the page — header and tab bar are thin, fixed-height chrome (36-56px) that never compete with row-scanning for vertical space. Density is high throughout: grid cells run `6px 10px` padding at ~12.5px type, control heights sit at 32-36px. Not designed for mobile or tablet; desktop/laptop widths only.

## Elevation & Depth

Flat by default; borders and surface-tone shifts (paper vs. white vs. dark overlay) do the separating, not shadows. Shadow is reserved for the small number of elements that genuinely float above the page: the modal overlay (`shadow-2xl` over a blurred backdrop) and the active grid tab (`shadow-sm`, lifting it just enough to read as "selected, in front"). Everything else — header, grid, tab bar — sits flush with a 1px border doing the work a shadow would elsewhere.

### Shadow Vocabulary
- **Chrome** (`shadow-xs` / `shadow-sm`): header bar, active tab, small status pills — just enough to read as "raised a hair," never a real drop shadow.
- **Overlay** (`shadow-2xl` + `backdrop-blur-sm` scrim): modals only. This is the one place depth is dramatic, because it is the one place the interface deliberately pulls focus away from everything else.

### Named Rules
**The Flat-Data, Floating-Task Rule.** The register grid never floats — it's the ground the user stands on. Only task-focused overlays (modals) are allowed real elevation.

## Shapes

Two radius languages by surface: the data surface (grid cells, table) is unrounded — a real spreadsheet has square cells, and rounding them would fight the Excel-familiar mental model. Controls layered on top of the data surface (buttons, badges, inputs, the tab bar's top corners) use small radii (`3-6px`) so they read as distinct interactive objects without turning soft and plush — corners are deliberately tighter than the Tailwind/shadcn default scale (`6-12px`), closer to a drafting instrument than a consumer app. The task surface's modal container uses the largest radius in the system (`10px`) befitting a card that floats independently over a scrim, still tighter than the default `12px`. Tabs are rounded on top corners only (`rounded-t-md`) with a bottom accent border marking the active one — intentionally not "rounded on all corners," since a fully rounded tab reads as a chip, not a folder tab.

## Components

### Buttons
- **Shape:** `6px` radius (`rounded-lg`), `5px` for the small size.
- **Primary (Go/Commit):** Positive Emerald background, white text, `16px/8px` padding, `shadow-sm`, `active:scale-95` press feedback — the Smart Register's "Save Row & Auto Issue" and its panel toggle. This is what "do the main thing" looks like.
- **Secondary Action:** Action Blue background, white text, same shape as Primary — used for default/lower-emphasis buttons inside modals (view/revise row actions, modal confirm buttons that aren't the destructive or primary path).
- **Brand:** SCG Red background, white text, adds a subtle `active:scale-95` press feedback — reserved for the one brand-flagged control.
- **Destructive:** solid red (`#dc2626`), same shape as Primary.
- **Outline / Secondary / Ghost:** dark-surface variants (bordered-transparent, `slate-800` fill, or text-only) — used inside the dark task surface (modals), never on the light grid.
- **Hover / Focus:** background steps one shade deeper on hover; `2px` blue focus ring on all variants regardless of color, for consistent keyboard-focus visibility.

### Badges
- **Shape:** `5px` radius (`rounded-md`), `2px/8px` padding, small (`text-xs`) uppercase-friendly weight.
- **Status mapping:** success = emerald, warning = amber, destructive = rose, info = cyan, draft = muted slate. Each is a soft tint (`/20` opacity fill or a `-100` soft background) with a matching-hue border — never a solid fill, so multiple badges in a row stay calm.

### Grid / Sheet Cells
- **Shape:** no radius; `1px solid` borders on every cell, collapsed.
- **Header row:** `slate-50` fill, `slate-600` uppercase label text, heavier border (`slate-300`).
- **Row number column:** `slate-100` fill, monospace, centered — reads as a ruler, not data.
- **Status pills inside cells** (e.g. ConZoL upload state) use the same soft-tint badge language as Badges, with a `hover:` deepen and an `animate-pulse` only on the one state that needs active attention (pending ConZoL upload).

### Sheet Tabs
- **Style:** top-rounded (`rounded-t-md`), `2px` bottom border. Active = white fill, emerald text and border, `shadow-sm`. Inactive = transparent border, `slate-600` text, hover fills `slate-200`.

### Modal (Task Surface)
- **Corner Style:** `10px` radius (`rounded-xl`), dark surface (`#0f172a`) over a `black/75` blurred scrim.
- **Header band:** slightly raised tone (`#1e293b` at half-opacity), bottom border, holds title + optional description + close button.
- **Inputs inside:** dark field (`#1e293b`-ish, `slate-900/90`), `slate-700` border, white text, blue focus ring — matches the modal's own surface, not the light grid.
- **Padding:** header `24px/16px`, body `24px/20px`, scrollable body capped at `85vh - 8rem`.

### Navigation / Header
- Single-row header, white background, bottom border only (no shadow), brand mark + title + live metric pills right-aligned. Metric pills reuse the Badge soft-tint language (blue for total, amber for pending, emerald for uploaded) so the header previews the grid's own status vocabulary before the user even scrolls to it.

## Do's and Don'ts

### Do:
- **Do** keep grid cells square (no radius) — the Excel mental model depends on it.
- **Do** reserve SCG Red for the brand mark and its one button variant only.
- **Do** render document numbers, dates, and project codes in JetBrains Mono; everything else in Inter.
- **Do** use soft-tint badges (never solid fill) for status, so a row with multiple badges stays readable.
- **Do** keep the dark task-surface (modals) visually distinct from the light data-surface (grid) — it's a deliberate two-surface system, not an inconsistency to fix.
- **Do** use the custom `emerald-*` / `blue-*` / `amber-*` / `rose-*` / `cyan-*` scales defined in `tailwind.config.js` for every use of those color families.

### Don't:
- **Don't** use emerald for a "click here" action — it means success/active, not "do this."
- **Don't** add drop shadows to the grid, header, or tab bar at rest; shadow is reserved for the modal overlay and the active tab only.
- **Don't** round the register grid's cells or table borders.
- **Don't** mix a light-surface component (grid-styled button/badge) into a modal, or a dark-surface component into the grid — each surface uses its own component styling.
- **Don't** reach for Tailwind's stock color values (`emerald-600 #059669`, `blue-600 #2563eb`, `amber-500 #f59e0b`, `rose-500 #f43f5e`) or the default `8-12px` corner scale as a "quick fix" or fallback — that's the generic-AI-tool look this system was deliberately built to avoid.
