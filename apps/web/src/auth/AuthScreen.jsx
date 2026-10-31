import { useState } from 'react';
import { ApiError } from '../api/client.js';
import { useEditorStore } from '../store/useEditorStore.js';
import { login, register } from '../store/session.js';

export function AuthScreen() {
  const serverError = useEditorStore((state) => state.saveError);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const creating = mode === 'register';

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (creating) await register({ email, password, displayName });
      else await login({ email, password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="gate">
      <form className="gate__card" onSubmit={submit}>
        <h1 className="gate__title">cv-craft</h1>
        <p className="gate__lede">{creating ? 'Create an account to keep your resume.' : 'Sign in to your resume.'}</p>
        {serverError ? <p className="form-error">{serverError}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {creating ? (
          <label className="field">
            <span>Name</span>
            <input value={displayName} autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} />
          </label>
        ) : null}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={creating ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="button" disabled={busy}>
          {busy ? 'Please wait…' : creating ? 'Create account' : 'Sign in'}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setMode(creating ? 'login' : 'register');
            setError(null);
          }}
        >
          {creating ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </main>
  );
}
