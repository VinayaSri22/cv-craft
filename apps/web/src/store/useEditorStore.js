import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as actions from './actions.js';
import { createEmptyState, createSampleState } from './initialState.js';
import { scheduleSave } from './sync.js';

/**
 * Wraps each action so components call `actions.addItem(sectionId)` and the
 * store passes the Immer draft as the first argument. Every edit is marked
 * dirty and autosaved.
 */
function bindActions(set) {
  const bound = {};
  for (const [name, fn] of Object.entries(actions)) {
    bound[name] = (...args) => {
      let result;
      set((state) => {
        result = fn(state, ...args);
        state.dirty = true;
      });
      scheduleSave();
      return result;
    };
  }
  return bound;
}

function replaceDocument(set, next) {
  set((state) => {
    state.profile = next.profile;
    state.resume.name = next.resume.name;
    state.resume.settings = next.resume.settings;
    state.dirty = true;
  });
  scheduleSave();
}

export const useEditorStore = create(
  immer((set) => ({
    ...createEmptyState(),
    resume: { id: null, revision: 0, ...createEmptyState().resume },
    authStatus: 'unknown',
    user: null,
    profileId: null,
    profileRevision: 0,
    dirty: false,
    saveStatus: 'idle',
    saveError: null,
    actions: {
      ...bindActions(set),
      loadSample: () => replaceDocument(set, createSampleState()),
      reset: () => replaceDocument(set, createEmptyState()),
      /** Clears the open document without saving. Used when signing out. */
      resetLocal: () => {
        const empty = createEmptyState();
        set((state) => {
          state.profile = empty.profile;
          state.profileId = null;
          state.profileRevision = 0;
          state.resume = { id: null, name: empty.resume.name, settings: empty.resume.settings, revision: 0 };
          state.dirty = false;
          state.saveStatus = 'idle';
          state.saveError = null;
        });
      },
    },
  })),
);

export const useActions = () => useEditorStore((state) => state.actions);
