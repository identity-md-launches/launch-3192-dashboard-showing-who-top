import type { RawSnapshot } from '../src/data';

export const fixture: RawSnapshot = {
  token: { address: '0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7', symbol: 'IMD', chain: 'Ethereum', chainId: 1, vault: '0x9efa934d9fad4ae28c998a40195646b965a97247' },
  block: 100, timestamp: 1794346127, totalSupply: 1000,
  vault: { assets: 400, shares: 50 },
  locks: { address: '0x20bcc5c678b0beea9a042cd03e3abc36d00e734a', positions: 1, open: 30, balance: 30 },
  collateral: { address: '0x0b69f8da8d8ce521d74ea69a7a3475b77302ef82', accounts: 0, imd: 0 },
  transfers: 10, stakeTransfers: 4,
  columns: ['address', 'wallet', 'staked', 'kind', 'name', 'lastBlock', 'locked', 'unlockTime'],
  holders: [
    ['0x9efa934d9fad4ae28c998a40195646b965a97247', 400, 0, 'staking', 'StakedIMD (sIMD vault)', 90, 0, 0],
    ['0x000000000004444c5dc75cb358380d2e3de08a90', 100, 0, 'liquidity', 'Uniswap v4 PoolManager', 90, 0, 0],
    ['0x20bcc5c678b0beea9a042cd03e3abc36d00e734a', 30, 0, 'lock', 'SitOnHands time locks', 90, 0, 0],
    ['0xaaaa000000000000000000000000000000000001', 10, 300, 'wallet', null, 80, 0, 0],
    ['0xbbbb000000000000000000000000000000000002', 200, 0, 'wallet', null, 70, 0, 0],
    ['0xcccc000000000000000000000000000000000003', 150, 100, 'contract', 'Safe', 60, 30, 1799135087],
    ['0xdddd000000000000000000000000000000000004', 110, 0, 'wallet', null, 50, 0, 0],
  ],
};
