import { ApiError, api } from '../api/client.js';
import { reloadDocument } from './session.js';
import { cancelPendingSaves, pauseSaves, resumeSaves, saveNow, whenIdle } from './sync.js';
import { useEditorStore } from './useEditorStore.js';

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

function exportFilename(profile) {
  const name = (profile?.basics?.fullName ?? '')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${name || 'cv-craft'}.json`;
}

export async function exportDocument() {
  await saveNow();
  const { saveStatus, saveError } = useEditorStore.getState();
  if (saveStatus === 'conflict') {
    throw new ApiError(409, 'CONFLICT', 'This resume changed in another session. Reload before exporting.');
  }
  if (saveStatus === 'error') {
    throw new ApiError(0, 'SAVE_FAILED', saveError || 'Could not save your latest changes.');
  }
  const file = await api('/api/profile/export');
  const blob = new Blob([`${JSON.stringify(file, null, 2)}\n`], { type: 'application/json' });
  saveBlob(blob, exportFilename(file.profile));
}

export async function importDocument(raw) {
  cancelPendingSaves();
  pauseSaves();
  try {
    await whenIdle();
    await api('/api/profile/import', { method: 'POST', body: raw });
    await reloadDocument();
  } finally {
    resumeSaves();
  }
}
