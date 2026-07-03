import crypto from 'crypto';
import { loadMap, saveMap } from './jsonFileStore.js';

const WORKSPACE_FILE = 'workspaces.json';
const INVITE_FILE = 'workspace-invites.json';
const workspaces = loadMap(WORKSPACE_FILE);
const invites = loadMap(INVITE_FILE);

function persistWorkspaces() {
  saveMap(WORKSPACE_FILE, workspaces);
}

function persistInvites() {
  saveMap(INVITE_FILE, invites);
}

function now() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeRole(role = 'member') {
  return ['owner', 'admin', 'editor', 'viewer'].includes(role) ? role : 'member';
}

export function getOrCreateDefaultWorkspace(user) {
  const existing = [...workspaces.values()].find(workspace =>
    workspace.members.some(member => member.userId === user.id && member.role === 'owner')
  );

  if (existing) return existing;

  const workspace = {
    id: createId('ws'),
    name: `${user.name || user.email}'s Studio`,
    ownerId: user.id,
    plan: 'free',
    createdAt: now(),
    updatedAt: now(),
    members: [
      {
        userId: user.id,
        email: user.email,
        name: user.name || user.email,
        role: 'owner',
        status: 'active',
        joinedAt: now()
      }
    ]
  };

  workspaces.set(workspace.id, workspace);
  persistWorkspaces();
  return workspace;
}

export function listUserWorkspaces(userId) {
  return [...workspaces.values()].filter(workspace =>
    workspace.members.some(member => member.userId === userId || member.email === userId)
  );
}

export function getWorkspace(workspaceId) {
  return workspaces.get(workspaceId) || null;
}

export function updateWorkspace(workspaceId, updates = {}) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return null;

  const updated = {
    ...workspace,
    name: updates.name?.trim() || workspace.name,
    plan: updates.plan || workspace.plan,
    updatedAt: now()
  };

  workspaces.set(workspaceId, updated);
  persistWorkspaces();
  return updated;
}

export function inviteWorkspaceMember(workspaceId, input = {}) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) throw new Error('Workspace not found.');
  if (!input.email) throw new Error('Invite email is required.');

  const invite = {
    id: createId('invite'),
    workspaceId,
    email: String(input.email).toLowerCase().trim(),
    role: normalizeRole(input.role),
    status: 'pending',
    token: crypto.randomBytes(16).toString('hex'),
    createdAt: now()
  };

  invites.set(invite.id, invite);
  workspace.members.push({
    email: invite.email,
    role: invite.role,
    status: 'invited',
    invitedAt: invite.createdAt
  });
  workspace.updatedAt = now();
  persistInvites();
  persistWorkspaces();

  return invite;
}

export function listWorkspaceInvites(workspaceId) {
  return [...invites.values()].filter(invite => invite.workspaceId === workspaceId);
}

export function removeWorkspaceMember(workspaceId, email) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return null;

  workspace.members = workspace.members.filter(member => member.email !== email || member.role === 'owner');
  workspace.updatedAt = now();
  persistWorkspaces();
  return workspace;
}
