import { Router } from 'express';
import { validateCreateProject } from '../middleware/validateProject.js';
import { createProject, deleteProject, getProject, listProjects, updateProject } from '../services/projectStore.js';
import { requireAuth } from '../middleware/auth.js';
import { canCreateProject, incrementExportUsage, incrementProjectUsage } from '../services/subscriptionService.js';
import { generateVideoScript } from '../services/aiScriptGenerator.js';
import { renderVideo } from '../services/renderService.js';
import { createJob, updateJob } from '../services/jobQueueService.js';
import { applyTemplate } from '../services/templateService.js';
import { optimizeCaption } from '../services/captionOptimizerService.js';
import { buildProductionPack, finalizeProductionPack } from '../services/productionPackService.js';
import { createScheduledPost } from '../services/schedulerService.js';
import { getBrandKit } from '../services/brandKitService.js';
import { generateVoiceover } from '../services/voiceoverService.js';
import { createProjectShare, reviewSummary, revokeProjectShare, shareSummary } from '../services/shareService.js';
import { createProjectBundle } from '../services/exportBundleService.js';

const router = Router();

router.use(requireAuth);

function ensureOwner(project, userId) {
  return project && project.userId === userId;
}

function exportPayload(project) {
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    outputUrl: project.outputUrl,
    subtitlesUrl: project.subtitlesUrl,
    exportId: project.exportId,
    metadata: project.exportMetadata || null,
    exportMetadata: project.exportMetadata || null,
    captionResult: project.captionResult || null,
    brandKit: project.brandKit || null,
    voiceover: project.voiceover || null,
    productionPack: project.productionPack || null,
    avatarJob: project.avatarJob || null,
    visualAssets: project.visualAssets || [],
    scheduledPostIds: project.scheduledPostIds || [],
    share: shareSummary(project),
    review: reviewSummary(project, { includePrivate: true }),
    scenes: project.scenes || [],
    completedAt: project.completedAt || null
  };
}

function defaultScheduleTargets(platform) {
  const platformMap = {
    instagram_reels: 'instagram_business',
    youtube_shorts: 'youtube_shorts',
    tiktok: 'tiktok_business',
    facebook_reels: 'facebook_page'
  };

  return [{ platform: platformMap[platform] || 'instagram_business', accountId: 'official-account' }];
}

function captionForSchedule(project) {
  const caption = project.captionResult?.caption || project.scriptResult?.captions?.[0] || `${project.title} is ready.`;
  const hashtags = project.captionResult?.hashtags || project.scriptResult?.hashtags || [];
  return [caption, hashtags.join(' ')].filter(Boolean).join('\n\n');
}

function exportBrandSnapshot(brandKit = {}) {
  return {
    id: brandKit.id,
    name: brandKit.name,
    colors: {
      primary: brandKit.primaryColor,
      secondary: brandKit.secondaryColor,
      accent: brandKit.accentColor
    },
    fontFamily: brandKit.fontFamily,
    subtitleStyle: brandKit.subtitleStyle,
    watermark: brandKit.watermark
  };
}

function buildExportPackage(project) {
  return {
    id: project.id,
    title: project.title,
    prompt: project.prompt,
    platform: project.platform,
    language: project.language,
    tone: project.tone,
    status: project.status,
    outputUrl: project.outputUrl,
    subtitlesUrl: project.subtitlesUrl,
    exportMetadata: project.exportMetadata || null,
    captionResult: project.captionResult || null,
    brandKit: project.brandKit || null,
    voiceover: project.voiceover || null,
    productionPack: project.productionPack || null,
    scenes: project.scenes || [],
    visualAssets: project.visualAssets || [],
    share: shareSummary(project),
    review: reviewSummary(project, { includePrivate: true }),
    schedulerDefaults: {
      title: project.title,
      caption: captionForSchedule(project),
      mediaUrl: project.outputUrl,
      targets: defaultScheduleTargets(project.platform)
    },
    generatedAt: new Date().toISOString()
  };
}

function startProjectJob(userId, project, input) {
  const job = createJob(userId, {
    type: 'video_render',
    title: project.title,
    projectId: project.id,
    payload: {
      prompt: input.prompt,
      platform: input.platform,
      language: input.language,
      tone: input.tone,
      templateId: input.templateId,
      avatarId: input.avatarId,
      voiceId: input.voiceId
    }
  });

  updateProject(project.id, { jobId: job.id });
  runProjectPipeline(project.id, input, userId, job.id);
  return job;
}

