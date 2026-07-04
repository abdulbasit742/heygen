import crypto from 'crypto';
import { getProject, listProjects } from './projectStore.js';
import { loadMap, saveMap } from './jsonFileStore.js';

const STORE_FILE = 'client-folders.json';
const folders = loadMap(STORE_FILE);
const ALLOWED_STATUSES = new Set(['active', 'paused', 'archived']);

function persistFolders() {
  saveMap(STORE_FILE, folders);
}

function now() {
  return new Date().toISOString();
}

function createId() {
  return `folder_${crypto.randomUUID()}`;
}

function cleanText(value, fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim();
}

function normalizeColor(value) {
  const color = cleanText(value, '#2563eb');
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#2563eb';
}

function normalizeStatus(value) {
  return ALLOWED_STATUSES.has(value) ? value : 'active';
}

function uniqueProjectIds(projectIds = []) {
  return [...new Set(projectIds.filter(Boolean).map(String))];
}

function ownedProject(projectId, userId) {
  const project = getProject(projectId);
  return project && project.userId === userId ? project : null;
}

function projectSummary(project) {
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    platform: project.platform,
    progress: project.progress || 0,
    outputUrl: project.outputUrl || null,
    createdAt: project.createdAt,
    completedAt: project.completedAt || null
  };
}

function enrichFolder(folder) {
  const ownedProjects = uniqueProjectIds(folder.projectIds)
    .map(projectId => ownedProject(projectId, folder.userId))
    .filter(Boolean);
  const completedProjects = ownedProjects.filter(project => project.status === 'completed');
  const exports = ownedProjects.filter(project => project.outputUrl);

  return {
    ...folder,
    projectIds: ownedProjects.map(project => project.id),
    projects: ownedProjects.map(projectSummary),
    metrics: {
      totalProjects: ownedProjects.length,
      completedProjects: completedProjects.length,
      exports: exports.length,
      platforms: [...new Set(ownedProjects.map(project => project.platform).filter(Boolean))]
    }
  };
}

export function listClientFolders(userId) {
  return [...folders.values()]
    .filter(folder => folder.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(enrichFolder);
}

export function getClientFolder(folderId, userId) {
  const folder = folders.get(folderId);
  if (!folder || folder.userId !== userId) return null;
  return enrichFolder(folder);
}

export function createClientFolder(userId, input = {}) {
  const name = cleanText(input.name, input.clientName || 'New Client Folder');
  if (!name) throw new Error('Folder name is required.');

  const timestamp = now();
  const folder = {
    id: createId(),
    userId,
    name,
    clientName: cleanText(input.clientName, name),
    status: normalizeStatus(input.status),
    color: normalizeColor(input.color),
    notes: cleanText(input.notes),
    projectIds: uniqueProjectIds(input.projectIds).filter(projectId => ownedProject(projectId, userId)),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  folders.set(folder.id, folder);
  persistFolders();
  return enrichFolder(folder);
}

export function updateClientFolder(folderId, userId, input = {}) {
  const folder = folders.get(folderId);
  if (!folder || folder.userId !== userId) return null;

  const updated = {
    ...folder,
    name: cleanText(input.name, folder.name),
    clientName: cleanText(input.clientName, folder.clientName),
    status: input.status ? normalizeStatus(input.status) : folder.status,
    color: input.color ? normalizeColor(input.color) : folder.color,
    notes: input.notes === undefined ? folder.notes : cleanText(input.notes),
    updatedAt: now()
  };

  folders.set(folderId, updated);
  persistFolders();
  return enrichFolder(updated);
}

export function deleteClientFolder(folderId, userId) {
  const folder = folders.get(folderId);
  if (!folder || folder.userId !== userId) return false;
  const deleted = folders.delete(folderId);
  if (deleted) persistFolders();
  return deleted;
}

export function addProjectToClientFolder(folderId, userId, projectId) {
  const folder = folders.get(folderId);
  if (!folder || folder.userId !== userId) return null;
  const project = ownedProject(projectId, userId);
  if (!project) throw new Error('Project not found or not owned by this user.');

  const updated = {
    ...folder,
    projectIds: uniqueProjectIds([...(folder.projectIds || []), project.id]),
    updatedAt: now()
  };

  folders.set(folderId, updated);
  persistFolders();
  return enrichFolder(updated);
}

export function removeProjectFromClientFolder(folderId, userId, projectId) {
  const folder = folders.get(folderId);
  if (!folder || folder.userId !== userId) return null;

  const updated = {
    ...folder,
    projectIds: uniqueProjectIds(folder.projectIds).filter(id => id !== projectId),
    updatedAt: now()
  };

  folders.set(folderId, updated);
  persistFolders();
  return enrichFolder(updated);
}

export function clientFolderSummary(userId) {
  const userProjects = listProjects().filter(project => project.userId === userId);
  const folderList = listClientFolders(userId);
  const assignedIds = new Set(folderList.flatMap(folder => folder.projectIds || []));

  return {
    folders: folderList.length,
    assignedProjects: assignedIds.size,
    unassignedProjects: userProjects.filter(project => !assignedIds.has(project.id)).length,
    activeFolders: folderList.filter(folder => folder.status === 'active').length
  };
}
