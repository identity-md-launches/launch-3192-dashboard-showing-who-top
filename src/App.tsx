import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseSnapshot, rankHolders, topShare, toCSV, type Options, type RawSnapshot, type Snapshot } from './data';
import { count, date, etherscan, share, short } from './format';
import Controls from './components/Controls';
import HolderTable from './components/HolderTable';
import Breakdown from './components/Breakdown';
import About from './components/About';

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: Snapshot };

const PAGE = 25;

export default function App() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [opts, setOpts] = useState<Options>({ view: 'holders', countStaked: true, countLocked: true, sort: 'total', query: '' });
  const [shown, setShown] = useState(PAGE);

  const fetchData = useCallback(async () => {
    setLoad({ state: 'loading' });
    try {
      const res = await fetch('data/holders.json');
      if (!res.ok) throw new Error(`The snapshot file answered ${res.status}.`);
      setLoad({ state: 'ready', data: parseSnapshot((await res.json()) as RawSnapshot) });
    } catch (e) {
      setLoad({ state: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const update = (patch: Partial<Options>) => {
    setOpts((o) => ({ ...o, ...patch }));
    setShown(PAGE);
  };

  const data = load.state === 'ready' ? load.data : null;
  const result = useMemo(() => (data ? rankHolders(data.holders, opts) : null), [data, opts]);
  const ranking = useMemo(
    () => (data ? rankHolders(data.holders, { ...opts, view: 'holders', sort: 'total', query: '' }).rows : []),
    [data, opts],
  );

  const download = () => {
    if (!data || !result) return;
    const blob = new Blob([toCSV(result.rows, opts, data.totalSupply)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imd-holders-block-${data.block}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <a className="skip" href="#holders">Skip to the holder list</a>
      <header className="top">
        <div className="wrap top-inner">
          <a className="brand" href="#">
            <img src="favicon.svg" alt="" width="24" height="24" />
            <span>IMD holders</span>
          </a>
          <nav aria-label="Page">
            <a href="#supply">Supply</a>
            <a href="#about">Method</a>
            <button type="button" className="btn" onClick={download} disabled={!result}>
              Download CSV
            </button>
          </nav>
        </div>
      </header>

      <main className="wrap" id="main">
        <section className="intro" aria-labelledby="title">
          <h1 id="title">Top IMD holders</h1>
          <p className="lede">
            Every Ethereum address holding IMD, with staked and locked IMD credited to owners.
            {data && (
              <>
                {' '}Block{' '}
                <a href={`https://etherscan.io/block/${data.block}`} target="_blank" rel="noreferrer">
                  {count(data.block)}
                </a>
                , {date(data.timestamp)}.
              </>
            )}
          </p>
        </section>

        {load.state === 'loading' && (
          <p className="state" role="status">
            Loading the holder snapshot…
          </p>
        )}
        {load.state === 'error' && (
          <div className="state state-error" role="alert">
            <p>Unable to load the holder snapshot. {load.message}</p>
            <button type="button" className="btn" onClick={() => void fetchData()}>
              Try again
            </button>
          </div>
        )}

        {data && result && (
          <>
            <dl className="stats">
              <div>
                <dt>IMD on Ethereum</dt>
                <dd>{short(data.totalSupply)}</dd>
              </div>
              <div>
                <dt>Holders</dt>
                <dd>{count(ranking.length)}</dd>
              </div>
              <div>
                <dt>Staked</dt>
                <dd>{share(data.vault.assets / data.totalSupply)}</dd>
              </div>
              <div>
                <dt>Top 10 hold</dt>
                <dd>{share(topShare(ranking, 10, data.totalSupply))}</dd>
              </div>
            </dl>

            <section id="holders" className="holders" aria-labelledby="holders-title">
              <h2 id="holders-title" className="sr-only">
                Holder list
              </h2>
              <Controls opts={opts} onChange={update} />
              <HolderTable
                rows={result.rows.slice(0, shown)}
                matched={result.rows.length}
                ranked={result.ranked}
                opts={opts}
                supply={data.totalSupply}
                onSort={(sort) => update({ sort })}
                onClear={() => update({ query: '', view: 'all' })}
              />
              {shown < result.rows.length && (
                <button type="button" className="btn more" onClick={() => setShown((n) => n + PAGE * 4)}>
                  Show {Math.min(PAGE * 4, result.rows.length - shown)} more
                </button>
              )}
            </section>

            <Breakdown data={data} />
            <About data={data} />
          </>
        )}
      </main>

      <footer className="foot">
        <div className="wrap">
          <p>
            Token{' '}
            <a href={etherscan('0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7')} target="_blank" rel="noreferrer">
              IMD on Etherscan
            </a>
            . Data is a static snapshot read from Ethereum mainnet.
          </p>
        </div>
      </footer>
    </>
  );
}
