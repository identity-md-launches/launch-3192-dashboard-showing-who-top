import { useState } from 'react';
import type { Kind, Options, Ranked, SortKey } from '../data';
import { count, etherscan, imd, share, until } from '../format';

const KIND_LABEL: Record<Kind, string> = {
  wallet: 'Wallet',
  contract: 'Contract',
  staking: 'Staking vault',
  lock: 'Lock vault',
  liquidity: 'Liquidity',
  unreleased: 'Unreleased rewards',
  protocol: 'Protocol',
  burn: 'Burn',
};

interface Props {
  rows: Ranked[];
  matched: number;
  ranked: number;
  opts: Options;
  supply: number;
  onSort: (k: SortKey) => void;
  onClear: () => void;
}

export default function HolderTable({ rows, matched, ranked, opts, supply, onSort, onClear }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (a: string) => {
    try {
      await navigator.clipboard.writeText(a);
      setCopied(a);
      setTimeout(() => setCopied((c) => (c === a ? null : c)), 1500);
    } catch {
      setCopied(null);
    }
  };

  const head = (key: SortKey, label: string) => (
    <th scope="col" className="num" aria-sort={opts.sort === key ? 'descending' : undefined}>
      <button type="button" className={opts.sort === key ? 'sort on' : 'sort'} onClick={() => onSort(key)}>
        {label}
        <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12">
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </th>
  );

  const q = opts.query.trim();
  return (
    <>
      <p className="count" role="status">
        {q
          ? `${count(matched)} of ${count(ranked)} match “${q}”.`
          : `Showing ${count(rows.length)} of ${count(ranked)} ${opts.sort === 'staked' ? 'stakers' : opts.sort === 'locked' ? 'lockers' : 'addresses'}, largest first.`}
        {copied && ' Address copied.'}
      </p>
      {rows.length === 0 ? (
        <div className="empty">
          <p>{q ? `No address in this view matches “${q}”.` : 'No addresses match these filters.'}</p>
          <button type="button" className="btn" onClick={onClear}>
            Reset filters
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" className="rank">#</th>
                <th scope="col" className="addr-h">Address</th>
                {head('wallet', 'In wallet')}
                {head('staked', 'Staked')}
                {head('locked', 'Locked')}
                {head('total', 'Total')}
                <th scope="col" className="num share-h">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.address}>
                  <td className="rank">{count(r.rank)}</td>
                  <td className="who">
                    <div className="who-in">
                    <span className="addr-line">
                      <a className="addr" href={etherscan(r.address)} target="_blank" rel="noreferrer" title="View on Etherscan">
                        {r.address}
                      </a>
                      <button type="button" className="icon" onClick={() => void copy(r.address)} aria-label={`Copy address ${r.address}`}>
                        {copied === r.address ? (
                          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : (
                          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                        )}
                      </button>
                    </span>
                    <span className={`tag tag-${r.kind}`}>
                      {r.name ?? KIND_LABEL[r.kind]}
                      {r.unlockTime > 0 && ` · locked until ${until(r.unlockTime)}`}
                    </span>
                    </div>
                  </td>
                  <td className="num" data-label="In wallet">{imd(r.wallet)}</td>
                  <td className="num" data-label="Staked">{imd(r.staked)}</td>
                  <td className="num" data-label="Locked" title={r.unlockTime ? `Unlocks by ${until(r.unlockTime)}` : undefined}>
                    {imd(r.locked)}
                  </td>
                  <td className="num total" data-label="Total">{imd(r.total)}</td>
                  <td className="num" data-label="Share">{share(r.total / supply)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
