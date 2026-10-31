import { useState } from 'react';
import { ApiError } from '../api/client.js';
import { changePassword } from '../store/session.js';

/** @param {{ forced?: boolean, onClose?: () => void }} props */
export function PasswordForm({ forced = false, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword });
      onClose?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="gate__card" onSubmit={submit}>
      <h1 className="gate__title">{forced ? 'Choose a new password' : 'Change password'}</h1>
      {forced ? (
        <p className="gate__lede">This account was given a temporary password. Choose your own to continue.</p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <label className="field">
        <span>Current password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <label className="field">
        <span>New password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <div className="dialog__actions">
        {onClose ? (
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="button" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </div>
    </form>
  );
}
