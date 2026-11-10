# DESIGN.md: IMD holders

Taken from the final source: `src/styles.css`, `src/components/*`, `index.html`.

## Direction
A quiet, light, data-first dashboard. The answer comes first: the page title, four summary figures, the controls, then the ranked list. One green accent marks the primary action and the active choices. Everything else is a cool neutral ramp.

## Color tokens (oklch)
| Role token | Primitive | Value | Use |
| --- | --- | --- | --- |
| `--color-bg` | `--gray-0` | oklch(0.995 0.002 250) | page, inputs, active segment |
| `--color-bg-subtle` | `--gray-50` | oklch(0.975 0.004 250) | stat tiles, table head, footer, empty state |
| `--color-bg-muted` | `--gray-100` | oklch(0.945 0.006 250) | segmented track, row dividers, secondary button, code |
| `--color-border` | `--gray-200` | oklch(0.89 0.008 250) | input border, table outline, header rule |
| `--color-text` | `--gray-900` | oklch(0.2 0.012 250) | body text |
| `--color-text-secondary` | `--gray-700` | oklch(0.36 0.014 250) | ledes, labels, hints, captions |
| `--color-text-muted` | `--gray-500` | oklch(0.5 0.014 250) | rank numbers, placeholder, idle icons |
| `--color-accent` / `-hover` | `--green-800` / `--green-600` | oklch(0.36 0.08 155) / oklch(0.47 0.11 155) | primary button, links, custody tags |
| `--color-on-accent` | `--gray-0` | | text on the primary button |
| `--color-focus` | | oklch(0.55 0.18 255) | 2px focus outline |
| `--color-danger` | | oklch(0.5 0.17 25) | load error |

Category colors (`--cat-staking`, `--cat-wallet`, `--cat-liquidity`, `--cat-contract`, `--cat-lock`, `--cat-unreleased`, `--cat-burn`, `--cat-protocol`) appear only in the supply bar and its legend dots. Each one sits next to a text label.

## Typography
- Families: `--font-sans` (system-ui stack) for all UI and prose. `--font-mono` (ui-monospace stack) only for addresses and `code`.
- Scale, five sizes: `--text-xs` 13px (captions, table head, addresses, tags), `--text-sm` 14px (UI, table cells, the lede on phones), `--text-md` 16px (body, inputs), `--text-lg` 20px (h2, stat values), `--text-xl` 28px (h1).
- Weights: 400 body, 600 headings, labels, active controls and totals. 700 comes only from `<strong>` in the method notes.
- Headings: line-height 1.15 with `text-wrap: balance`. h1 tracking -0.02em, h2 -0.01em. Body line-height 1.5, `text-wrap: pretty`.
- Every number uses `font-variant-numeric: tabular-nums`. Prose measure is capped at 62–68ch.

## Spacing, radius, motion
- Spacing: `--space-1/2/3/4/6/8/12` = 4/8/12/16/24/32/48px. Layout width is `--wrap` 72rem with 16px inline padding.
- Radius: `--radius-sm` 6px for buttons and inputs. `--radius-md` 10px for tiles, the table and the segment track; the inner segment uses 7px (concentric).
- Motion: 150ms `cubic-bezier(0.2, 0, 0, 1)`, only on background-color, color and scale. Buttons press to `scale(0.96)`. All of it is off under `prefers-reduced-motion`.
- Elevation: the table outline and the active segment use a box-shadow ring, not border plus shadow. The sticky header uses a 1px shadow rule over a 92% translucent background.

## Components
- **Header** (`App.tsx`): logo and "IMD holders" at the leading edge. At the trailing edge: Supply and Method anchors (hidden under 40rem) and the primary **Download CSV** button, which exports the current view.
- **Intro**: h1 "Top IMD holders", one plain sentence, and the snapshot block linked to Etherscan.
- **Stats** (`dl.stats`): IMD on Ethereum, Holders, Staked %, Top 10 hold. Four columns, two under 40rem.
- **Controls** (`Controls.tsx`):
  - Labelled search, 16px, 44px tall.
  - "Show" segmented radio group: Holders, Wallets, Contracts, All. Native radios over styled spans, with a focus ring on the span.
  - "Count in the total" checkboxes: Staked, Locked.
  - A hint line that explains the selected view.
- **Holder table** (`HolderTable.tsx`):
  - Columns: rank, full address (an Etherscan link plus a copy icon button with an aria-label), label or kind tag (with the lock end date when locked), In wallet, Staked, Locked, Total, Share.
  - Header sort buttons carry `aria-sort`.
  - A status line gives the count, matches and copy confirmation.
  - Empty state: names the query (or "No addresses match these filters." when there is none) and offers "Reset filters", which clears the query, view and sort. "Show N more" pages in steps of 100.
- **Supply breakdown** (`Breakdown.tsx`): a proportional bar (decorative, `aria-hidden`), a table of where the IMD sits, and a list of named contracts with full addresses.
- **Method** (`About.tsx`): sources, how staked, locked and unvested amounts are derived, and the limits.
- **States**: loading (`role=status`); error (`role=alert`) with **Try again**.

## Responsive behavior
- **Over 56rem**: controls in one row (search, segment, checkboxes) and a full table.
- **40–56rem**: search on its own row, segment and checkboxes below.
- **Under 40rem**:
  - Nav anchors hidden. Stats in 2×2. Controls stacked. The "Show" legend is visually hidden (kept for assistive tech). The lede drops to 14px.
  - The table head becomes a visible "Sort by" bar.
  - Each holder row becomes a three-line grid: rank and address (wraps, never truncated); wallet, staked and locked; total and share. Each value carries its label.
  - The supply table puts each label on its own line above its three figures.
  - Verified with no horizontal scroll at 320, 390 and 1440.
