import { useState } from 'react';
import { renderPdf } from './api/client.js';
import { useEditorStore } from './store/useEditorStore.js';

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
    const { profile, resume } = useEditorStore.getState();
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await renderPdf(profile, resume.settings);
      saveBlob(blob, filename);
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
