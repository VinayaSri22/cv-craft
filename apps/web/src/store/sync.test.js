import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client.js';
import { saveNow } from './sync.js';
import { useEditorStore } from './useEditorStore.js';

vi.mock('../api/client.js', () => ({
  api: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
}));

describe('autosave', () => {
  beforeEach(() => {
    let profileRevision = 1;
    let resumeRevision = 1;
    api.mockReset();
    api.mockImplementation(async (path) => {
      if (path === '/api/profile') {
        profileRevision += 1;
        return { revision: profileRevision, profile: { fullName: 'Ada' } };
      }
      resumeRevision += 1;
      return { revision: resumeRevision, name: 'My resume', settings: { templateId: 'classic' } };
    });
    useEditorStore.setState({
      user: { id: 'usr_1', email: 'ada@example.com', mustChangePassword: false },
      dirty: true,
      editGeneration: 1,
      saveStatus: 'idle',
      profileRevision: 1,
      profile: { fullName: 'Ada' },
      resume: { id: 'res_1', name: 'My resume', revision: 1, settings: { templateId: 'classic' } },
    });
  });

  it('writes the profile and the resume once, then stops', async () => {
    await saveNow();
    await saveNow();

    const paths = api.mock.calls.map((call) => call[0]);
    expect(paths).toEqual(['/api/profile', '/api/resumes/res_1']);
    expect(useEditorStore.getState()).toMatchObject({ dirty: false, saveStatus: 'saved', profileRevision: 2 });
  });
});
