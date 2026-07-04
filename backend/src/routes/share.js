import { Router } from 'express';
import { findProjectByShareToken, publicSharePayload } from '../services/shareService.js';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderSharePage(payload) {
  const thumbnail = payload.visualAssets?.[0]?.imageUrl || '';
  const hashtagText = (payload.hashtags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
  const sceneItems = (payload.scenes || []).map(scene => (
    `<li><strong>Scene ${escapeHtml(scene.order)}</strong><p>${escapeHtml(scene.subtitle)}</p></li>`
  )).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(payload.title)} - Shared Export</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#0c0c11;color:#f8fafc;font-family:Inter,Arial,sans-serif}.page{max-width:980px;margin:auto;padding:24px}.hero{display:grid;gap:18px}.eyebrow{color:#93c5fd;text-transform:uppercase;font-weight:800;letter-spacing:.12em}.layout{display:grid;grid-template-columns:1fr .62fr;gap:20px}.panel{border:1px solid #26324a;background:#111827;border-radius:18px;padding:18px}.video{width:100%;border-radius:16px;background:#020617;border:1px solid #334155}.thumb{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:14px;border:1px solid #334155;background:#020617}.chips{display:flex;flex-wrap:wrap;gap:8px}.chips span{border-radius:999px;background:#0f172a;color:#bfdbfe;padding:6px 10px;font-size:13px}li{margin-bottom:12px}p{color:#cbd5e1;line-height:1.6}@media(max-width:760px){.layout{grid-template-columns:1fr}.page{padding:16px}}
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div>
        <p class="eyebrow">Shared AI Avatar Export</p>
        <h1>${escapeHtml(payload.title)}</h1>
        <p>${escapeHtml(payload.caption)}</p>
        <div class="chips">${hashtagText}</div>
      </div>
      <div class="layout">
        <section class="panel">
          <video class="video" src="${escapeHtml(payload.outputUrl)}" controls playsinline poster="${escapeHtml(thumbnail)}"></video>
          <p>${escapeHtml(payload.exportMetadata.resolution)} ${escapeHtml(payload.exportMetadata.format || 'mp4')} · ${escapeHtml(payload.exportMetadata.durationSeconds || '')}s</p>
        </section>
        <aside class="panel">
          ${thumbnail ? `<img class="thumb" src="${escapeHtml(thumbnail)}" alt="Storyboard thumbnail" />` : ''}
          <h2>Scenes</h2>
          <ol>${sceneItems}</ol>
        </aside>
      </div>
    </section>
  </main>
</body>
</html>`;
}

export const shareApiRoutes = Router();
export const sharePageRoutes = Router();

shareApiRoutes.get('/:token', (req, res) => {
  const project = findProjectByShareToken(req.params.token, { countView: true });
  if (!project) return res.status(404).json({ error: 'Shared export not found or expired.' });
  return res.json({ share: publicSharePayload(project) });
});

sharePageRoutes.get('/:token', (req, res) => {
  const project = findProjectByShareToken(req.params.token, { countView: true });
  if (!project) return res.status(404).type('html').send('<h1>Shared export not found or expired.</h1>');
  return res.type('html').send(renderSharePage(publicSharePayload(project)));
});
