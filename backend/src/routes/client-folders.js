import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  addProjectToClientFolder,
  clientFolderSummary,
  createClientFolder,
  deleteClientFolder,
  getClientFolder,
  listClientFolders,
  removeProjectFromClientFolder,
  updateClientFolder
} from '../services/clientFolderService.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({
    folders: listClientFolders(req.user.id),
    summary: clientFolderSummary(req.user.id)
  });
});

router.post('/', (req, res) => {
  try {
    const folder = createClientFolder(req.user.id, req.body);
    res.status(201).json({ folder, summary: clientFolderSummary(req.user.id) });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Client folder create failed.' });
  }
});

router.get('/:folderId', (req, res) => {
  const folder = getClientFolder(req.params.folderId, req.user.id);
  if (!folder) return res.status(404).json({ error: 'Client folder not found.' });
  return res.json({ folder });
});

router.put('/:folderId', (req, res) => {
  const folder = updateClientFolder(req.params.folderId, req.user.id, req.body);
  if (!folder) return res.status(404).json({ error: 'Client folder not found.' });
  return res.json({ folder, summary: clientFolderSummary(req.user.id) });
});

router.post('/:folderId/projects', (req, res) => {
  try {
    const folder = addProjectToClientFolder(req.params.folderId, req.user.id, req.body.projectId);
    if (!folder) return res.status(404).json({ error: 'Client folder not found.' });
    return res.json({ folder, summary: clientFolderSummary(req.user.id) });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Project assignment failed.' });
  }
});

router.delete('/:folderId/projects/:projectId', (req, res) => {
  const folder = removeProjectFromClientFolder(req.params.folderId, req.user.id, req.params.projectId);
  if (!folder) return res.status(404).json({ error: 'Client folder not found.' });
  return res.json({ folder, summary: clientFolderSummary(req.user.id) });
});

router.delete('/:folderId', (req, res) => {
  const deleted = deleteClientFolder(req.params.folderId, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Client folder not found.' });
  return res.json({ ok: true, summary: clientFolderSummary(req.user.id) });
});

export default router;
