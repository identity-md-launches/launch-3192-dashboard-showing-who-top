#!/usr/bin/env node
// Builds public/data/holders.json: every IMD holder on Ethereum at one block, with staked IMD
// (sIMD shares valued in IMD) and the IMD held by contracts that have not released it yet.
//
//   RPC_URL=https://ethereum-rpc.publicnode.com node scripts/snapshot.mjs [block]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rpc, call, word, pad, pool, hex, callCount } from './rpc.mjs';
import { deployBlock, transferLogs, balancesFrom } from './scan-logs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const IMD = '0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7';
const SIMD = '0x9efa934d9fad4ae28c998a40195646b965a97247';
// SitOnHands: ownerless vault for voluntary IMD time locks (positions(id) -> depositor, amount, unlockTime, withdrawn).
const SIT = '0x20bcc5c678b0beea9a042cd03e3abc36d00e734a';
// ParameterizedVault: CDP vault holding sIMD as collateral (positions(owner) -> collateral, debt).
const CDP = '0x0b69f8da8d8ce521d74ea69a7a3475b77302ef82';
const ZERO = '0x0000000000000000000000000000000000000000';
const labels = JSON.parse(fs.readFileSync(path.join(here, 'labels.json'), 'utf8'));
const log = (...a) => console.error(...a);

const latest = parseInt(await rpc('eth_blockNumber', []), 16);
const block = Number(process.argv[2] || latest - 5);
const blk = await rpc('eth_getBlockByNumber', [hex(block), false]);
log('snapshot block', block);

const imdFrom = await deployBlock(IMD, block);
const imdLogs = await transferLogs(IMD, imdFrom, block, (b, n) => log('IMD logs to', b, n));
const simdFrom = await deployBlock(SIMD, block);
const simdLogs = await transferLogs(SIMD, simdFrom, block, (b, n) => log('sIMD logs to', b, n));

const { bal, touch } = balancesFrom(imdLogs);
const { bal: shares, touch: stouch } = balancesFrom(simdLogs);
bal.delete(ZERO); shares.delete(ZERO);

const at = hex(block);
const totalSupply = word(await call(IMD, '0x18160ddd', at));
const vaultAssets = word(await call(SIMD, '0x01e1d114', at));
const vaultShares = word(await call(SIMD, '0x18160ddd', at));
if (bal.get(SIMD) !== vaultAssets) log('note: vault balance', bal.get(SIMD), 'totalAssets', vaultAssets);

// IMD locked in SitOnHands, credited to each depositor; the latest unlock time among their open locks.
const locked = new Map(), unlockAt = new Map();
const nextId = Number(word(await call(SIT, '0x899346c7', at)));
await pool([...Array(nextId).keys()], 8, async (id) => {
  const r = await call(SIT, '0x99fbab88' + id.toString(16).padStart(64, '0'), at);
  const depositor = '0x' + r.slice(26, 66);
  const amount = word(r, 1), unlock = Number(word(r, 2)), withdrawn = word(r, 3) !== 0n;
  if (withdrawn || amount === 0n) return;
  locked.set(depositor, (locked.get(depositor) ?? 0n) + amount);
  unlockAt.set(depositor, Math.max(unlockAt.get(depositor) ?? 0, unlock));
});
const lockedSum = [...locked.values()].reduce((t, v) => t + v, 0n);
log('SitOnHands positions', nextId, 'open IMD', lockedSum, 'contract balance', bal.get(SIT));

// sIMD posted as collateral in the CDP vault, credited to each position owner.
const cdpLogs = await rpc('eth_getLogs', [{ address: CDP, fromBlock: hex(await deployBlock(CDP, block)), toBlock: at }]);
const cdpUsers = new Set();
for (const l of cdpLogs) for (const t of l.topics.slice(1, 3)) if (/^0x0{24}/.test(t)) cdpUsers.add('0x' + t.slice(26));
cdpUsers.delete(ZERO);
const collateral = new Map();
await pool([...cdpUsers], 8, async (u) => {
  const r = await call(CDP, '0x55f57510' + pad(u).slice(2), at);
  const c = word(r, 0);
  if (c > 0n) collateral.set(u, c);
});
const collSum = [...collateral.values()].reduce((t, v) => t + v, 0n);
log('CDP accounts', cdpUsers.size, 'with collateral', collateral.size, 'sum', collSum, 'vault sIMD', shares.get(CDP));
for (const [u, c] of collateral) shares.set(u, (shares.get(u) ?? 0n) + c);
// The vault's own sIMD now belongs to its position owners; keep only any excess on the vault row.
if (shares.has(CDP)) shares.set(CDP, shares.get(CDP) - collSum > 0n ? shares.get(CDP) - collSum : 0n);
const lockedSIT = bal.get(SIT) ?? 0n;

