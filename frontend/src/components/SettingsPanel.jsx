import React, { useEffect, useState } from 'react';
import { getProviderStatus, getSettings, resetSettings, updateSettings } from '../api.js';

export default function SettingsPanel() {
  const [form, setForm] = useState(null);
  const [providers, setProviders] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
    loadProviders();
  }, []);

  async function loadSettings() {
    const settings = await getSettings();
    setForm(settings);
  }

  async function loadProviders() {
    const result = await getProviderStatus();
    setProviders(result);
  }

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const saved = await updateSettings(form);
    setForm(saved);
    setMessage('Settings saved.');
  }

  async function reset() {
    const saved = await resetSettings();
    setForm(saved);
    setMessage('Settings reset to defaults.');
  }

  if (!form) return <section className="card"><h2>Settings</h2><p>Loading settings...</p></section>;

  return (
    <section className="card settingsPanel">
      <h2>App Settings</h2>
      <p className="muted">Rendering limits, provider mode, watermark aur safety settings manage karo.</p>

      <form className="settingsGrid" onSubmit={submit}>
        <div>
          <label>App Name</label>
          <input value={form.appName} onChange={event => update('appName', event.target.value)} />
        </div>

        <div>
          <label>Default Language</label>
          <select value={form.defaultLanguage} onChange={event => update('defaultLanguage', event.target.value)}>
            <option>English</option>
            <option>Urdu</option>
            <option>Hindi</option>
            <option>Arabic</option>
          </select>
        </div>

        <div>
          <label>Default Platform</label>
          <select value={form.defaultPlatform} onChange={event => update('defaultPlatform', event.target.value)}>
            <option value="instagram_reels">Instagram Reels</option>
            <option value="facebook_reels">Facebook Reels</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>

        <div>
          <label>Max Video Seconds</label>
          <input type="number" min="10" max="180" value={form.maxVideoSeconds} onChange={event => update('maxVideoSeconds', event.target.value)} />
        </div>

        <label className="toggleLine">
          <input type="checkbox" checked={form.watermarkEnabled} onChange={event => update('watermarkEnabled', event.target.checked)} />
          Watermark enabled on free exports
        </label>

        <label className="toggleLine">
          <input type="checkbox" checked={form.safetyMode} onChange={event => update('safetyMode', event.target.checked)} />
          Safety mode enabled
        </label>

        <div className="settingsActions">
          <button type="submit">Save Settings</button>
          <button type="button" className="ghostDark" onClick={reset}>Reset</button>
        </div>
      </form>

      {message && <p className="success">{message}</p>}

      <h3>Provider Status</h3>
      <div className="providerGrid">
        {Object.entries(providers).map(([key, provider]) => (
          <article className="providerCard" key={key}>
            <strong>{provider.name}</strong>
            <span>{provider.status}</span>
            <small>{provider.envKey}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
