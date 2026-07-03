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
    scenes: project.scenes || [],
    completedAt: project.completedAt || null
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
      status: 'rendering',
      progress: 55,
      script: scriptResult.script,
      scriptResult,
      captionResult,
      scenes: scriptResult.scenes
    });
    updateJob(jobId, {
      status: 'rendering',
      progress: 55,
      payload: { ...input, script: scriptResult.script, scenes: scriptResult.scenes, captionResult }
    });

    const exportResult = await renderVideo({
      script: scriptResult.script,
      title: input.title || scriptResult.title
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
      durationSeconds: scriptResult.totalDurationSeconds,
      generatedAt: new Date().toISOString()
    };

    incrementExportUsage(userId);
    updateProject(projectId, {
      status: 'completed',
      progress: 100,
      outputUrl: exportResult.url,
      subtitlesUrl: exportResult.subtitles,
      exportId: exportResult.id,
      exportMetadata,
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
    captionResult: null
  });
  const job = startProjectJob(req.user.id, resetProject, retryInput);
  return res.json({ project: { ...resetProject, jobId: job.id }, job });
});

router.delete('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  if (project.userId !== req.user.id) return res.status(403).json({ error: 'You cannot delete this project.' });

  deleteProject(project.id);
  return res.json({ ok: true });
});

export default router;