async function runProjectPipeline(projectId, input, userId, jobId) {
  try {
    updateProject(projectId, { status: 'scripting', progress: 15 });
    updateJob(jobId, { status: 'scripting', progress: 15, attempts: 1 });
    const brandKit = getBrandKit(userId);
    const scriptResult = await generateVideoScript(input);
    const captionResult = optimizeCaption({
      title: input.title,
      prompt: input.prompt,
      topic: input.prompt,
      niche: input.niche || input.template?.niche,
      platform: input.platform,
      tone: input.tone,
      hook: scriptResult.hook
    });
    updateProject(projectId, {
      status: 'voiceover',
      progress: 35,
      script: scriptResult.script,
      scriptResult,
      captionResult,
      brandKit: exportBrandSnapshot(brandKit),
      scenes: scriptResult.scenes
    });
    updateJob(jobId, { status: 'voiceover', progress: 35 });

    const voiceover = await generateVoiceover({
      script: scriptResult.script,
      voiceId: input.voiceId,
      language: input.language,
      durationSeconds: scriptResult.totalDurationSeconds,
      title: input.title || scriptResult.title
    });
    const productionPack = buildProductionPack({ input, scriptResult, brandKit, voiceover });

    updateProject(projectId, {
      status: 'rendering',
      progress: 55,
      script: scriptResult.script,
      scriptResult,
      captionResult,
      brandKit: exportBrandSnapshot(brandKit),
      voiceover,
      productionPack,
      avatarJob: productionPack.avatarJob,
      visualAssets: productionPack.visualAssets,
      scenes: scriptResult.scenes
    });
    updateJob(jobId, {
      status: 'rendering',
      progress: 55,
      payload: { ...input, script: scriptResult.script, scenes: scriptResult.scenes, captionResult, voiceover, productionPack }
    });

    const exportResult = await renderVideo({
      script: scriptResult.script,
      title: input.title || scriptResult.title,
      brandKit,
      voiceover
    });

    const exportMetadata = {
      fileName: `${exportResult.id}.mp4`,
      subtitlesFileName: `${exportResult.id}.srt`,
      format: 'mp4',
      resolution: '1080x1920',
      outputUrl: exportResult.url,
      subtitlesUrl: exportResult.subtitles,
      platform: input.platform,
      templateId: input.templateId || null,
      sceneCount: scriptResult.scenes.length,
      durationSeconds: exportResult.durationSeconds || scriptResult.totalDurationSeconds,
      brandKit: exportResult.brand || exportBrandSnapshot(brandKit),
      voiceoverUrl: voiceover.audioUrl,
      voiceoverManifestUrl: voiceover.manifestUrl,
      voiceoverProvider: voiceover.provider,
      audioMuxed: Boolean(exportResult.audio?.muxed),
      audioCodec: exportResult.audio?.codec || null,
      renderWarning: exportResult.renderWarning || null,
      generatedAt: new Date().toISOString()
    };
    const finalProductionPack = finalizeProductionPack(productionPack, exportResult, exportMetadata);

    incrementExportUsage(userId);
    updateProject(projectId, {
      status: 'completed',
      progress: 100,
      outputUrl: exportResult.url,
      subtitlesUrl: exportResult.subtitles,
      exportId: exportResult.id,
      exportMetadata,
      voiceover,
      productionPack: finalProductionPack,
      avatarJob: finalProductionPack.avatarJob,
      visualAssets: finalProductionPack.visualAssets,
      completedAt: new Date().toISOString()
    });
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      result: {
        projectId,
        exportUrl: exportResult.url,
        subtitlesUrl: exportResult.subtitles,
        captionResult,
        voiceover,
        productionPack: finalProductionPack,
        ...exportMetadata
      }
    });
  } catch (error) {
    updateProject(projectId, {
      status: 'failed',
      progress: 100,
      error: error.message || 'Project render failed.'
    });
    updateJob(jobId, {
      status: 'failed',
      progress: 100,
      error: error.message || 'Project render failed.'
    });
  }
}

router.get('/', (req, res) => {
  const projects = listProjects().filter(project => project.userId === req.user.id);
  res.json({ projects });
});

