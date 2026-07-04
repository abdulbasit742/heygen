import { listProjects } from './projectStore.js';
import { getUsage } from './subscriptionService.js';

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function shareStatus(project) {
  const share = project.share || {};
  if (!share.token) return 'not_shared';
  if (!share.enabled) return 'revoked';
  if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) return 'expired';
  return 'active';
}

export function getAnalyticsSummary(userId) {
  const projects = listProjects().filter(project => !project.userId || project.userId === userId);
  const exports = projects.filter(project => project.outputUrl);
  const sharedProjects = projects.filter(project => project.share?.token);
  const usage = getUsage(userId);

  const totalDurationSeconds = projects.reduce((sum, project) => {
    const scenes = project.scriptResult?.scenes || project.scenes || [];
    return sum + scenes.reduce((sceneSum, scene) => sceneSum + (scene.durationSeconds || 0), 0);
  }, 0);

  return {
    totals: {
      projects: projects.length,
      completed: projects.filter(project => project.status === 'completed').length,
      processing: projects.filter(project => ['queued', 'processing', 'scripting', 'voiceover', 'rendering'].includes(project.status)).length,
      failed: projects.filter(project => project.status === 'failed').length,
      exports: exports.length,
      shares: sharedProjects.length,
      activeShares: sharedProjects.filter(project => shareStatus(project) === 'active').length,
      shareViews: sharedProjects.reduce((sum, project) => sum + (project.share?.viewCount || 0), 0),
      estimatedMinutes: Math.round(totalDurationSeconds / 60)
    },
    usage,
    byPlatform: countBy(projects, project => project.platform),
    byStatus: countBy(projects, project => project.status),
    byShareStatus: countBy(sharedProjects, project => shareStatus(project)),
    latestProjects: projects.slice(0, 6).map(project => ({
      id: project.id,
      title: project.title,
      platform: project.platform,
      status: project.status,
      progress: project.progress || 0,
      createdAt: project.createdAt
    })),
    latestShares: sharedProjects
      .slice()
      .sort((a, b) => String(b.share?.createdAt || '').localeCompare(String(a.share?.createdAt || '')))
      .slice(0, 6)
      .map(project => ({
        id: project.id,
        title: project.title,
        platform: project.platform,
        status: shareStatus(project),
        shareUrl: `/share/${project.share.token}`,
        viewCount: project.share.viewCount || 0,
        createdAt: project.share.createdAt,
        expiresAt: project.share.expiresAt,
        lastViewedAt: project.share.lastViewedAt || null
      }))
  };
}
