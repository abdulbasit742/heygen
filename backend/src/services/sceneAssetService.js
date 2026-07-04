import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ASSET_DIR = path.join(process.cwd(), 'generated-assets');

function ensureAssetDir() {
  if (!fs.existsSync(ASSET_DIR)) fs.mkdirSync(ASSET_DIR, { recursive: true });
}

function slug(value) {
  return String(value || 'scene')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48) || 'scene';
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(value, maxChars = 28) {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 7);
}

function colorForIndex(index) {
  const palettes = [
    ['#111827', '#2563eb', '#facc15'],
    ['#0f172a', '#059669', '#f97316'],
    ['#18181b', '#7c3aed', '#22c55e'],
    ['#0c0a09', '#dc2626', '#38bdf8'],
    ['#172554', '#db2777', '#f8fafc']
  ];
  return palettes[index % palettes.length];
}

function buildSceneSvg({ scene, index, prompt }) {
  const [background, primary, accent] = colorForIndex(index);
  const title = `Scene ${scene.order || index + 1}`;
  const lines = wrapText(scene.subtitle || scene.narration || prompt, 29);
  const textLines = lines.map((line, lineIndex) => (
    `<text x="84" y="${710 + lineIndex * 72}" fill="#f8fafc" font-size="46" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeXml(line)}</text>`
  )).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="${background}"/>
  <circle cx="880" cy="220" r="260" fill="${primary}" opacity="0.35"/>
  <circle cx="160" cy="1640" r="320" fill="${accent}" opacity="0.20"/>
  <rect x="58" y="90" width="964" height="1740" rx="54" fill="none" stroke="${accent}" stroke-width="10" opacity="0.82"/>
  <text x="84" y="200" fill="${accent}" font-size="42" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="6">${escapeXml(title.toUpperCase())}</text>
  <text x="84" y="310" fill="#f8fafc" font-size="72" font-family="Inter, Arial, sans-serif" font-weight="900">${escapeXml(scene.durationSeconds || 5)}s Shot</text>
  <rect x="84" y="420" width="912" height="188" rx="34" fill="#020617" opacity="0.72"/>
  <text x="124" y="500" fill="#bfdbfe" font-size="34" font-family="Inter, Arial, sans-serif" font-weight="700">Visual Prompt</text>
  <text x="124" y="562" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif">${escapeXml(prompt.slice(0, 88))}</text>
  ${textLines}
  <rect x="84" y="1540" width="912" height="150" rx="34" fill="${primary}" opacity="0.86"/>
  <text x="124" y="1628" fill="#ffffff" font-size="38" font-family="Inter, Arial, sans-serif" font-weight="800">Avatar-ready storyboard frame</text>
  <text x="124" y="1682" fill="#dbeafe" font-size="28" font-family="Inter, Arial, sans-serif">Generated locally as a provider-safe scene visual.</text>
</svg>`;
}

export function buildSceneVisualPrompt(scene, style = 'cinematic vertical reel') {
  const narration = scene?.narration || scene?.subtitle || 'creator video scene';
  return `${style}, 9:16, high quality, social media video frame, ${narration}`;
}

export function createSceneAssetJobs({ scenes = [], style = 'cinematic vertical reel' }) {
  ensureAssetDir();

  return scenes.map((scene, index) => {
    const id = crypto.randomUUID();
    const baseName = `${String(index + 1).padStart(2, '0')}_${slug(scene.subtitle || scene.narration)}`;
    const manifestFileName = `${baseName}.json`;
    const imageFileName = `${baseName}.svg`;
    const manifestPath = path.join(ASSET_DIR, manifestFileName);
    const imagePath = path.join(ASSET_DIR, imageFileName);
    const prompt = scene.visualPrompt || buildSceneVisualPrompt(scene, style);

    const asset = {
      id,
      sceneOrder: scene.order || index + 1,
      type: 'storyboard_svg_asset',
      status: 'completed',
      prompt,
      assetUrl: `/generated-assets/${manifestFileName}`,
      imageUrl: `/generated-assets/${imageFileName}`,
      fileName: imageFileName,
      manifestFileName,
      width: 1080,
      height: 1920,
      durationSeconds: scene.durationSeconds || 5,
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(imagePath, buildSceneSvg({ scene, index, prompt }));
    fs.writeFileSync(manifestPath, JSON.stringify(asset, null, 2));
    return asset;
  });
}
