import { useState } from 'react';
import { api } from '../api.js';

const defaultForm = {
  platform: 'instagram_reels',
  topic: 'AI generated faceless videos',
  niche: 'online earning',
  tone: 'practical'
};

export default function CaptionStudio() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function optimize() {
    setLoading(true);
    try {
      const { data } = await api.post('/captions/optimize', form);
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card captionStudio">
      <h2>Caption Studio</h2>
      <p>Hooks, CTA aur hashtags platform ke hisaab se optimize karo.</p>

      <label>Platform</label>
      <select value={form.platform} onChange={event => update('platform', event.target.value)}>
        <option value="instagram_reels">Instagram Reels</option>
        <option value="tiktok">TikTok</option>
        <option value="youtube_shorts">YouTube Shorts</option>
        <option value="facebook_reels">Facebook Reels</option>
      </select>

      <label>Topic</label>
      <input value={form.topic} onChange={event => update('topic', event.target.value)} />

      <label>Niche</label>
      <input value={form.niche} onChange={event => update('niche', event.target.value)} />

      <button type="button" onClick={optimize} disabled={loading}>
        {loading ? 'Optimizing...' : 'Generate Caption'}
      </button>

      {result && (
        <div className="captionResult">
          <strong>Score: {result.score}/100</strong>
          <pre>{result.caption}</pre>
          <div className="tagWrap">
            {result.hashtags.map(tag => <span className="pill" key={tag}>{tag}</span>)}
          </div>
        </div>
      )}
    </section>
  );
}
