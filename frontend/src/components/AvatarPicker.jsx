import React, { useEffect, useState } from 'react';
import { listAvatars } from '../api.js';

export default function AvatarPicker({ value, language, onChange }) {
  const [avatars, setAvatars] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const items = await listAvatars(language);
        setAvatars(items);
        if (!items.find(item => item.id === value) && items[0]) {
          onChange(items[0].id);
        }
      } catch {
        setError('Avatar presets load nahi ho sake.');
      }
    }

    load();
  }, [language]);

  return (
    <section className="avatarPicker">
      <label>Avatar Preset</label>
      <div className="avatarGrid">
        {avatars.map(avatar => (
          <button
            className={`avatarCard ${value === avatar.id ? 'selected' : ''}`}
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.id)}
          >
            <strong>{avatar.name}</strong>
            <span>{avatar.type.replace('_', ' ')}</span>
            <small>{avatar.style}</small>
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
