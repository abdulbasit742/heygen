import crypto from 'crypto';
import { getProject, listProjects, updateProject } from './projectStore.js';

const DEFAULT_SHARE_DAYS = 30;
const REVIEW_DECISIONS = new Set(['feedback', 'changes_requested', 'approved']);
const SHARE_TOKEN_PATTERN = /^[a-f0-9]{36}$/;

function nowIso() {
  return new Date().toISOString();
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function boundedShareDays(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(365, Math.max(1, parsed)) : DEFAULT_SHARE_DAYS;
}

function isActiveShare(share = {}) {
  if (!share.enabled || !SHARE_TOKEN_PATTERN.test(String(share.token || ''))) return false;
  if (!share.expiresAt) return true;
  return new Date(share.expiresAt).getTime() > Date.now();
}

function publicUrl(token) {
  return `/share/${token}`;
}

function cleanText(value, maxLength = 500) {
  return String(value || '').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeDecision(value) {
  return REVIEW_DECISIONS.has(value) ? value : 'feedback';
}

function statusFromDecision(decision, currentStatus = 'in_review') {
  if (decision === 'approved') return 'approved';
  if (decision === 'changes_requested') return 'changes_requested';
  return currentStatus === 'approved' ? 'in_review' : currentStatus;
}

function feedbackSummary(item) {
  return {
    id: item.id,
    decision: item.decision,
    reviewerName: item.reviewerName,
    message: item.message,
    createdAt: item.createdAt,
  };
}

export function reviewSummary(project = {}) {
  const feedback = project.review?.feedback || [];
  return {
    status: project.review?.status || 'not_started',
    feedbackCount: feedback.length,
    approvals: feedback.filter((item) => item.decision === 'approved').length,
    changesRequested: feedback.filter((item) => item.decision === 'changes_requested').length,
    latestFeedbackAt: project.review?.latestFeedbackAt || feedback.at(-1)?.createdAt || null,
    feedback: feedback.slice(-6).reverse().map(feedbackSummary),
  };
}

export function createProjectShare(projectId, options = {}) {
  const project = getProject(projectId);
  if (!project) throw new Error('Project not found.');
  if (project.status !== 'completed' || !project.outputUrl) {
    throw new Error('Project must be completed before sharing.');
  }

  const ttlDays = boundedShareDays(options.ttlDays);
  const existingViews = project.share?.viewCount || 0;
  const share = {
    token: crypto.randomBytes(18).toString('hex'),
    enabled: true,
    createdAt: nowIso(),
    expiresAt: addDays(ttlDays),
    viewCount: existingViews,
    lastViewedAt: project.share?.lastViewedAt || null,
  };

  const updatedProject = updateProject(projectId, { share });
  return { project: updatedProject, share: shareSummary(updatedProject) };
}

export function revokeProjectShare(projectId) {
  const project = getProject(projectId);
  if (!project) throw new Error('Project not found.');

  const share = {
    ...(project.share || {}),
    enabled: false,
    revokedAt: nowIso(),
  };

  const updatedProject = updateProject(projectId, { share });
  return { project: updatedProject, share: shareSummary(updatedProject) };
}

export function shareSummary(project = {}) {
  if (!project.share?.token) return null;
  return {
    token: project.share.token,
    enabled: Boolean(project.share.enabled),
    shareUrl: publicUrl(project.share.token),
    apiUrl: `/api/share/${project.share.token}`,
    createdAt: project.share.createdAt,
    expiresAt: project.share.expiresAt,
    revokedAt: project.share.revokedAt || null,
    viewCount: project.share.viewCount || 0,
    lastViewedAt: project.share.lastViewedAt || null,
    review: reviewSummary(project),
  };
}

export function findProjectByShareToken(token, { countView = false } = {}) {
  const safeToken = String(token || '').toLowerCase();
  if (!SHARE_TOKEN_PATTERN.test(safeToken)) return null;
  const project = listProjects().find((item) => item.share?.token === safeToken);
  if (!project || !isActiveShare(project.share)) return null;

  if (!countView) return project;

  const share = {
    ...project.share,
    viewCount: (project.share.viewCount || 0) + 1,
    lastViewedAt: nowIso(),
  };
  return updateProject(project.id, { share });
}

export function addShareReview(token, input = {}) {
  const project = findProjectByShareToken(token, { countView: false });
  if (!project) throw new Error('Shared export not found or expired.');

  const decision = normalizeDecision(input.decision);
  const message = cleanText(input.message, 1200);
  if (decision !== 'approved' && message.length < 3) {
    throw new Error('Feedback message is required.');
  }

  const createdAt = nowIso();
  const currentFeedback = project.review?.feedback || [];
  const item = {
    id: crypto.randomUUID(),
    decision,
    reviewerName: cleanText(input.reviewerName || input.name, 80) || 'Client reviewer',
    message,
    createdAt,
  };
  const review = {
    status: statusFromDecision(decision, project.review?.status),
    feedback: [...currentFeedback.slice(-199), item],
    latestFeedbackAt: createdAt,
    updatedAt: createdAt,
  };
  const updatedProject = updateProject(project.id, { review });

  return {
    review: reviewSummary(updatedProject),
    feedback: item,
    share: publicSharePayload(updatedProject),
  };
}

export function publicSharePayload(project = {}) {
  return {
    id: project.id,
    title: project.title,
    platform: project.platform,
    status: project.status,
    outputUrl: project.outputUrl,
    subtitlesUrl: project.subtitlesUrl,
    completedAt: project.completedAt || null,
    share: shareSummary(project),
    review: reviewSummary(project),
    caption: project.captionResult?.caption || '',
    hashtags: project.captionResult?.hashtags || [],
    exportMetadata: {
      fileName: project.exportMetadata?.fileName || null,
      format: project.exportMetadata?.format || null,
      resolution: project.exportMetadata?.resolution || null,
      durationSeconds: project.exportMetadata?.durationSeconds || null,
      audioMuxed: Boolean(project.exportMetadata?.audioMuxed),
      audioCodec: project.exportMetadata?.audioCodec || null,
      brandName: project.exportMetadata?.brandKit?.name || null,
    },
    visualAssets: (project.visualAssets || []).map((asset) => ({
      sceneOrder: asset.sceneOrder,
      type: asset.type,
      imageUrl: asset.imageUrl,
      assetUrl: asset.assetUrl,
      prompt: asset.prompt,
    })),
    scenes: (project.scenes || []).map((scene) => ({
      order: scene.order,
      subtitle: scene.subtitle,
      durationSeconds: scene.durationSeconds,
    })),
  };
}
