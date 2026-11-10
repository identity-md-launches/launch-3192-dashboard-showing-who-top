import type { Options, View } from '../data';

const VIEWS: { id: View; label: string }[] = [
  { id: 'holders', label: 'Holders' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'all', label: 'All' },
];

export default function Controls({ opts, onChange }: { opts: Options; onChange: (p: Partial<Options>) => void }) {
  return (
    <div className="controls">
      <div className="field search">
        <label htmlFor="q">Find an address or contract</label>
        <input
          id="q"
          type="search"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x… or Safe"
          value={opts.query}
          onChange={(e) => onChange({ query: e.target.value })}
        />
      </div>
      <fieldset className="field view">
        <legend>Show</legend>
        <div className="seg">
          {VIEWS.map((v) => (
            <label key={v.id}>
              <input type="radio" name="view" value={v.id} checked={opts.view === v.id} onChange={() => onChange({ view: v.id })} />
              <span>{v.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>Count in the total</legend>
        <div className="checks">
          <label className="check">
            <input type="checkbox" checked={opts.countStaked} onChange={(e) => onChange({ countStaked: e.target.checked })} />
            <span>Staked</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={opts.countLocked} onChange={(e) => onChange({ countLocked: e.target.checked })} />
            <span>Locked</span>
          </label>
        </div>
      </fieldset>
      <p className="hint">
        {opts.view === 'holders'
          ? 'Holders leaves out the staking, lock, pool, reward and burn contracts, whose IMD belongs to others.'
          : opts.view === 'all'
            ? 'All includes the staking and lock contracts, so their IMD appears twice: on the contract and with each owner.'
            : opts.view === 'wallets'
              ? 'Wallets are accounts without contract code, delegated accounts, Safes and smart wallets.'
              : 'Contracts are every address with contract code that is not a wallet.'}
      </p>
    </div>
  );
}
