// Snapshot types and the pure functions behind every view of it.

export type Kind = 'wallet' | 'contract' | 'staking' | 'lock' | 'liquidity' | 'unreleased' | 'protocol' | 'burn';

export interface Holder {
  address: string;
  wallet: number;
  staked: number;
  kind: Kind;
  name: string | null;
  lastBlock: number;
  /** IMD in SitOnHands time locks, credited to the depositor. */
  locked: number;
  /** Latest unlock time (unix seconds) among the depositor's open locks, 0 if none. */
  unlockTime: number;
}

export interface Snapshot {
  token: { address: string; symbol: string; chain: string; chainId: number; vault: string };
  block: number;
  timestamp: number;
  totalSupply: number;
  vault: { assets: number; shares: number };
  locks: { address: string; positions: number; open: number; balance: number };
  collateral: { address: string; accounts: number; imd: number };
  transfers: number;
  stakeTransfers: number;
  holders: Holder[];
}

type RawRow = [string, number, number, Kind, string | null, number, number?, number?];
export interface RawSnapshot extends Omit<Snapshot, 'holders'> {
  columns: string[];
  holders: RawRow[];
}

export function parseSnapshot(raw: RawSnapshot): Snapshot {
  if (!raw || !Array.isArray(raw.holders) || typeof raw.block !== 'number') {
    throw new Error('The snapshot file is not in the expected format.');
  }
  const holders = raw.holders.map(([address, wallet, staked, kind, name, lastBlock, locked = 0, unlockTime = 0]) => ({
    address, wallet, staked, kind, name, lastBlock, locked, unlockTime,
  }));
  return { ...raw, holders };
}

/** Addresses that hold IMD on behalf of others, or for no one. Their balance is not a holder's position. */
export const CUSTODY: readonly Kind[] = ['staking', 'lock', 'liquidity', 'unreleased', 'protocol', 'burn'];

export type View = 'holders' | 'wallets' | 'contracts' | 'all';
export type SortKey = 'total' | 'wallet' | 'staked' | 'locked';

export interface Options {
  view: View;
  countStaked: boolean;
  countLocked: boolean;
  sort: SortKey;
  query: string;
}

export interface Ranked extends Holder {
  rank: number;
  total: number;
}

export const totalOf = (h: Holder, countStaked: boolean, countLocked: boolean) =>
  h.wallet + (countStaked ? h.staked : 0) + (countLocked ? h.locked : 0);

function inView(h: Holder, view: View) {
  switch (view) {
    case 'holders': return !CUSTODY.includes(h.kind);
    case 'wallets': return h.kind === 'wallet';
    case 'contracts': return h.kind !== 'wallet';
    default: return true;
  }
}

/** Rank inside the chosen view and sort, then narrow by the search query so ranks stay stable while searching. */
export function rankHolders(holders: Holder[], { view, countStaked, countLocked, sort, query }: Options): { rows: Ranked[]; ranked: number } {
  const value = (h: Ranked) => (sort === 'total' ? h.total : h[sort]);
  const ranked = holders
    .filter((h) => inView(h, view))
    .map((h) => ({ ...h, rank: 0, total: totalOf(h, countStaked, countLocked) }))
    .filter((h) => (sort === 'total' ? h.total > 0 : h[sort] > 0))
    .sort((a, b) => value(b) - value(a) || b.total - a.total || a.address.localeCompare(b.address));
  ranked.forEach((h, i) => (h.rank = i + 1));
  const q = query.trim().toLowerCase();
  const rows = q ? ranked.filter((h) => h.address.includes(q) || (h.name ?? '').toLowerCase().includes(q)) : ranked;
  return { rows, ranked: ranked.length };
}

/** Share of `supply` held by the first n rows of a ranked list. */
export function topShare(rows: Ranked[], n: number, supply: number) {
  let sum = 0;
  for (let i = 0; i < Math.min(n, rows.length); i++) sum += rows[i].total;
  return supply > 0 ? sum / supply : 0;
}

export interface Bucket {
  id: Kind;
  label: string;
  amount: number;
  addresses: number;
}

export const BUCKETS: { id: Kind; label: string }[] = [
  { id: 'staking', label: 'Staked in the sIMD vault' },
  { id: 'wallet', label: 'Liquid in wallets and Safes' },
  { id: 'liquidity', label: 'Uniswap liquidity' },
  { id: 'contract', label: 'Other contracts' },
  { id: 'lock', label: 'Time-locked in SitOnHands' },
  { id: 'unreleased', label: 'Unreleased protocol rewards' },
  { id: 'burn', label: 'Burn address' },
  { id: 'protocol', label: 'POOL4 burn executor' },
];

/** Where the Ethereum supply sits, by the kind of address holding it. Staked IMD counts once, in the vault. */
export function breakdown(s: Snapshot): Bucket[] {
  return BUCKETS.map(({ id, label }) => {
    const list = s.holders.filter((h) => h.kind === id && h.wallet > 0);
    return { id, label, amount: list.reduce((t, h) => t + h.wallet, 0), addresses: list.length };
  }).filter((b) => b.amount > 0);
}

export const named = (s: Snapshot) =>
  s.holders.filter((h) => h.name && h.wallet + h.staked + h.locked > 0).sort((a, b) => b.wallet + b.staked - (a.wallet + a.staked));

export function toCSV(rows: Ranked[], opts: Pick<Options, 'countStaked' | 'countLocked'>, supply: number): string {
  const counted = ['wallet', opts.countStaked && 'staked', opts.countLocked && 'locked'].filter(Boolean).join('_');
  const head = ['rank', 'address', 'label', 'kind', 'wallet_imd', 'staked_imd', 'locked_imd', 'unlock_time_utc', `total_imd_${counted}`, 'share_of_ethereum_supply'];
  const iso = (t: number) => (t ? new Date(t * 1000).toISOString() : '');
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = rows.map((r) =>
    [r.rank, r.address, esc(r.name ?? ''), r.kind, r.wallet.toFixed(6), r.staked.toFixed(6), r.locked.toFixed(6), iso(r.unlockTime), r.total.toFixed(6), (r.total / supply).toFixed(8)].join(','),
  );
  return [head.join(','), ...lines].join('\n') + '\n';
}
