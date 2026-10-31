import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as actions from './actions.js';
import { createEmptyState, createSampleState, restoreState } from './initialState.js';

const STORAGE_KEY = 'cv-craft:editor';

/**
 * Wraps each action so components call `actions.addItem(sectionId)` and the
 * store passes the Immer draft as the first argument.
 */
function bindActions(set) {
  const bound = {};
  for (const [name, fn] of Object.entries(actions)) {
    bound[name] = (...args) => {
      let result;
      set((state) => {
        result = fn(state, ...args);
      });
      return result;
    };
  }
  return bound;
}

/**
 * Editor state is kept in localStorage until the API exists (milestone M2),
 * so a page refresh does not lose work.
 */
export const useEditorStore = create(
  persist(
    immer((set) => ({
      ...createEmptyState(),
      actions: {
        ...bindActions(set),
        loadSample: () => set(createSampleState()),
        reset: () => set(createEmptyState()),
      },
    })),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ profile, resume }) => ({ profile, resume }),
      merge: (persisted, current) =>
        persisted ? { ...current, ...restoreState(persisted) } : current,
    },
  ),
);

export const useActions = () => useEditorStore((state) => state.actions);
