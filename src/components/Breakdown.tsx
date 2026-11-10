import { breakdown, named, type Snapshot } from '../data';
import { count, etherscan, imd, share } from '../format';

export default function Breakdown({ data }: { data: Snapshot }) {
  const buckets = breakdown(data);
  const contracts = named(data);
  return (
    <section id="supply" className="section" aria-labelledby="supply-title">
      <h2 id="supply-title">Where the Ethereum supply sits</h2>
      <p className="section-lede">
        {imd(data.totalSupply)} IMD exist on Ethereum. Staked IMD is counted once here, in the vault that holds it.
      </p>
      <div className="bar" aria-hidden="true">
        {buckets.map((b) => (
          <span key={b.id} className={`bar-${b.id}`} style={{ flexGrow: b.amount }} />
        ))}
      </div>
      <table className="table plain">
        <caption className="sr-only">IMD on Ethereum by where it is held</caption>
        <thead>
          <tr>
            <th scope="col">Held as</th>
            <th scope="col" className="num">Addresses</th>
            <th scope="col" className="num">IMD</th>
            <th scope="col" className="num">Share</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.id}>
              <th scope="row">
                <span className={`dot bar-${b.id}`} aria-hidden="true" />
                {b.label}
              </th>
              <td className="num">{count(b.addresses)}</td>
              <td className="num">{imd(b.amount)}</td>
              <td className="num">{share(b.amount / data.totalSupply)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Named contracts</h3>
      <p className="section-lede">
        Contracts holding 100 IMD or more, named from the IMD docs or their verified source on Blockscout.
      </p>
      <ul className="named">
        {contracts.map((h) => (
          <li key={h.address}>
            <span className="named-name">{h.name}</span>
            <a className="addr" href={etherscan(h.address)} target="_blank" rel="noreferrer">
              {h.address}
            </a>
            <span className="named-amt">{imd(h.wallet + h.staked)} IMD</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
