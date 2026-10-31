import { useRef, useState } from 'react';
import { ApiError } from './api/client.js';
import { useConfirm } from './confirm/ConfirmDialog.jsx';
import { exportDocument, importDocument } from './store/transfer.js';

function message(error) {
  if (error instanceof ApiError && error.code === 'VALIDATION_FAILED' && error.details?.length) {
    const first = error.details[0];
    return first.path ? `${first.path}: ${first.message}` : first.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function TransferButtons() {
  const confirm = useConfirm();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onExport = async () => {
    setBusy(true);
    setError(null);
    try {
      await exportDocument();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const onPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    let raw;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      setError('That file is not JSON.');
      return;
    }
    const ok = await confirm({
      title: 'Import JSON',
      message: 'This replaces your saved profile and resumes. The photo is not included in the file.',
      confirmLabel: 'Import',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await importDocument(raw);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="quiet" disabled={busy} onClick={onExport}>
        Export
      </button>
      <button type="button" className="quiet" disabled={busy} onClick={() => inputRef.current?.click()}>
        Import
      </button>
      <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={onPick} />
      {error ? <span className="designbar__error">{error}</span> : null}
    </>
  );
}
