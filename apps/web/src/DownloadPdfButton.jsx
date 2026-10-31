import { useState } from 'react';
import { api } from './api/client.js';
import { useEditorStore } from './store/useEditorStore.js';
import { saveNow } from './store/sync.js';

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function describe(error) {
  if (error.code === 'VALIDATION_FAILED' && error.details?.length) {
    const first = error.details[0];
    return `Fix "${first.path}": ${first.message}`;
  }
  return error.message;
}

export function DownloadPdfButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveNow();
      const { resume, saveStatus, saveError } = useEditorStore.getState();
      if (saveStatus === 'conflict') {
        setError('This resume changed in another session. Reload before downloading.');
        return;
      }
      if (saveStatus === 'error') {
        setError(saveError || 'Could not save your latest changes.');
        return;
      }
      const file = await api(`/api/resumes/${resume.id}/pdf`);
      saveBlob(file.blob, file.filename);
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="download">
      {error ? (
        <span className="download__error" role="alert">
          {error}{' '}
          <button type="button" className="link-button" onClick={() => window.print()}>
            Print instead
          </button>
        </span>
      ) : null}
      <button type="button" className="button" onClick={download} disabled={busy}>
        {busy ? 'Preparing PDF…' : 'Download PDF'}
      </button>
    </div>
  );
}
