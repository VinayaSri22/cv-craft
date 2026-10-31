import { useEffect, useState } from 'react';
import { AuthScreen } from './auth/AuthScreen.jsx';
import { PasswordForm } from './auth/PasswordForm.jsx';
import { DesignBar } from './DesignBar.jsx';
import { DownloadPdfButton } from './DownloadPdfButton.jsx';
import { BasicsPanel } from './editor/BasicsPanel.jsx';
import { SectionsEditor } from './editor/SectionsEditor.jsx';
import { PreviewPane } from './preview/PreviewPane.jsx';
import { useEditorStore } from './store/useEditorStore.js';
import { bootstrap, logout, reloadDocument } from './store/session.js';
import { saveNow } from './store/sync.js';

export function App() {
  const authStatus = useEditorStore((state) => state.authStatus);
  const user = useEditorStore((state) => state.user);

  useEffect(() => {
    bootstrap();
    const save = () => {
      saveNow();
    };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);

  if (authStatus === 'unknown') {
    return <p className="boot">Loading…</p>;
  }
  if (authStatus === 'anonymous' || !user) return <AuthScreen />;
  if (user.mustChangePassword) {
    return (
      <main className="gate">
        <div className="gate__stack">
          <PasswordForm forced />
          <button type="button" className="text-button" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </main>
    );
  }
  return <Editor />;
}

function Editor() {
  const user = useEditorStore((state) => state.user);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const saveError = useEditorStore((state) => state.saveError);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [zoom, setZoom] = useState(0.75);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand-group">
          <h1 className="topbar__brand">
            <span className="brand__mark" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 1.5h6L11.5 4.5V12.5h-9v-11Z" stroke="#fff" strokeWidth="1.3" />
                <path d="M8.2 1.8V4.6h2.8" stroke="#fff" strokeWidth="1.3" />
              </svg>
            </span>
            cv-craft
          </h1>
          <SaveStatus status={saveStatus} error={saveError} onRetry={saveNow} />
        </div>
        <div className="topbar__account">
          <span className="topbar__user" title={user.email}>
            {user.email}
          </span>
          <button type="button" className="quiet" onClick={() => setPasswordOpen(true)}>
            Password
          </button>
          <button type="button" className="quiet" onClick={() => logout()}>
            Log out
          </button>
          <span className="topbar__rule" aria-hidden="true" />
          <DownloadPdfButton />
        </div>
      </header>
      <DesignBar zoom={zoom} onZoom={setZoom} />

      {saveStatus === 'conflict' ? (
        <div className="banner" role="alert">
          This resume was updated in another session.
          <button type="button" className="button" onClick={() => reloadDocument()}>
            Reload
          </button>
        </div>
      ) : null}

      {passwordOpen ? (
        <div className="dialog-backdrop" onMouseDown={() => setPasswordOpen(false)}>
          <div onMouseDown={(event) => event.stopPropagation()}>
            <PasswordForm onClose={() => setPasswordOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="workspace">
        <aside className="editor" aria-label="Resume editor">
          <BasicsPanel />
          <SectionsEditor />
        </aside>
        <PreviewPane zoom={zoom} />
      </main>
    </div>
  );
}

function SaveStatus({ status, error, onRetry }) {
  if (status === 'saving') {
    return (
      <span className="save save--saving">
        <span className="save__dot" />
        Saving
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="save save--saved">
        <span className="save__dot" />
        Saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="save save--error">
        <span className="save__dot" />
        {error || 'Could not save'}
        <button type="button" className="link-button" onClick={onRetry}>
          Retry
        </button>
      </span>
    );
  }
  return null;
}
