import { FormEvent, useState } from 'react';
import { maskAdminApiKey } from '../auth/adminKey';
import { AlertSettingsSection } from '../components/AlertSettingsSection';
import { useAdminKey } from '../context/AdminKeyContext';

export function SettingsPage() {
  const { adminApiKey, isConfigured, saveAdminApiKey, clearKey } = useAdminKey();
  const [draftKey, setDraftKey] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draftKey.trim();
    if (!trimmed) {
      return;
    }
    saveAdminApiKey(trimmed);
    setDraftKey('');
    setSavedMessage(`Saved admin key ${maskAdminApiKey(trimmed)}.`);
  }

  function handleClear() {
    clearKey();
    setDraftKey('');
    setSavedMessage('Admin key cleared. Monitor management is locked.');
  }

  return (
    <section className="settings-panel" aria-label="Settings">
      <div className="panel-section__header">
        <h2>Settings</h2>
        <p className="panel-section__hint">
          Connect your backend admin API key for monitor and status-page management. The key is stored
          only in this browser&apos;s localStorage — never on the frontend host, never in build env,
          and never sent to Cloudflare or other static hosts.
        </p>
      </div>

      <div className={`settings-status ${isConfigured ? 'settings-status--connected' : 'settings-status--locked'}`}>
        <div className="settings-status__label">
          <span
            className={`settings-status__dot ${isConfigured ? 'settings-status__dot--connected' : 'settings-status__dot--disconnected'}`}
            aria-hidden="true"
          />
          <strong>{isConfigured ? 'Admin connected' : 'Disconnected — read-only mode'}</strong>
        </div>
        <p>
          {isConfigured
            ? `Key saved in this browser only (${maskAdminApiKey(adminApiKey ?? '')}). Protected routes send Authorization: Bearer.`
            : 'Public dashboard summary, incidents, and /status/default remain available without a key.'}
        </p>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label htmlFor="admin-api-key">Admin API key</label>
        <p className="settings-form__help">
          Paste the ADMIN_API_KEY from your backend deployment. The full value is never shown after
          saving.
        </p>
        <input
          id="admin-api-key"
          name="admin-api-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste ADMIN_API_KEY from your backend deployment"
          value={draftKey}
          onChange={(event) => setDraftKey(event.target.value)}
        />
        <div className="settings-form__actions">
          <button type="submit" className="button button--primary" disabled={!draftKey.trim()}>
            Save key
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={handleClear}
            disabled={!isConfigured}
          >
            Clear key
          </button>
        </div>
      </form>

      {savedMessage && (
        <p className="settings-message" role="status">
          {savedMessage}
        </p>
      )}

      <AlertSettingsSection />
    </section>
  );
}
