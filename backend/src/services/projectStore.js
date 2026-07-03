import crypto from 'crypto';
import { loadMap, saveMap } from './jsonFileStore.js';

const STORE_FILE = 'projects.json';
const projects = loadMap(STORE_FILE);

function persistProjects() {
  saveMap(STORE_FILE, projects);
}

export function createProject(input) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const project = {
    id,
    ...input,
    status: 'queued',
    progress: 0,
    outputUrl: null,
    createdAt: now,
    updatedAt: now
  };
  projects.set(id, project);
  persistProjects();
  return project;
}

export function getProject(id) {
  return projects.get(id) || null;
}

export function listProjects() {
  return Array.from(projects.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateProject(id, patch) {
  const current = getProject(id);
  if (!current) return null;
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
  projects.set(id, updated);
  persistProjects();
  return updated;
}
