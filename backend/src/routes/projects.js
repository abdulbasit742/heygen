import { Router } from 'express';
import { validateCreateProject } from '../middleware/validateProject.js';
import { createProject, getProject, listProjects, updateProject } from '../services/projectStore.js';
import { requireAuth } from '../middleware/auth.js';
import { canCreateProject, incrementExportUsage, incrementProjectUsage } from '../services/subscriptionService.js';
import { generateVideoScript } from '../services/aiScriptGenerator.js';
import { renderVideo } from '../services/renderService.js';

const router = Router();

router.use(requireAuth);

async function runProjectPipeline(projectId, input, userId) {
  try {
    updateProject(projectId, { status: 'scripting', progress: 15 });
    const scriptResult = await generateVideoScript(input);

    updateProject(projectId, {
      status: 'rendering',
      progress: 55,
      script: scriptResult.script,
      scriptResult,
      scenes: scriptResult.scenes
    });

    const exportResult = await renderVideo({
      script: scriptResult.script,
      title: input.title || scriptResult.title
    });

    incrementExportUsage(userId);
    updateProject(projectId, {
      status: 'completed',
      progress: 100,
      outputUrl: exportResult.url,
      subtitlesUrl: exportResult.subtitles,
      exportId: exportResult.id,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    updateProject(projectId, {
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

  const project = createProject({ ...req.projectInput, userId: req.user.id });
  incrementProjectUsage(req.user.id);
  runProjectPipeline(project.id, req.projectInput, req.user.id);

  return res.status(201).json({ project });
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  if (project.userId !== req.user.id) return res.status(403).json({ error: 'You cannot access this project.' });
  return res.json({ project });
});

export default router;