const addrs = new Set([...bal].filter(([, v]) => v > 0n).map(([a]) => a));
for (const [a, v] of shares) if (v > 0n) addrs.add(a);
for (const a of locked.keys()) addrs.add(a);

const rows = [...addrs].map((a) => {
  const wallet = bal.get(a) ?? 0n;
  const sh = shares.get(a) ?? 0n;
  const staked = vaultShares === 0n ? 0n : (sh * vaultAssets) / vaultShares;
  const lk = locked.get(a) ?? 0n;
  return { a, wallet, shares: sh, staked, locked: lk, unlock: unlockAt.get(a) ?? 0, last: Math.max(touch.get(a) ?? 0, stouch.get(a) ?? 0) };
});

// Check the log-derived balances against balanceOf for the largest holders.
rows.sort((x, y) => (y.wallet + y.staked + y.locked > x.wallet + x.staked + x.locked ? 1 : -1));
let mismatches = 0;
await pool(rows.slice(0, 200), 8, async (r) => {
  const onchain = word(await call(IMD, '0x70a08231' + pad(r.a).slice(2), at));
  if (onchain !== r.wallet) { mismatches++; r.wallet = onchain; }
});
log('balanceOf mismatches in top 200:', mismatches);

// Classify every address holding at least 1 IMD: plain wallet, delegated (EIP-7702) wallet, or contract.
const ONE = 10n ** 18n;
const big = rows.filter((r) => r.wallet + r.staked + r.locked >= ONE);
await pool(big, 10, async (r) => {
  const code = await rpc('eth_getCode', [r.a, at]);
  const n = (code.length - 2) / 2;
  r.type = n === 0 ? 'wallet' : n === 23 && code.startsWith('0xef0100') ? 'wallet' : 'contract';
});

// Verified names for contracts holding 100+ IMD.
const named = big.filter((r) => r.type === 'contract' && r.wallet + r.staked >= 100n * ONE && !labels[r.a]);
await pool(named, 4, async (r) => {
  try {
    const j = await (await fetch(`https://eth.blockscout.com/api/v2/addresses/${r.a}`)).json();
    const impl = j.implementations?.[0]?.name;
    r.name = j.name && j.name !== 'SafeProxy' ? j.name : impl || j.name || null;
  } catch { r.name = null; }
});

const KINDS = { UniswapV3Pool: 'liquidity', PoolManager: 'liquidity', Safe: 'wallet', CoinbaseSmartWallet: 'wallet' };
const units = (v) => Number(v / 10n ** 12n) / 1e6; // IMD with 6 decimals of precision
const out = rows
  .filter((r) => r.wallet + r.staked + r.locked > 0n)
  .map((r) => {
    const l = labels[r.a];
    const kind = l?.kind ?? (r.name && KINDS[r.name]) ?? (r.type === 'contract' ? 'contract' : 'wallet');
    return [r.a, units(r.wallet), units(r.staked), kind, l?.name ?? r.name ?? null, r.last, units(r.locked), r.unlock];
  });

const data = {
  token: { address: IMD, symbol: 'IMD', chain: 'Ethereum', chainId: 1, vault: SIMD },
  block, timestamp: parseInt(blk.timestamp, 16),
  totalSupply: units(totalSupply),
  vault: { assets: units(vaultAssets), shares: Number(vaultShares / 10n ** 18n) / 1e6 },
  locks: { address: SIT, positions: nextId, open: units(lockedSum), balance: units(lockedSIT) },
  collateral: { address: CDP, accounts: collateral.size, imd: units(vaultShares === 0n ? 0n : (collSum * vaultAssets) / vaultShares) },
  transfers: imdLogs.length, stakeTransfers: simdLogs.length,
  columns: ['address', 'wallet', 'staked', 'kind', 'name', 'lastBlock', 'locked', 'unlockTime'],
  holders: out,
};
const dest = path.join(here, '..', 'public', 'data', 'holders.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(data));
log(`wrote ${out.length} holders to ${dest} using ${callCount()} RPC calls`);
