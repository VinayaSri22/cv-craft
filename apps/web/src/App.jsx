import { useEffect, useState } from 'react';
import { AuthScreen } from './auth/AuthScreen.jsx';
import { PasswordForm } from './auth/PasswordForm.jsx';
import { useConfirm } from './confirm/ConfirmDialog.jsx';
import { DownloadPdfButton } from './DownloadPdfButton.jsx';
import { BasicsPanel } from './editor/BasicsPanel.jsx';
import { SectionsEditor } from './editor/SectionsEditor.jsx';
import { PreviewPane } from './preview/PreviewPane.jsx';
import { useActions, useEditorStore } from './store/useEditorStore.js';
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
  const { loadSample, reset } = useActions();
  const confirm = useConfirm();
  const user = useEditorStore((state) => state.user);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const saveError = useEditorStore((state) => state.saveError);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const confirmThen = (options, action) => async () => {
    if (await confirm(options)) action();
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand-group">
          <h1 className="topbar__brand">cv-craft</h1>
          <SaveStatus status={saveStatus} error={saveError} onRetry={saveNow} />
        </div>
        <div className="topbar__actions">
          <span className="topbar__user">{user.email}</span>
          <button type="button" className="button button--ghost" onClick={() => setPasswordOpen(true)}>
            Password
          </button>
          <button type="button" className="button button--ghost" onClick={() => logout()}>
            Log out
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={confirmThen(
              {
                title: 'Load sample profile',
                message: 'This replaces your current details with the sample profile.',
                confirmLabel: 'Load sample',
              },
              loadSample,
            )}
          >
            Load sample
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={confirmThen(
              {
                title: 'Start over',
                message: 'This permanently clears all of your details.',
                confirmLabel: 'Clear data',
                danger: true,
              },
              reset,
            )}
          >
            Start over
          </button>
          <DownloadPdfButton />
        </div>
      </header>

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
        <PreviewPane />
      </main>
    </div>
  );
}

function SaveStatus({ status, error, onRetry }) {
  if (status === 'saving') return <span className="save-status">Saving…</span>;
  if (status === 'saved') return <span className="save-status">Saved</span>;
  if (status === 'error') {
    return (
      <span className="save-status save-status--error">
        {error || 'Could not save.'}{' '}
        <button type="button" className="link-button" onClick={onRetry}>
          Retry
        </button>
      </span>
    );
  }
  return null;
}
