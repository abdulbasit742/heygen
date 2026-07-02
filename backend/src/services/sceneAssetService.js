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

export function buildSceneVisualPrompt(scene, style = 'cinematic vertical reel') {
  const narration = scene?.narration || scene?.subtitle || 'creator video scene';
  return `${style}, 9:16, high quality, social media video frame, ${narration}`;
}

export function createSceneAssetJobs({ scenes = [], style = 'cinematic vertical reel' }) {
  ensureAssetDir();

  return scenes.map((scene, index) => {
    const id = crypto.randomUUID();
    const fileName = `${String(index + 1).padStart(2, '0')}_${slug(scene.subtitle || scene.narration)}.json`;
    const filePath = path.join(ASSET_DIR, fileName);

    const asset = {
      id,
      sceneOrder: scene.order || index + 1,
      type: 'mock_image_asset',
      status: 'completed',
      prompt: scene.visualPrompt || buildSceneVisualPrompt(scene, style),
      assetUrl: `/generated-assets/${fileName}`,
      width: 1080,
      height: 1920,
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(asset, null, 2));
    return asset;
  });
}
