const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const small = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });

export const imd = (n: number) => (n === 0 ? '0' : Math.abs(n) >= 100 ? whole.format(n) : n < 0.01 ? '<0.01' : small.format(n));
export const share = (n: number) => (n > 0 && n < 0.0001 ? '<0.01%' : pct.format(n));
export const short = (n: number) => compact.format(n);
export const count = (n: number) => whole.format(n);
export const date = (t: number) =>
  new Date(t * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' });
export const until = (t: number) =>
  new Date(t * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const etherscan = (a: string) => `https://etherscan.io/address/${a}`;
