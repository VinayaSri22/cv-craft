import { produce } from 'immer';
import { describe, expect, it } from 'vitest';
import { compose, effectiveSectionOrder, parseProfile } from '@cv-craft/shared';
import * as actions from './actions.js';
import { createSampleState, restoreState } from './initialState.js';

/** Applies one action to a state, the same way the store does. */
const apply = (state, name, ...args) => {
  let result;
  const next = produce(state, (draft) => {
    result = actions[name](draft, ...args);
  });
  return { state: next, result };
};

const order = (state) =>
  effectiveSectionOrder(state.profile.sections, state.resume.settings.sectionOrder);

describe('editor actions', () => {
  it('adds a custom section at the end of the resume and keeps the profile valid', () => {
    const { state, result: sectionId } = apply(createSampleState(), 'addSection', 'custom', 'Languages');
    const section = state.profile.sections.find((s) => s.id === sectionId);
    expect(section).toMatchObject({ type: 'custom', title: 'Languages' });
    expect(section.items).toHaveLength(1);
    expect(order(state).at(-1)).toBe(sectionId);
    expect(parseProfile(state.profile).ok).toBe(true);
  });

  it('adds, edits, and moves items; edits show up in the composed model', () => {
    let { state, result: itemId } = apply(createSampleState(), 'addItem', 'sec_education');
    ({ state } = apply(state, 'updateItem', 'sec_education', itemId, { institution: 'IIT Madras' }));
    ({ state } = apply(state, 'moveItem', 'sec_education', itemId, -1));

    const education = compose(state.profile, state.resume.settings).sections.find(
      (s) => s.id === 'sec_education',
    );
    expect(education.items.map((i) => i.id)).toEqual([itemId, 'edu_nitw']);
    expect(education.items[0].institution).toBe('IIT Madras');
  });

  it('ignores moves past either end', () => {
    const before = createSampleState();
    const { state } = apply(before, 'moveItem', 'sec_experience', 'exp_finpay', -1);
    expect(state.profile.sections[0].items.map((i) => i.id)).toEqual(['exp_finpay', 'exp_shopline']);
  });

  it('reorders sections in the resume without touching profile order', () => {
    const start = createSampleState();
    const { state } = apply(start, 'moveSection', order(start)[1], -1);
    expect(order(state)[0]).toBe(order(start)[1]);
    expect(state.profile.sections).toBe(start.profile.sections);
  });

  it('cleans resume references when a section is removed', () => {
    let { state } = apply(createSampleState(), 'toggleHidden', 'item', 'exp_shopline');
    ({ state } = apply(state, 'toggleHidden', 'section', 'sec_experience'));
    ({ state } = apply(state, 'removeSection', 'sec_experience'));

    expect(state.profile.sections.map((s) => s.id)).not.toContain('sec_experience');
    expect(state.resume.settings.sectionOrder).not.toContain('sec_experience');
    expect(state.resume.settings.hiddenSections).toEqual([]);
    expect(state.resume.settings.hiddenItems).toEqual([]);
  });

  it('toggles visibility on and off', () => {
    let { state } = apply(createSampleState(), 'toggleHidden', 'item', 'exp_shopline');
    expect(state.resume.settings.hiddenItems).toEqual(['exp_shopline']);
    ({ state } = apply(state, 'toggleHidden', 'item', 'exp_shopline'));
    expect(state.resume.settings.hiddenItems).toEqual([]);
  });

  it('falls back to the default template for unknown template ids', () => {
    const { state } = apply(createSampleState(), 'setTemplate', 'nope');
    expect(state.resume.settings.templateId).toBe('classic');
  });
});

describe('restoreState', () => {
  it('restores valid persisted state', () => {
    const saved = createSampleState();
    expect(restoreState(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
  });

  it('replaces corrupt persisted state with a fresh one', () => {
    const restored = restoreState({ profile: { schemaVersion: 1, sections: 'broken' } });
    expect(parseProfile(restored.profile).ok).toBe(true);
    expect(restored.resume.settings.templateId).toBe('classic');
  });
});
