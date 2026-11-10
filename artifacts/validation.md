# Validation record: IMD holders dashboard

## 1. Scope and assumptions
- Single page: `dist/index.html`. Data comes from `dist/data/holders.json`.
- The token address comes from https://imd.fun/token/. The sIMD vault, RewardDistributor, RewardDripper, BurnExecutor and CappedBurnHook come from https://pool4.imd.fun/docs.
- On chain, the token reports symbol `IMD` and name `Identity.md`.
- Assumed meaning of the brief's "unvested, staked":
  - Staked: sIMD shares, plus sIMD posted as collateral in ParameterizedVault, valued at totalAssets/totalSupply.
  - Locked: SitOnHands time locks.
  - Unvested: no vesting contract holds IMD; POOL4 reward contracts that hold rewards not yet released are shown as "unreleased".
- Ethereum only. Base and Robinhood Chain are excluded and the page says so.
- No wallet connection: this is a read-only dashboard.

## 2. Coverage (Better Interface, six domains)
| Domain | Status | Evidence |
| --- | --- | --- |
| Accessibility | Checked | See notes below. |
| Layout | Checked | Playwright, Chromium: 320/390/1440 with no horizontal scroll and no overlapping cells in a holder row; first row on the first screen; logical properties used. Not verified: RTL mirror, native 200% zoom. |
| Writing | Checked (source) | Verb-first buttons (Download CSV, Try again, Show N more, Search all addresses). The error states its cause and offers a retry. The search empty state names the query and offers an exit. Sentence case throughout. |
| Typography | Checked | taste@1: 5 sizes (plus one 14.5px `code` one-off), 2 families, 3 weights, no tracking or casing failures. Tabular numbers. Inputs at 16px. |
| Colors | Checked | taste@1 contrast: all measured text meets 4.5:1. The 702 boxes the probe reports as over gradients or images are unmeasured. One filled action per view. |
| UI | Checked | No `transition: all` (taste@1 motion pass). Concentric radii. Ring shadow, not border plus shadow (chrome pass). Icons use `currentColor`. Reduced-motion guard. Not verified: replay at 10% speed. |

**Accessibility notes**
- Checked in source:
  - Native button, input and radio controls.
  - Every input has a visible label.
  - Icon buttons have an aria-label.
  - A skip link, one h1 and descending headings.
  - `role=status` for counts and loading; `role=alert` for the load error.
  - `aria-sort` on sorted columns.
  - Status is never shown by color alone.
- Checked in the browser:
  - The first Tab stop is the skip link.
  - taste@1 targets: all controls are at least 24px or spaced apart.
- Not verified:
  - A screen-reader session.
  - A full tab walk with screenshots of every focus ring.
  - Forced-colors mode.
  - Table semantics in Safari after the CSS display change under 40rem.

## 3. Findings and fixes
| # | Severity | Source | Evidence | Fix | Recheck |
| --- | --- | --- | --- | --- | --- |
| 1 | High | `src/styles.css` `.section` | taste@1 layout: page 398px wide at 320/390. The grid item's min-content came from the supply table. | `grid-template-columns: minmax(0, 1fr)`, plus a stacked label row for `.plain` under 40rem | taste layout pass, scrollWidth = viewport |
| 2 | High | `src/styles.css` mobile `.holders .table tr` | 390 screenshot: "Staked" overlapped "In wallet". Implicit grid placement put five cells into one row. | Explicit grid rows and columns per cell | walk: 0 overlapping cells at 320/390/1440 |
| 3 | Medium | `src/components/HolderTable.tsx` `td.who` | 1440 screenshot: row dividers broke at the address cell because `display: grid` was on a `<td>` | Moved the grid onto an inner `div.who-in` | screenshot and walk |
| 4 | High | `src/styles.css` mobile thead | walk: the sort buttons could not be clicked at 390 (thead was visually hidden) | thead became a visible "Sort by" bar | walk: sort by Locked passes at 390 |
| 5 | Medium | `src/App.tsx` lede, `Controls.tsx` legend | walk: the first holder row started below the 844px fold at 390 after fix 4 | Shorter lede (14px on phones); "Show" legend visually hidden on phones | walk: first row on the first screen at 320/390 |
| 6 | Medium | `scripts/snapshot.mjs` | Unlabeled contract holding 92k sIMD | Identified it as the ParameterizedVault CDP; its collateral is credited to 35 position owners. SitOnHands locks are credited to depositors. | Both sums reconcile exactly with on-chain balances |

## 4. Verification commands (final source)
- `npm run typecheck`: exit 0.
- `npm test`: 2 files, 12 tests passed. They cover ranking, toggles, search ranks, kind filters, sort by locked, breakdown sums, CSV, bad file, and the UI flow (load, toggle, view, sort, search with empty state and clear, CSV download, error and retry).
- `npm run build`: passed.
- Playwright walk (`test/scratch/walk.mjs`, scratch only), with `dist/` served under `/preview/` in Chromium: **21/21 passed**.
  - Viewports 320×844, 390×844 and 1440×900.
  - Covers console and resource errors, scroll width, first-screen row, overlap, the Staked toggle, the All view, sort by Locked, search, Show more, the CSV download (4,602 rows), the skip link, and error and retry.
- `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` (with `IMD_PLAYWRIGHT` pointing at an out-of-repo Playwright): **16/16 passed**.
  - Probe figures: copy budget 44 words at 390; 5 type sizes.
  - Screenshots are in `test/scratch/taste/shots/` (scratch, not submitted).
- The 390 and 1440 screenshots were viewed during the fixes above. After the last fix (5), the result was confirmed by the walk's measurements, not by a fresh look at the screenshot.

## 5. Completion
**Complete for the stated scope, with these limits:**
- WebKit could not launch on this machine (missing libgtk-4 and related system libraries), so Safari was not exercised.
- No screen-reader, native zoom, RTL or physical-device tests were run.
- The data is a snapshot at the block shown on the page. Ethereum only.
