import { ApiError, api, apiForm } from '../api/client.js';
import { pauseSaves, resumeSaves, saveNow } from './sync.js';
import { useEditorStore } from './useEditorStore.js';

async function savedRevision() {
  await saveNow();
  const { saveStatus, saveError, profileRevision } = useEditorStore.getState();
  if (saveStatus === 'conflict') {
    throw new ApiError(409, 'CONFLICT', 'This resume changed in another session. Reload and try again.');
  }
  if (saveStatus === 'error') {
    throw new ApiError(0, 'SAVE_FAILED', saveError || 'Could not save your latest changes.');
  }
  return profileRevision;
}

function applyPhoto(photo, revision) {
  useEditorStore.setState((state) => {
    state.profile.basics.photo = photo;
    state.profileRevision = revision;
  });
}

async function withPhotoSave(run) {
  const revision = await savedRevision();
  pauseSaves();
  try {
    const result = await run(revision);
    applyPhoto(result.photo, result.revision);
  } finally {
    resumeSaves();
  }
}

export function uploadPhoto(file) {
  return withPhotoSave((revision) => {
    const body = new FormData();
    body.append('photo', file);
    body.append('revision', String(revision));
    return apiForm('/api/profile/photo', { body });
  });
}

export function removePhoto() {
  return withPhotoSave((revision) => api('/api/profile/photo', { method: 'DELETE', body: { revision } }));
}
