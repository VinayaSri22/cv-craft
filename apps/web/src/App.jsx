import { useConfirm } from './confirm/ConfirmDialog.jsx';
import { DownloadPdfButton } from './DownloadPdfButton.jsx';
import { BasicsPanel } from './editor/BasicsPanel.jsx';
import { SectionsEditor } from './editor/SectionsEditor.jsx';
import { PreviewPane } from './preview/PreviewPane.jsx';
import { useActions } from './store/useEditorStore.js';

export function App() {
  const { loadSample, reset } = useActions();
  const confirm = useConfirm();

  const confirmThen = (options, action) => async () => {
    if (await confirm(options)) action();
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="topbar__brand">cv-craft</h1>
        <div className="topbar__actions">
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
