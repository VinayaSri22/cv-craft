import { useState } from 'react';
import { useActions, useEditorStore } from '../store/useEditorStore.js';
import { removePhoto, uploadPhoto } from '../store/photo.js';
import { TextArea, TextInput } from './fields.jsx';
import { Panel } from './Panel.jsx';

export function BasicsPanel() {
  const basics = useEditorStore((s) => s.profile.basics);
  const summary = useEditorStore((s) => s.profile.summary);
  const { updateBasics, updateSummary, addLink, updateLink, removeLink } = useActions();
  const [photoError, setPhotoError] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const onPhoto = async (file) => {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      await uploadPhoto(file);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Could not upload the photo.');
    } finally {
      setPhotoBusy(false);
    }
  };
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

      <h4 className="subheading">Photo</h4>
      <div className="photo-row">
        {basics.photo ? (
          <img className="photo-row__preview" src={`/api/photos/${basics.photo.id}`} alt="" />
        ) : (
          <div className="photo-row__empty">No photo</div>
        )}
        <div className="photo-row__actions">
          <label className="button button--ghost">
            {photoBusy ? 'Uploading…' : basics.photo ? 'Replace photo' : 'Upload photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              disabled={photoBusy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                onPhoto(file);
              }}
            />
          </label>
          {basics.photo ? (
            <button
              type="button"
              className="text-button"
              disabled={photoBusy}
              onClick={async () => {
                setPhotoBusy(true);
                setPhotoError(null);
                try {
                  await removePhoto();
                } catch (error) {
                  setPhotoError(error instanceof Error ? error.message : 'Could not remove the photo.');
                } finally {
                  setPhotoBusy(false);
                }
              }}
            >
              Remove
            </button>
          ) : null}
          <p className="hint">JPEG, PNG, or WebP. Turn Photo on in the preview toolbar to show it on this resume.</p>
          {photoError ? <p className="field-error">{photoError}</p> : null}
        </div>
      </div>

      <h4 className="subheading">Links</h4>
      {basics.links.map((link) => (
        <div key={link.id} className="link-row">
          <TextInput
            label="Link text"
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
