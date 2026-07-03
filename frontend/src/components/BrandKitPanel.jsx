import React, { useEffect, useState } from 'react';
import { getBrandKit, saveBrandKit } from '../api.js';

const DEFAULT_FORM = {
  name: 'Creator Default Brand',
  logoUrl: '',
  primaryColor: '#7c3aed',
  secondaryColor: '#22c55e',
  accentColor: '#f97316',
  fontFamily: 'Inter',
  subtitleTextColor: '#ffffff',
  subtitleFontSize: 54,
  watermarkText: 'AI Avatar Studio',
  watermarkEnabled: true
};

export default function BrandKitPanel({ onApply }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getBrandKit()
      .then(brandKit => setForm({
        name: brandKit.name,
        logoUrl: brandKit.logoUrl || '',
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor,
        fontFamily: brandKit.fontFamily,
        subtitleTextColor: brandKit.subtitleStyle?.textColor || '#ffffff',
        subtitleFontSize: brandKit.subtitleStyle?.fontSize || 54,
        watermarkText: brandKit.watermark?.text || 'AI Avatar Studio',
        watermarkEnabled: Boolean(brandKit.watermark?.enabled)
      }))
      .catch(() => setMessage('Brand kit load nahi ho saka.'));
  }, []);

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const brandKit = await saveBrandKit({
        name: form.name,
        logoUrl: form.logoUrl,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: form.accentColor,
        fontFamily: form.fontFamily,
        subtitleStyle: {
          textColor: form.subtitleTextColor,
          fontSize: Number(form.subtitleFontSize) || 54,
          position: 'bottom'
        },
        watermark: {
          enabled: form.watermarkEnabled,
          text: form.watermarkText,
          position: 'top-right'
        }
      });
      onApply?.(brandKit);
      setMessage('Brand kit saved.');
    } catch {
      setMessage('Brand kit save nahi ho saka.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2>Brand Kit</h2>
      <p className="muted">Logo, colors, fonts aur watermark set karo taake har exported video same brand look rakhe.</p>

      <form onSubmit={submit} className="brandForm">
        <label>Brand Name</label>
        <input value={form.name} onChange={event => update('name', event.target.value)} />

        <label>Logo URL</label>
        <input value={form.logoUrl} onChange={event => update('logoUrl', event.target.value)} placeholder="https://example.com/logo.png" />

        <div className="colorRow">
          <label>Primary <input type="color" value={form.primaryColor} onChange={event => update('primaryColor', event.target.value)} /></label>
          <label>Secondary <input type="color" value={form.secondaryColor} onChange={event => update('secondaryColor', event.target.value)} /></label>
          <label>Accent <input type="color" value={form.accentColor} onChange={event => update('accentColor', event.target.value)} /></label>
        </div>

        <label>Font Family</label>
        <select value={form.fontFamily} onChange={event => update('fontFamily', event.target.value)}>
          <option>Inter</option>
          <option>Poppins</option>
          <option>Montserrat</option>
          <option>Arial</option>
        </select>

        <div className="row">
          <div>
            <label>Subtitle Color</label>
            <input type="color" value={form.subtitleTextColor} onChange={event => update('subtitleTextColor', event.target.value)} />
          </div>
          <div>
            <label>Subtitle Size</label>
            <input type="number" min="24" max="82" value={form.subtitleFontSize} onChange={event => update('subtitleFontSize', Number(event.target.value))} />
          </div>
        </div>

        <label>Watermark Text</label>
        <input value={form.watermarkText} onChange={event => update('watermarkText', event.target.value)} />

        <label className="inlineCheck">
          <input type="checkbox" checked={form.watermarkEnabled} onChange={event => update('watermarkEnabled', event.target.checked)} />
          Enable watermark
        </label>

        <button disabled={saving}>{saving ? 'Saving...' : 'Save Brand Kit'}</button>
        {message && <p className="muted">{message}</p>}
      </form>
    </section>
  );
}
