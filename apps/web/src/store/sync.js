import { ApiError, api } from '../api/client.js';
import { useEditorStore } from './useEditorStore.js';

const SAVE_DELAY_MS = 1000;

let timer;
let chain = Promise.resolve();

export function scheduleSave() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    enqueue();
  }, SAVE_DELAY_MS);
}

/** Saves immediately and resolves when the latest edit has been stored. */
export function saveNow() {
  clearTimeout(timer);
  return enqueue();
}

function enqueue() {
  chain = chain.then(flush).catch(() => {});
  return chain;
}

async function flush() {
  const snapshot = useEditorStore.getState();
  if (!snapshot.user || !snapshot.dirty || snapshot.saveStatus === 'conflict' || !snapshot.resume.id) return;

  useEditorStore.setState({ saveStatus: 'saving', saveError: null });
  try {
    const profileSaved = await api('/api/profile', {
      method: 'PUT',
      body: { revision: snapshot.profileRevision, profile: snapshot.profile },
    });
    applyProfile(snapshot.profile, profileSaved);

    const latest = useEditorStore.getState();
    const resumeSaved = await api(`/api/resumes/${latest.resume.id}`, {
      method: 'PUT',
      body: {
        revision: latest.resume.revision,
        name: latest.resume.name,
        settings: latest.resume.settings,
      },
    });
    const resumeSnapshot = { name: latest.resume.name, settings: latest.resume.settings };
    useEditorStore.setState((state) => {
      const resumeSame =
        state.resume.name === resumeSnapshot.name && state.resume.settings === resumeSnapshot.settings;
      state.resume.revision = resumeSaved.revision;
      if (resumeSame) {
        state.resume.name = resumeSaved.name;
        state.resume.settings = resumeSaved.settings;
      }
      if (resumeSame && state.profile === profileSaved.profile) {
        state.dirty = false;
        state.saveStatus = 'saved';
      } else {
        state.dirty = true;
      }
    });
    if (useEditorStore.getState().dirty) return flush();
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CONFLICT') {
      useEditorStore.setState({ saveStatus: 'conflict', saveError: error.message });
      return;
    }
    if (error instanceof ApiError && error.status === 401) {
      useEditorStore.setState({ authStatus: 'anonymous', user: null, saveStatus: 'idle', dirty: false });
      return;
    }
    useEditorStore.setState({
      saveStatus: 'error',
      saveError: error instanceof Error ? error.message : 'Could not save.',
    });
  }
}

function applyProfile(sentProfile, saved) {
  useEditorStore.setState((state) => {
    state.profileRevision = saved.revision;
    if (state.profile === sentProfile) state.profile = saved.profile;
    else state.dirty = true;
  });
}
