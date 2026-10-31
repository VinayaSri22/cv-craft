import { useActions, useEditorStore } from '../store/useEditorStore.js';
import { TextArea, TextInput } from './fields.jsx';
import { Panel } from './Panel.jsx';

export function BasicsPanel() {
  const basics = useEditorStore((s) => s.profile.basics);
  const summary = useEditorStore((s) => s.profile.summary);
  const { updateBasics, updateSummary, addLink, updateLink, removeLink } = useActions();
  const field = (key, label, props = {}) => (
    <TextInput label={label} value={basics[key]} onChange={(v) => updateBasics({ [key]: v })} {...props} />
  );

  return (
    <Panel title="Personal details" defaultOpen>
      <div className="field-grid">
        {field('fullName', 'Full name', { placeholder: 'Ananya Rao' })}
        {field('headline', 'Headline', { placeholder: 'Senior Backend Engineer' })}
        {field('email', 'Email', { type: 'email' })}
        {field('phone', 'Phone', { type: 'tel' })}
        {field('location', 'Location', { wide: true })}
      </div>

      <h4 className="subheading">Links</h4>
      {basics.links.map((link) => (
        <div key={link.id} className="link-row">
          <TextInput
            label="Label"
            value={link.label}
            placeholder="GitHub"
            onChange={(v) => updateLink(link.id, { label: v })}
          />
          <TextInput
            label="URL"
            value={link.url}
            placeholder="https://github.com/you"
            onChange={(v) => updateLink(link.id, { url: v })}
          />
          <button type="button" className="icon-button" title="Remove link" onClick={() => removeLink(link.id)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="text-button" onClick={addLink}>
        + Add link
      </button>

      <h4 className="subheading">Summary</h4>
      <TextArea
        label="Professional summary"
        rows={4}
        value={summary}
        onChange={updateSummary}
        placeholder="Two or three sentences about your experience and focus."
      />
    </Panel>
  );
}
