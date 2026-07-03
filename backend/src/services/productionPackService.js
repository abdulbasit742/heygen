import { buildAvatarJob, getAvatarById } from './avatarService.js';
import { createSceneAssetJobs } from './sceneAssetService.js';

const DEFAULT_AVATAR_ID = 'studio_presenter';
const DEFAULT_VOICE_ID = 'calm_male';

function resolveAvatarId(avatarId) {
  return getAvatarById(avatarId) ? avatarId : DEFAULT_AVATAR_ID;
}

function buildStyle(input = {}) {
  return [
    input.template?.name,
    input.niche,
    input.tone,
    input.platform,
    'vertical avatar video'
  ].filter(Boolean).join(', ');
}

function brandRenderSummary(brandKit = {}) {
  if (!brandKit.id && !brandKit.name) return null;
  return {
    id: brandKit.id,
    name: brandKit.name,
    primaryColor: brandKit.primaryColor,
    accentColor: brandKit.accentColor,
    watermarkEnabled: Boolean(brandKit.watermark?.enabled)
  };
}

function updateChecklist(checklist, id, done) {
  return checklist.map(item => item.id === id ? { ...item, done } : item);
}

export function buildProductionPack({ input = {}, scriptResult, brandKit, voiceover }) {
  const avatarId = resolveAvatarId(input.avatarId || input.avatar || DEFAULT_AVATAR_ID);
  const voiceId = input.voiceId || input.voice || DEFAULT_VOICE_ID;
  const avatarJob = buildAvatarJob({
    avatarId,
    script: scriptResult.script,
    voice: voiceId,
    resolution: '1080x1920'
  });
  const visualAssets = createSceneAssetJobs({
    scenes: scriptResult.scenes,
    style: buildStyle(input)
  });

  return {
    status: 'assets_ready',
    avatarJob,
    visualAssets,
    voiceover: voiceover || {
      provider: 'mock_tts_manifest',
      voiceId: avatarJob.voice,
      language: input.language || 'English',
      estimatedDurationSeconds: scriptResult.totalDurationSeconds,
      scriptPreview: scriptResult.script.slice(0, 240)
    },
    renderPlan: {
      aspectRatio: '9:16',
      resolution: '1080x1920',
      subtitles: true,
      brand: brandRenderSummary(brandKit),
      sceneCount: scriptResult.scenes.length,
      targetPlatform: input.platform || 'instagram_reels'
    },
    checklist: [
      { id: 'script', label: 'Script generated', done: true },
      { id: 'avatar', label: 'Avatar job prepared', done: true },
      { id: 'voiceover', label: voiceover?.audioUrl ? 'Voiceover audio prepared' : 'Voiceover manifest prepared', done: Boolean(voiceover?.audioUrl) },
      { id: 'visuals', label: 'Scene asset manifests prepared', done: visualAssets.length > 0 },
      { id: 'export', label: 'MP4 export rendered', done: false }
    ],
    createdAt: new Date().toISOString()
  };
}

export function finalizeProductionPack(pack, exportResult, exportMetadata) {
  return {
    ...pack,
    status: 'export_ready',
    export: {
      id: exportResult.id,
      url: exportResult.url,
      subtitlesUrl: exportResult.subtitles,
      metadata: exportMetadata
    },
    checklist: updateChecklist(pack.checklist || [], 'export', true),
    updatedAt: new Date().toISOString()
  };
}
