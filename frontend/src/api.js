import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('auth_token');
  }
}

export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload);
  setAuthToken(data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  setAuthToken(data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export function loadStoredAuth() {
  const token = localStorage.getItem('auth_token');
  const userRaw = localStorage.getItem('auth_user');
  if (token) setAuthToken(token);
  return { token, user: userRaw ? JSON.parse(userRaw) : null };
}

export async function createProject(payload) {
  const { data } = await api.post('/projects', payload);
  return data.project;
}

export async function listProjects() {
  const { data } = await api.get('/projects');
  return data.projects;
}

export async function getProject(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data.project;
}


export async function listPlans() {
  const { data } = await api.get('/billing/plans');
  return data.plans;
}

export async function getBillingMe() {
  const { data } = await api.get('/billing/me');
  return data;
}

export async function checkoutMock(planId) {
  const { data } = await api.post('/billing/checkout/mock', { planId });
  return data;
}


export async function listAvatars(language) {
  const { data } = await api.get('/avatars', {
    params: language ? { language } : {}
  });
  return data.avatars;
}

export async function createAvatarJob(payload) {
  const { data } = await api.post('/avatars/job', payload);
  return data.job;
}


export async function createSceneAssets(payload) {
  const { data } = await api.post('/scene-assets', payload);
  return data.assets;
}


export async function listMedia(params = {}) {
  const { data } = await api.get('/media', { params });
  return data.media;
}

export async function addMedia(payload) {
  const { data } = await api.post('/media', payload);
  return data.media;
}

export async function deleteMedia(id) {
  const { data } = await api.delete(`/media/${id}`);
  return data;
}

export async function getBrandKit() {
  const { data } = await api.get('/brand-kit/me');
  return data.brandKit;
}

export async function saveBrandKit(payload) {
  const { data } = await api.put('/brand-kit/me', payload);
  return data.brandKit;
}

export async function getAnalyticsSummary() {
  const { data } = await api.get('/analytics/summary');
  return data.analytics;
}


export async function listWorkspaces() {
  const { data } = await api.get('/workspaces');
  return data.workspaces;
}

export async function getDefaultWorkspace() {
  const { data } = await api.get('/workspaces/default');
  return data.workspace;
}

export async function updateWorkspace(workspaceId, payload) {
  const { data } = await api.put(`/workspaces/${workspaceId}`, payload);
  return data.workspace;
}

export async function inviteMember(workspaceId, payload) {
  const { data } = await api.post(`/workspaces/${workspaceId}/invites`, payload);
  return data.invite;
}

export async function listInvites(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/invites`);
  return data.invites;
}

export async function removeMember(workspaceId, email) {
  const { data } = await api.delete(`/workspaces/${workspaceId}/members/${encodeURIComponent(email)}`);
  return data.workspace;
}


export async function listScheduledPosts(params = {}) {
  const { data } = await api.get('/scheduler', { params });
  return data.posts;
}

export async function createScheduledPost(payload) {
  const { data } = await api.post('/scheduler', payload);
  return data.post;
}

export async function cancelScheduledPost(id) {
  const { data } = await api.post(`/scheduler/${id}/cancel`);
  return data.post;
}

export async function mockPublishPost(id) {
  const { data } = await api.post(`/scheduler/${id}/mock-publish`);
  return data.post;
}

export async function listSchedulerPlatforms() {
  const { data } = await api.get('/scheduler/platforms');
  return data.platforms;
}

export async function getSettings() {
  const { data } = await api.get('/settings');
  return data.settings;
}

export async function updateSettings(payload) {
  const { data } = await api.put('/settings', payload);
  return data.settings;
}

export async function resetSettings() {
  const { data } = await api.post('/settings/reset');
  return data.settings;
}

export async function getProviderStatus() {
  const { data } = await api.get('/settings/providers');
  return data.providers;
}


export async function listJobs(params = {}) {
  const { data } = await api.get('/jobs', { params });
  return data.jobs;
}

export async function createJob(payload) {
  const { data } = await api.post('/jobs', payload);
  return data.job;
}

export async function getJob(id) {
  const { data } = await api.get(`/jobs/${id}`);
  return data.job;
}

export async function retryJob(id) {
  const { data } = await api.post(`/jobs/${id}/retry`);
  return data.job;
}

export async function cancelJob(id) {
  const { data } = await api.post(`/jobs/${id}/cancel`);
  return data.job;
}
