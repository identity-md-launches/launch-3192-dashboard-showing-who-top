// Minimal JSON-RPC client used by the snapshot script.
const RPC = process.env.RPC_URL || 'https://ethereum-rpc.publicnode.com';
let calls = 0;
export const callCount = () => calls;

export async function rpc(method, params, tries = 5) {
  for (let i = 0; ; i++) {
    calls++;
    try {
      const res = await fetch(RPC, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: calls, method, params }),
      });
      const j = await res.json();
      if (j.error) throw Object.assign(new Error(j.error.message || 'rpc error'), { rpc: j.error });
      return j.result;
    } catch (e) {
      if (e.rpc || i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
}

export const hex = (n) => '0x' + BigInt(n).toString(16);
export const pad = (addr) => '0x' + addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
export const word = (data, i = 0) => BigInt('0x' + (data.slice(2 + i * 64, 2 + (i + 1) * 64) || '0'));
export const call = (to, data, block = 'latest') => rpc('eth_call', [{ to, data }, block]);

export function decodeString(data) {
  if (!data || data === '0x') return null;
  try {
    const off = Number(word(data, 0));
    const len = Number(BigInt('0x' + data.slice(2 + off * 2, 2 + off * 2 + 64)));
    const bytes = data.slice(2 + off * 2 + 64, 2 + off * 2 + 64 + len * 2);
    return Buffer.from(bytes, 'hex').toString('utf8');
  } catch {
    return null;
  }
}

// Run async jobs with limited concurrency.
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}
