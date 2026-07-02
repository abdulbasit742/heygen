import { listProjects } from './projectStore.js';
import { getUsage } from './subscriptionService.js';

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function getAnalyticsSummary(userId) {
  const projects = listProjects().filter(project => !project.userId || project.userId === userId);
  const exports = projects.filter(project => project.outputUrl);
  const usage = getUsage(userId);

  const totalDurationSeconds = projects.reduce((sum, project) => {
    const scenes = project.scriptResult?.scenes || project.scenes || [];
    return sum + scenes.reduce((sceneSum, scene) => sceneSum + (scene.durationSeconds || 0), 0);
  }, 0);

  return {
    totals: {
      projects: projects.length,
      completed: projects.filter(project => project.status === 'completed').length,
      processing: projects.filter(project => ['queued', 'processing', 'rendering'].includes(project.status)).length,
      failed: projects.filter(project => project.status === 'failed').length,
      exports: exports.length,
      estimatedMinutes: Math.round(totalDurationSeconds / 60)
    },
    usage,
    byPlatform: countBy(projects, project => project.platform),
    byStatus: countBy(projects, project => project.status),
    latestProjects: projects.slice(0, 6).map(project => ({
      id: project.id,
      title: project.title,
      platform: project.platform,
      status: project.status,
      progress: project.progress || 0,
      createdAt: project.createdAt
    }))
  };
}