router.post('/', validateCreateProject, (req, res) => {
  const allowance = canCreateProject(req.user.id);
  if (!allowance.allowed) {
    return res.status(402).json({ error: 'Monthly project limit reached. Upgrade plan to create more videos.', allowance });
  }

  const input = applyTemplate(req.projectInput);
  const project = createProject({ ...input, userId: req.user.id });
  incrementProjectUsage(req.user.id);
  const job = startProjectJob(req.user.id, project, input);

  return res.status(201).json({ project: { ...project, jobId: job.id } });
});

router.get('/:id/export', (req, res) => {
  const project = getProject(req.params.id);
  if (!ensureOwner(project, req.user.id)) return res.status(404).json({ error: 'Project not found.' });
  return res.json({ export: exportPayload(project) });
});

router.get('/:id/package', (req, res) => {
  const project = getProject(req.params.id);
  if (!ensureOwner(project, req.user.id)) return res.status(404).json({ error: 'Project not found.' });
  return res.json({ package: buildExportPackage(project) });
});

router.get('/:id/bundle', (req, res, next) => {
  try {
    const project = getProject(req.params.id);
    if (!ensureOwner(project, req.user.id)) return res.status(404).json({ error: 'Project not found.' });
    if (project.status !== 'completed' || !project.outputUrl) {
      return res.status(409).json({ error: 'Project must be completed before downloading a bundle.' });
    }

    const bundle = createProjectBundle(project, buildExportPackage(project));
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${bundle.fileName}"`);
    res.setHeader('X-Bundle-File-Count', String(bundle.fileCount));
    return res.send(bundle.buffer);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  if (project.userId !== req.user.id) return res.status(403).json({ error: 'You cannot access this project.' });
  return res.json({ project });
});

router.post('/:id/retry', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  if (project.userId !== req.user.id) return res.status(403).json({ error: 'You cannot access this project.' });

  const retryInput = applyTemplate({
    title: project.title,
    prompt: project.prompt,
    platform: project.platform,
    language: project.language,
    tone: project.tone,
    templateId: project.templateId,
    niche: project.niche,
    sceneCount: project.sceneCount,
    avatarId: project.avatarId,
    voiceId: project.voiceId,
    mediaAssetId: project.mediaAssetId
  });

  const resetProject = updateProject(project.id, {
    status: 'queued',
    progress: 0,
    error: null,
    outputUrl: null,
    subtitlesUrl: null,
    exportId: null,
    exportMetadata: null,
    captionResult: null,
    brandKit: null,
    voiceover: null,
    productionPack: null,
    avatarJob: null,
    visualAssets: []
  });
  const job = startProjectJob(req.user.id, resetProject, retryInput);
  return res.json({ project: { ...resetProject, jobId: job.id }, job });
});

router.post('/:id/schedule', (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!ensureOwner(project, req.user.id)) return res.status(404).json({ error: 'Project not found.' });
    if (project.status !== 'completed' || !project.outputUrl) {
      return res.status(409).json({ error: 'Project must be completed before scheduling.' });
    }

    const post = createScheduledPost(req.user.id, {
      title: req.body.title || project.title,
      caption: req.body.caption || captionForSchedule(project),
      mediaUrl: req.body.mediaUrl || project.outputUrl,
      scheduledAt: req.body.scheduledAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timezone: req.body.timezone || 'UTC',
      targets: req.body.targets || defaultScheduleTargets(project.platform),
      notes: req.body.notes || `Scheduled from project ${project.id}`
    });
    const scheduledPostIds = [...new Set([...(project.scheduledPostIds || []), post.id])];
    const updatedProject = updateProject(project.id, { scheduledPostIds });

    return res.status(201).json({ post, project: updatedProject });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Schedule create failed.' });
  }
});

router.post('/:id/share', (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!ensureOwner(project, req.user.id)) return res.status(404).json({ error: 'Project not found.' });
    const result = createProjectShare(project.id, { ttlDays: req.body.ttlDays });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Share link create failed.' });
  }
});

router.delete('/:id/share', (req, res) => {
  try {
    const project = getProject(req.params.id);
    if (!ensureOwner(project, req.user.id)) return res.status(404).json({ error: 'Project not found.' });
    return res.json(revokeProjectShare(project.id));
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Share link revoke failed.' });
  }
});

router.delete('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  if (project.userId !== req.user.id) return res.status(403).json({ error: 'You cannot delete this project.' });

  deleteProject(project.id);
  return res.json({ ok: true });
});

export default router;
