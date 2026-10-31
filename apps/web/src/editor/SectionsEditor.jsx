import { useMemo, useState } from 'react';
import { SECTION_TYPES, effectiveSectionOrder } from '@cv-craft/shared';
import { useActions, useEditorStore } from '../store/useEditorStore.js';
import { useConfirm } from '../confirm/ConfirmDialog.jsx';
import { ItemFields } from './ItemFields.jsx';
import { Panel } from './Panel.jsx';

function IconButton({ title, onClick, disabled, children }) {
  return (
    <button
      type="button"
      className="icon-button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function itemLabel(type, item) {
  const spec = SECTION_TYPES[type];
  const primary = item[spec.primaryField];
  return primary?.trim() || `Untitled ${spec.label.toLowerCase()} entry`;
}

function ItemCard({ section, item, index, hidden }) {
  const { updateItem, removeItem, moveItem, toggleHidden } = useActions();
  return (
    <Panel
      title={itemLabel(section.type, item)}
      muted={hidden}
      defaultOpen={!item[SECTION_TYPES[section.type].primaryField]}
      actions={
        <>
          <IconButton title="Move up" disabled={index === 0} onClick={() => moveItem(section.id, item.id, -1)}>
            ↑
          </IconButton>
          <IconButton
            title="Move down"
            disabled={index === section.items.length - 1}
            onClick={() => moveItem(section.id, item.id, 1)}
          >
            ↓
          </IconButton>
          <IconButton
            title={hidden ? 'Show in resume' : 'Hide in resume'}
            onClick={() => toggleHidden('item', item.id)}
          >
            {hidden ? '◌' : '●'}
          </IconButton>
          <IconButton title="Delete entry" onClick={() => removeItem(section.id, item.id)}>
            ✕
          </IconButton>
        </>
      }
    >
      <ItemFields type={section.type} item={item} onChange={(patch) => updateItem(section.id, item.id, patch)} />
    </Panel>
  );
}

function SectionCard({ section, index, count, hidden, hiddenItems }) {
  const { renameSection, removeSection, moveSection, toggleHidden, addItem } = useActions();
  const confirm = useConfirm();
  const spec = SECTION_TYPES[section.type];

  const onDelete = async () => {
    const entries = section.items.length;
    const accepted =
      entries === 0 ||
      (await confirm({
        title: 'Delete section',
        message: `Delete “${section.title || spec.label}” and its ${entries} ${entries === 1 ? 'entry' : 'entries'}?`,
        confirmLabel: 'Delete',
        danger: true,
      }));
    if (accepted) removeSection(section.id);
  };

  return (
    <Panel
      title={
        <>
          {section.title || spec.label}
          <span className="badge">{section.items.length}</span>
        </>
      }
      muted={hidden}
      actions={
        <>
          <IconButton title="Move section up" disabled={index === 0} onClick={() => moveSection(section.id, -1)}>
            ↑
          </IconButton>
          <IconButton
            title="Move section down"
            disabled={index === count - 1}
            onClick={() => moveSection(section.id, 1)}
          >
            ↓
          </IconButton>
          <IconButton
            title={hidden ? 'Show section in resume' : 'Hide section in resume'}
            onClick={() => toggleHidden('section', section.id)}
          >
            {hidden ? '◌' : '●'}
          </IconButton>
          <IconButton title="Delete section" onClick={onDelete}>
            ✕
          </IconButton>
        </>
      }
    >
      <label className="inline-field">
        <span>Section title</span>
        <input value={section.title} onChange={(e) => renameSection(section.id, e.target.value)} />
      </label>

      <div className="item-list">
        {section.items.map((item, i) => (
          <ItemCard
            key={item.id}
            section={section}
            item={item}
            index={i}
            hidden={hiddenItems.has(item.id)}
          />
        ))}
      </div>

      <button type="button" className="text-button" onClick={() => addItem(section.id)}>
        + Add {spec.type === 'custom' ? 'entry' : spec.label.toLowerCase().replace(/s$/, '')}
      </button>
    </Panel>
  );
}

function AddSection() {
  const { addSection } = useActions();
  const [type, setType] = useState('custom');
  const [title, setTitle] = useState('');

  return (
    <form
      className="add-section"
      onSubmit={(e) => {
        e.preventDefault();
        addSection(type, title);
        setTitle('');
      }}
    >
      <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Section type">
        {Object.values(SECTION_TYPES).map((spec) => (
          <option key={spec.type} value={spec.type}>
            {spec.label}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={type === 'custom' ? 'Title, e.g. Volunteering' : SECTION_TYPES[type].defaultTitle}
        aria-label="Section title"
      />
      <button type="submit" className="button">
        Add section
      </button>
    </form>
  );
}

export function SectionsEditor() {
  const sections = useEditorStore((s) => s.profile.sections);
  const settings = useEditorStore((s) => s.resume.settings);

  const ordered = useMemo(() => {
    const byId = new Map(sections.map((s) => [s.id, s]));
    return effectiveSectionOrder(sections, settings.sectionOrder).map((id) => byId.get(id));
  }, [sections, settings.sectionOrder]);
  const hiddenSections = useMemo(() => new Set(settings.hiddenSections), [settings.hiddenSections]);
  const hiddenItems = useMemo(() => new Set(settings.hiddenItems), [settings.hiddenItems]);

  return (
    <>
      {ordered.map((section, i) => (
        <SectionCard
          key={section.id}
          section={section}
          index={i}
          count={ordered.length}
          hidden={hiddenSections.has(section.id)}
          hiddenItems={hiddenItems}
        />
      ))}
      <AddSection />
    </>
  );
}
