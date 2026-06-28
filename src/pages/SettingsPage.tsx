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
          Store your backend admin API key locally in this browser only. It is never sent to the
          frontend host and is not included in the build.
        </p>
      </div>

      <div className={`settings-status ${isConfigured ? 'settings-status--connected' : 'settings-status--locked'}`}>
        <strong>{isConfigured ? 'Admin connected' : 'Read-only mode'}</strong>
        <p>
          {isConfigured
            ? `A key is saved locally (${maskAdminApiKey(adminApiKey ?? '')}). Protected monitor routes will include Authorization: Bearer.`
            : 'Public summary and incident endpoints remain available without a key.'}
        </p>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label htmlFor="admin-api-key">Admin API key</label>
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
