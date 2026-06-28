import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SettingsPage } from '../src/pages/SettingsPage';
import { getAdminApiKey } from '../src/auth/adminKey';
import { renderWithProviders } from './testUtils';

describe('SettingsPage', () => {
  it('saves and clears the admin API key without exposing the full key', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(screen.getByText('Disconnected — read-only mode')).toBeInTheDocument();
    expect(screen.getByText(/stored only in this browser/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Admin API key'), 'super-secret-admin-key-1234');
    await user.click(screen.getByRole('button', { name: 'Save key' }));

    expect(getAdminApiKey()).toBe('super-secret-admin-key-1234');
    expect(screen.queryByDisplayValue('super-secret-admin-key-1234')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved admin key ••••1234');
    expect(screen.getByText(/Key saved in this browser only \(••••1234\)/)).toBeInTheDocument();
    expect(screen.queryByText('super-secret-admin-key-1234')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear key' }));

    expect(getAdminApiKey()).toBeNull();
    expect(screen.getByText('Disconnected — read-only mode')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Admin key cleared');
  });
});
