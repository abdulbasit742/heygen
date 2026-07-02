import crypto from 'crypto';

const scheduledPosts = new Map();

const SUPPORTED_PLATFORMS = [
  'facebook_page',
  'instagram_business',
  'youtube_shorts',
  'tiktok_business',
  'linkedin_page'
];

function safeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeTargets(targets = []) {
  return targets
    .filter(target => target && SUPPORTED_PLATFORMS.includes(target.platform))
    .map(target => ({
      platform: target.platform,
      accountId: safeText(target.accountId) || 'demo-account',
      status: 'queued'
    }));
}

export function listScheduledPosts({ ownerId, status, platform } = {}) {
  return Array.from(scheduledPosts.values())
    .filter(post => !ownerId || post.ownerId === ownerId)
    .filter(post => !status || post.status === status)
    .filter(post => !platform || post.targets.some(target => target.platform === platform))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

export function getScheduledPost(id) {
  return scheduledPosts.get(id) || null;
}

export function createScheduledPost(ownerId, input = {}) {
  const title = safeText(input.title);
  const caption = safeText(input.caption);
  const mediaUrl = safeText(input.mediaUrl || input.exportUrl);
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  const targets = normalizeTargets(input.targets);

  if (!title) throw new Error('Title is required.');
  if (!caption) throw new Error('Caption is required.');
  if (!mediaUrl) throw new Error('Media or export URL is required.');
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) throw new Error('Valid scheduledAt date is required.');
  if (!targets.length) throw new Error('At least one supported platform target is required.');

  const post = {
    id: crypto.randomUUID(),
    ownerId,
    title,
    caption,
    mediaUrl,
    scheduledAt: scheduledAt.toISOString(),
    timezone: safeText(input.timezone) || 'UTC',
    targets,
    status: 'scheduled',
    notes: safeText(input.notes),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  scheduledPosts.set(post.id, post);
  return post;
}

export function updateScheduledPost(id, input = {}) {
  const post = getScheduledPost(id);
  if (!post) return null;

  const next = {
    ...post,
    ...input,
    updatedAt: new Date().toISOString()
  };

  if (input.targets) next.targets = normalizeTargets(input.targets);
  if (input.scheduledAt) next.scheduledAt = new Date(input.scheduledAt).toISOString();

  scheduledPosts.set(id, next);
  return next;
}

export function cancelScheduledPost(id) {
  const post = getScheduledPost(id);
  if (!post) return null;
  return updateScheduledPost(id, { status: 'cancelled' });
}

export function markPostPublished(id, publishResult = {}) {
  const post = getScheduledPost(id);
  if (!post) return null;

  return updateScheduledPost(id, {
    status: 'published',
    publishedAt: new Date().toISOString(),
    publishResult,
    targets: post.targets.map(target => ({ ...target, status: 'published' }))
  });
}

export function getSupportedPlatforms() {
  return SUPPORTED_PLATFORMS;
}
