import { Router } from 'express';
import { validateCreateProject } from '../middleware/validateProject.js';
import { createProject, getProject, listProjects, updateProject } from '../services/projectStore.js';
import { requireAuth } from '../middleware/auth.js';
import { canCreateProject, incrementProjectUsage } from '../services/subscriptionService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ projects: listProjects() });
});

router.post('/', requireAuth, validateCreateProject, (req, res) => {
  const allowance = canCreateProject(req.user.id);
  if (!allowance.allowed) {
    return res.status(402).json({ error: 'Monthly project limit reached. Upgrade plan to create more videos.', allowance });
  }

  const project = createProject({ ...req.projectInput, userId: req.user.id });
  incrementProjectUsage(req.user.id);

  // Placeholder async simulation. Step 3 will connect real script/voice/render pipeline.
  setTimeout(() => updateProject(project.id, { status: 'processing', progress: 25 }), 500);
  setTimeout(() => updateProject(project.id, { status: 'rendering', progress: 70 }), 1200);
  setTimeout(() => updateProject(project.id, {
    status: 'completed',
    progress: 100,
    outputUrl: `/exports/${project.id}.mp4`
  }), 2200);

  res.status(201).json({ project });
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json({ project });
});

export default router;
