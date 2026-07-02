import React, { useEffect, useState } from 'react';
import { addMedia, listMedia } from '../api.js';

const DEFAULT_MEDIA = {
  name: 'My brand background',
  type: 'image/png',
  sizeBytes: 500000,
  category: 'background',
  url: '/generated-assets/my_brand_background.png'
};

export default function MediaLibrary({ onSelect }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(DEFAULT_MEDIA);
  const [error, setError] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const media = await listMedia();
    setItems(media);
  }

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      const media = await addMedia(form);
      setItems(current => [media, ...current]);
    } catch (err) {
      setError(err.response?.data?.error || 'Media add nahi ho saka.');
    }
  }

  return (
    <section className="card">
      <h2>Media Library</h2>
      <p className="muted">Backgrounds, B-roll, music, brand assets aur uploads yahan manage karo.</p>

      <form className="miniForm" onSubmit={submit}>
        <input value={form.name} onChange={event => updateField('name', event.target.value)} placeholder="Asset name" />
        <select value={form.type} onChange={event => updateField('type', event.target.value)}>
          <option value="image/png">PNG Image</option>
          <option value="image/jpeg">JPEG Image</option>
          <option value="image/webp">WebP Image</option>
          <option value="video/mp4">MP4 Video</option>
          <option value="audio/mpeg">MP3 Audio</option>
          <option value="audio/wav">WAV Audio</option>
        </select>
        <input type="number" value={form.sizeBytes} onChange={event => updateField('sizeBytes', Number(event.target.value))} />
        <button type="submit">Add Media Metadata</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="mediaGrid">
        {items.map(item => (
          <button className="mediaCard" type="button" key={item.id} onClick={() => onSelect?.(item)}>
            <strong>{item.name}</strong>
            <span>{item.category} · {item.type}</span>
            <small>{Math.round(item.sizeBytes / 1024)} KB</small>
          </button>
        ))}
      </div>
    </section>
  );
}
