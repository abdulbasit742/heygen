import { Router } from 'express';
import { createMemoryRateLimiter } from '../security/sessionPolicy.mjs';
import { addShareReview, findProjectByShareToken, publicSharePayload } from '../services/shareService.js';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(value) {
  return JSON.stringify(String(value || '')).replace(/</g, '\\u003c');
}

function renderSharePage(payload) {
  const thumbnail = payload.visualAssets?.[0]?.imageUrl || '';
  const hashtagText = (payload.hashtags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  const sceneItems = (payload.scenes || []).map((scene) => (
    `<li><strong>Scene ${escapeHtml(scene.order)}</strong><p>${escapeHtml(scene.subtitle)}</p></li>`
  )).join('');
  const review = payload.review || {};
  const latestFeedback = (review.feedback || []).map((item) => (
    `<li><strong>${escapeHtml(item.reviewerName)}</strong><p>${escapeHtml(item.decision.replace(/_/g, ' '))}: ${escapeHtml(item.message || 'Approved')}</p></li>`
  )).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <title>${escapeHtml(payload.title)} - Shared Export</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#0c0c11;color:#f8fafc;font-family:Inter,Arial,sans-serif}.page{max-width:980px;margin:auto;padding:24px}.hero{display:grid;gap:18px}.eyebrow{color:#93c5fd;text-transform:uppercase;font-weight:800;letter-spacing:.12em}.layout{display:grid;grid-template-columns:1fr .62fr;gap:20px}.panel{border:1px solid #26324a;background:#111827;border-radius:18px;padding:18px}.video{width:100%;border-radius:16px;background:#020617;border:1px solid #334155}.thumb{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:14px;border:1px solid #334155;background:#020617}.chips,.actions{display:flex;flex-wrap:wrap;gap:8px}.chips span,.pill{border-radius:999px;background:#0f172a;color:#bfdbfe;padding:6px 10px;font-size:13px}li{margin-bottom:12px}p{color:#cbd5e1;line-height:1.6}label{display:block;margin:12px 0 6px;font-weight:800}input,textarea,select{width:100%;border:1px solid #334155;background:#0f172a;color:#f8fafc;border-radius:12px;padding:11px}textarea{min-height:96px;resize:vertical}button{border:0;border-radius:12px;background:#f8fafc;color:#111827;font-weight:900;padding:12px 14px;cursor:pointer}.status{color:#bbf7d0}.error{color:#fecaca}@media(max-width:760px){.layout{grid-template-columns:1fr}.page{padding:16px}}
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
      <section class="panel">
        <p class="pill">Review status: ${escapeHtml((review.status || 'not_started').replace(/_/g, ' '))}</p>
        <h2>Client Review</h2>
        <p>This capability link gives access to this export and review form until it expires or is revoked. Do not forward it.</p>
        <form id="reviewForm">
          <label for="reviewerName">Your Name</label>
          <input id="reviewerName" name="reviewerName" maxlength="80" autocomplete="name" placeholder="Client name" />
          <label for="decision">Decision</label>
          <select id="decision" name="decision">
            <option value="feedback">Leave Feedback</option>
            <option value="changes_requested">Request Changes</option>
            <option value="approved">Approve Export</option>
          </select>
          <label for="message">Feedback</label>
          <textarea id="message" name="message" maxlength="1200" placeholder="Write changes, approval note, or client comments"></textarea>
          <button type="submit">Send Review</button>
          <p id="reviewMessage" role="status"></p>
        </form>
        ${latestFeedback ? `<h3>Recent Feedback</h3><ol>${latestFeedback}</ol>` : ''}
      </section>
    </section>
  </main>
  <script>
    const form = document.getElementById('reviewForm');
    const output = document.getElementById('reviewMessage');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      output.className = 'status';
      output.textContent = 'Sending review...';
      const formData = new FormData(form);
      const reviewPayload = Object.fromEntries(formData.entries());
      try {
        const response = await fetch('/api/share/' + ${escapeJs(payload.share?.token)} + '/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewPayload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Review failed.');
        output.textContent = 'Review saved. Thank you.';
        form.reset();
      } catch (error) {
        output.className = 'error';
        output.textContent = error.message || 'Review failed.';
      }
    });
  </script>
</body>
</html>`;
}

export const shareApiRoutes = Router();
export const sharePageRoutes = Router();
const reviewLimiter = createMemoryRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  key: (req) => `${req.ip || 'unknown'}:${String(req.params.token || '').slice(0, 64)}`,
});

shareApiRoutes.get('/:token', (req, res) => {
  const project = findProjectByShareToken(req.params.token, { countView: true });
  if (!project) return res.status(404).json({ error: 'Shared export not found or expired.' });
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ share: publicSharePayload(project) });
});

shareApiRoutes.post('/:token/review', reviewLimiter, (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json(addShareReview(req.params.token, req.body));
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Review save failed.' });
  }
});

sharePageRoutes.get('/:token', (req, res) => {
  const project = findProjectByShareToken(req.params.token, { countView: true });
  if (!project) return res.status(404).type('html').send('<h1>Shared export not found or expired.</h1>');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res.type('html').send(renderSharePage(publicSharePayload(project)));
});
