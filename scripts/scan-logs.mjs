// Collect every Transfer log for a token, from its deployment block to a fixed snapshot block.
import { rpc, hex } from './rpc.mjs';

export const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export async function deployBlock(address, latest) {
  let lo = 0, hi = latest;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const code = await rpc('eth_getCode', [address, hex(mid)]);
    if (code && code !== '0x') hi = mid; else lo = mid + 1;
  }
  return lo;
}

export async function transferLogs(address, from, to, onProgress) {
  const logs = [];
  let start = from, span = 50000;
  while (start <= to) {
    const end = Math.min(to, start + span - 1);
    try {
      const chunk = await rpc('eth_getLogs', [{ address, fromBlock: hex(start), toBlock: hex(end), topics: [TRANSFER] }]);
      // Some providers silently truncate large responses: never accept a big chunk, split it instead.
      if (chunk.length >= 2500 && span > 10) { span = Math.max(10, Math.floor(span / 4)); continue; }
      for (const l of chunk) logs.push({ b: parseInt(l.blockNumber, 16), from: '0x' + l.topics[1].slice(26), to: '0x' + l.topics[2].slice(26), v: BigInt(l.data === '0x' ? 0 : l.data) });
      start = end + 1;
      if (chunk.length < 800) span = Math.min(span * 2, 200000);
      onProgress?.(end, logs.length);
    } catch (e) {
      if (span <= 10) throw e;
      span = Math.max(10, Math.floor(span / 4));
    }
  }
  return logs;
}

export function balancesFrom(logs) {
  const bal = new Map();
  const touch = new Map();
  for (const { from, to, v, b } of logs) {
    bal.set(from, (bal.get(from) ?? 0n) - v);
    bal.set(to, (bal.get(to) ?? 0n) + v);
    touch.set(from, b); touch.set(to, b);
  }
  return { bal, touch };
}
