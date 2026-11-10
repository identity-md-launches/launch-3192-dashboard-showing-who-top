import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { fixture } from './fixture';

const ok = () => vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const bodyRows = () => within(screen.getAllByRole('table')[0]).getAllByRole('row').slice(1);
const firstAddress = () => within(bodyRows()[0]).getAllByRole('link')[0].textContent;

describe('App', () => {
  it('loads the snapshot, then searches, filters, toggles and sorts', async () => {
    vi.stubGlobal('fetch', ok());
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('status')).toHaveProperty('textContent', 'Loading the holder snapshot…');
    expect(await screen.findByText('Showing 4 of 4 addresses, largest first.')).toBeTruthy();
    expect(firstAddress()).toMatch(/^0xaaaa/);

    await user.click(screen.getByRole('checkbox', { name: 'Staked' }));
    expect(firstAddress()).toMatch(/^0xbbbb/);

    await user.click(screen.getByRole('radio', { name: 'All' }));
    expect(firstAddress()).toMatch(/^0x9efa/);

    await user.click(screen.getByRole('button', { name: /Locked/ }));
    expect(bodyRows()).toHaveLength(1);
    expect(screen.getAllByRole('columnheader').find((h) => h.getAttribute('aria-sort'))?.textContent).toBe('Locked');

    await user.type(screen.getByLabelText('Find an address or contract'), 'zzz');
    expect(screen.getByText(/No address in this view matches/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect((screen.getByLabelText('Find an address or contract') as HTMLInputElement).value).toBe('');
    expect(await screen.findByText(/^Showing \d+ of \d+ addresses, largest first\.$/)).toBeTruthy();
    expect(screen.getAllByRole('columnheader').find((h) => h.getAttribute('aria-sort'))?.textContent).toBe('Total');
  });

  it('resets a filter combination that matches nothing', async () => {
    vi.stubGlobal('fetch', ok());
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Showing 4 of 4 addresses, largest first.');
    await user.click(screen.getByRole('button', { name: /Locked/ }));
    await user.click(screen.getByRole('radio', { name: 'Wallets' }));
    expect(screen.getByText('No addresses match these filters.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(await screen.findByText('Showing 7 of 7 addresses, largest first.')).toBeTruthy();
    expect(screen.getAllByRole('columnheader').find((h) => h.getAttribute('aria-sort'))?.textContent).toBe('Total');
  });

  it('downloads the current view as CSV', async () => {
    vi.stubGlobal('fetch', ok());
    const create = vi.fn(() => 'blob:x');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<App />);
    await screen.findByText(/Showing 4 of 4/);
    await userEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });

  it('shows an error with a retry that recovers', async () => {
    const f = vi.fn().mockResolvedValueOnce(new Response('nope', { status: 503 })).mockResolvedValue(new Response(JSON.stringify(fixture)));
    vi.stubGlobal('fetch', f);
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toContain('answered 503');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/Showing 4 of 4/)).toBeTruthy();
  });
});
