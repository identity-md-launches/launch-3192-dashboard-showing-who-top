# IMD holders

A static dashboard of every Ethereum address holding IMD (`0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7`). Each address is ranked by IMD in its wallet, plus staked IMD (sIMD shares, including sIMD posted as collateral in the ParameterizedVault, valued at the vault's rate), plus IMD in SitOnHands time locks. It also shows where the Ethereum supply sits: the staking vault, wallets, Uniswap liquidity, other contracts, time locks, unreleased POOL4 rewards and the burn address.

The committed `dist/` is the finished static export. All asset URLs are relative (Vite `base: './'`), so it works from an IPFS gateway subpath. The data is one on-chain snapshot at block 26387260, in `public/data/holders.json` (copied to `dist/data/`).

## Install, preview, rebuild

```sh
npm ci                 # install from package-lock.json
npm run dev            # local dev server
npm run build          # tsc --noEmit, then vite build into dist/
npm run preview        # serve the built dist/
npm test               # vitest: data logic and UI interactions (jsdom)
npm run typecheck      # tsc --noEmit
```

## Refresh the data

```sh
RPC_URL=https://ethereum-rpc.publicnode.com npm run snapshot   # optional block number as an argument
npm run build
```

`scripts/snapshot.mjs` does the following:
- Replays every IMD and sIMD `Transfer` log from each contract's deployment block.
- Checks the 200 largest balances against `balanceOf` at the snapshot block.
- Reads every SitOnHands lock position and every ParameterizedVault collateral position.
- Classifies addresses with `eth_getCode`. EIP-7702 delegated accounts count as wallets.
- Names contracts holding 100+ IMD from `scripts/labels.json` (IMD and POOL4 docs) or from verified names on eth.blockscout.com.

A full run takes about 3,700 RPC calls.

## Validation (worker-side, this build)

| Command | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm test` | 2 files, 13 tests passed |
| `npm run build` | passed; JS 236.7 kB (74 kB gzip), CSS 13.4 kB, data 0.4 MB |
| Playwright walk of `dist/` served under `/preview/` (Chromium, 320/390/1440) | 21/21 checks passed: no console errors or failed loads; no horizontal scroll; first holder row on the first screen; no overlapping cells; Staked toggle re-ranks; All view; sort by Locked; search; Show more; CSV download (4,602 rows); skip link first Tab stop; error state and Try again |
| Revision walk of `dist/` (Chromium, 320/390/1440) | empty search for a full address stays within the viewport (scrollWidth = width); Reset filters after Locked + Contracts restores 4,611 addresses sorted by Total; no console errors |
| `node .imd/reads/skills/design-critic/scripts/taste.mjs` (taste@1) | 16/16 checks passed at 320/390/1440 (rerun after the revision) |

Limitations:
- WebKit could not launch on this machine (missing system libraries such as libgtk-4), so Safari behaviour is not verified.
- No screen-reader session, native 200% zoom or physical device test was run.
- Details are in `artifacts/validation.md`.

## Scope and data limits

- **Ethereum only.** IMD also exists on Base and Robinhood Chain. Those balances are not included.
- **Liquidity is counted under the pool**, not under each liquidity provider.
- **Unvested.** No team or investor vesting contract holds IMD on Ethereum; every contract with 100+ IMD is named in the page.
  - Time-locked IMD (SitOnHands) is credited to depositors.
  - IMD waiting in the POOL4 RewardDistributor and RewardDripper (staking, bonding and node rewards not yet released) is shown as unreleased protocol rewards.
- **Snapshot, not live.** Refresh with the commands above.
