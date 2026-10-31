import { ApiError, api } from '../api/client.js';
import { restoreState } from './initialState.js';
import { saveNow } from './sync.js';
import { useEditorStore } from './useEditorStore.js';

const LOCAL_KEY = 'cv-craft:editor';

function isBlank(profile) {
  const basics = profile?.basics ?? {};
  const hasBasics = basics.fullName || basics.headline || basics.email || basics.phone || basics.location;
  if (hasBasics || basics.links?.length || profile?.summary) return false;
  return (profile?.sections ?? []).every((section) => section.items.length === 0);
}

/** Browser-only data from before accounts existed. Removed once it is copied to the server. */
function readLocalBackup() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return restoreState(parsed.state ?? parsed);
  } catch {
    return null;
  }
}

async function hydrate(user) {
  const [profileRecord, list] = await Promise.all([api('/api/profile'), api('/api/resumes')]);
  let resumeId = list.resumes[0]?.id;
  if (!resumeId) {
    resumeId = (await api('/api/resumes', { method: 'POST', body: { name: 'My resume' } })).id;
  }
  const resume = await api(`/api/resumes/${resumeId}`);

  let profile = profileRecord.profile;
  let name = resume.name;
  let settings = resume.settings;
  let dirty = false;
  const local = readLocalBackup();
  if (local && isBlank(profile) && !isBlank(local.profile)) {
    profile = local.profile;
    name = local.resume.name;
    settings = local.resume.settings;
    dirty = true;
    localStorage.removeItem(LOCAL_KEY);
  }

  useEditorStore.setState((state) => {
    state.user = user;
    state.authStatus = 'ready';
    state.profile = profile;
    state.profileId = profileRecord.id;
    state.profileRevision = profileRecord.revision;
    state.resume = { id: resume.id, name, settings, revision: resume.revision };
    state.dirty = dirty;
    state.saveStatus = 'idle';
    state.saveError = null;
  });
  if (dirty) await saveNow();
}

export async function bootstrap() {
  try {
    const { user } = await api('/api/auth/me');
    await hydrate(user);
  } catch (error) {
    const unreachable = error instanceof ApiError && (error.status === 0 || error.status === 502);
    useEditorStore.setState({
      authStatus: 'anonymous',
      user: null,
      saveStatus: 'idle',
      saveError: unreachable ? error.message : null,
    });
  }
}

export async function reloadDocument() {
  const { user } = useEditorStore.getState();
  if (!user) return bootstrap();
  await hydrate(user);
}

export async function login(body) {
  const { user } = await api('/api/auth/login', { method: 'POST', body });
  await hydrate(user);
}

export async function register(body) {
  const { user } = await api('/api/auth/register', { method: 'POST', body });
  await hydrate(user);
}

export async function logout() {
  await api('/api/auth/logout', { method: 'POST', body: {} });
  useEditorStore.getState().actions.resetLocal();
  useEditorStore.setState({ authStatus: 'anonymous', user: null, saveStatus: 'idle', saveError: null, dirty: false });
}

export async function changePassword(body) {
  const { user } = await api('/api/auth/change-password', { method: 'POST', body });
  useEditorStore.setState((state) => {
    state.user = user;
  });
}
