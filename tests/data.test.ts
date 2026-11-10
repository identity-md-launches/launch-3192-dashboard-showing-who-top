import { describe, expect, it } from 'vitest';
import { breakdown, parseSnapshot, rankHolders, toCSV, topShare, type Options } from '../src/data';
import { fixture } from './fixture';

const s = parseSnapshot(fixture);
const base: Options = { view: 'holders', countStaked: true, countLocked: true, sort: 'total', query: '' };

describe('rankHolders', () => {
  it('leaves custody contracts out of the holder view and ranks by wallet + staked + locked', () => {
    const { rows } = rankHolders(s.holders, base);
    expect(rows.map((r) => r.address.slice(0, 6))).toEqual(['0xaaaa', '0xcccc', '0xbbbb', '0xdddd']);
    expect(rows[1].total).toBe(280);
  });
  it('drops staked and locked IMD from the total when their toggles are off', () => {
    const { rows } = rankHolders(s.holders, { ...base, countStaked: false, countLocked: false });
    expect(rows.map((r) => r.address.slice(0, 6))).toEqual(['0xbbbb', '0xcccc', '0xdddd', '0xaaaa']);
  });
  it('keeps ranks from the full view while searching', () => {
    const { rows, ranked } = rankHolders(s.holders, { ...base, query: 'DDDD' });
    expect(ranked).toBe(4);
    expect(rows).toHaveLength(1);
    expect(rows[0].rank).toBe(4);
  });
  it('matches contract names and filters by kind', () => {
    expect(rankHolders(s.holders, { ...base, view: 'all', query: 'safe' }).rows).toHaveLength(1);
    expect(rankHolders(s.holders, { ...base, view: 'wallets' }).rows.every((r) => r.kind === 'wallet')).toBe(true);
    expect(rankHolders(s.holders, { ...base, view: 'contracts' }).rows).toHaveLength(4);
  });
  it('sorts by one column and lists only addresses with a balance in it', () => {
    const { rows } = rankHolders(s.holders, { ...base, sort: 'locked' });
    expect(rows.map((r) => r.locked)).toEqual([30]);
  });
});

describe('summaries', () => {
  it('counts the top holders share of supply', () => {
    expect(topShare(rankHolders(s.holders, base).rows, 2, s.totalSupply)).toBeCloseTo(0.59);
  });
  it('splits the supply by where it is held and sums to the supply', () => {
    const b = breakdown(s);
    expect(b.reduce((t, x) => t + x.amount, 0)).toBe(1000);
    expect(b[0]).toMatchObject({ id: 'staking', amount: 400 });
  });
  it('writes a CSV with a header and one line per row', () => {
    const csv = toCSV(rankHolders(s.holders, base).rows, base, s.totalSupply).trim().split('\n');
    expect(csv[0]).toContain('total_imd_wallet_staked_locked');
    expect(csv).toHaveLength(5);
    expect(csv[2]).toContain(',Safe,contract,');
    expect(csv[2]).toContain('2027-01-05T07:44:47');
  });
  it('rejects a file that is not a snapshot', () => {
    expect(() => parseSnapshot({} as never)).toThrow(/expected format/);
  });
});
