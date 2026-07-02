import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getOrCreateDefaultWorkspace,
  getWorkspace,
  inviteWorkspaceMember,
  listUserWorkspaces,
  listWorkspaceInvites,
  removeWorkspaceMember,
  updateWorkspace
} from '../services/workspaceService.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const workspace = getOrCreateDefaultWorkspace(req.user);
  const workspaces = listUserWorkspaces(req.user.id);
  res.json({ workspaces: workspaces.length ? workspaces : [workspace] });
});

router.get('/default', (req, res) => {
  res.json({ workspace: getOrCreateDefaultWorkspace(req.user) });
});

router.get('/:workspaceId', (req, res) => {
  const workspace = getWorkspace(req.params.workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });
  return res.json({ workspace });
});

router.put('/:workspaceId', (req, res) => {
  const workspace = updateWorkspace(req.params.workspaceId, req.body);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });
  return res.json({ workspace });
});

router.post('/:workspaceId/invites', (req, res, next) => {
  try {
    const invite = inviteWorkspaceMember(req.params.workspaceId, req.body);
    res.status(201).json({ invite });
  } catch (error) {
    next(error);
  }
});

router.get('/:workspaceId/invites', (req, res) => {
  res.json({ invites: listWorkspaceInvites(req.params.workspaceId) });
});

router.delete('/:workspaceId/members/:email', (req, res) => {
  const workspace = removeWorkspaceMember(req.params.workspaceId, req.params.email);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });
  return res.json({ workspace });
});

export default router;
