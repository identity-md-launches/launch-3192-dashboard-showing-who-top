import type { Snapshot } from '../data';
import { count, etherscan, imd } from '../format';

export default function About({ data }: { data: Snapshot }) {
  const unreleased = data.holders.filter((h) => h.kind === 'unreleased').reduce((t, h) => t + h.wallet, 0);
  return (
    <section id="about" className="section prose" aria-labelledby="about-title">
      <h2 id="about-title">How the numbers are built</h2>
      <p>
        Balances come from all {count(data.transfers)} IMD transfers on Ethereum, from the{' '}
        <a href={etherscan(data.token.address)} target="_blank" rel="noreferrer">token contract</a> deployment up to block{' '}
        {count(data.block)}. The 200 largest were checked against <code>balanceOf</code> at that block and matched.
      </p>
      <p>
        <strong>Staked</strong> is each address’s share of the{' '}
        <a href={etherscan(data.token.vault)} target="_blank" rel="noreferrer">StakedIMD vault</a>, from{' '}
        {count(data.stakeTransfers)} sIMD transfers, valued at the vault’s rate: {imd(data.vault.assets)} IMD for{' '}
        {imd(data.vault.shares)} sIMD. It includes sIMD posted as collateral in the{' '}
        <a href={etherscan(data.collateral.address)} target="_blank" rel="noreferrer">ParameterizedVault</a>:{' '}
        {imd(data.collateral.imd)} IMD across {count(data.collateral.accounts)} positions, credited to each position owner.
      </p>
      <p>
        <strong>Locked</strong> is IMD in{' '}
        <a href={etherscan(data.locks.address)} target="_blank" rel="noreferrer">SitOnHands</a>, an ownerless vault for
        voluntary time locks of 1 to 365 days: {imd(data.locks.open)} IMD in {count(data.locks.positions)} positions, read
        position by position and credited to each depositor.
      </p>
      <p>
        <strong>Unvested.</strong> No team or investor vesting contract holds IMD on Ethereum: every contract with 100 IMD
        or more is named above. POOL4 holds IMD for staking, bonding and node rewards that have not yet been released (
        {imd(unreleased)} IMD in its reward distributor and dripper). These balances are shown as unreleased protocol
        rewards. HamsterVault vests HAMSTER, not IMD; the IMD it holds is counted as a contract balance.
      </p>
      <h3>Limits</h3>
      <ul>
        <li>Ethereum only. IMD also lives on Base and Robinhood Chain; those balances are not counted.</li>
        <li>IMD in Uniswap pools is shown under the pool, not under the people who provided the liquidity.</li>
        <li>One person can control several addresses. Each address is ranked on its own.</li>
        <li>This is a snapshot, not a live feed. Run <code>npm run snapshot</code> to refresh it.</li>
      </ul>
    </section>
  );
}
