import { loadMap, saveMap } from './jsonFileStore.js';

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyUsd: 0,
    limits: {
      projectsPerMonth: 5,
      exportsPerMonth: 2,
      maxVideoSeconds: 30,
      watermark: true,
      resolution: '720p'
    },
    features: ['Basic script generator', 'Watermarked exports', '720p previews']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlyUsd: 19,
    limits: {
      projectsPerMonth: 100,
      exportsPerMonth: 50,
      maxVideoSeconds: 120,
      watermark: false,
      resolution: '1080p'
    },
    features: ['HD exports', 'No watermark', 'Premium voices', 'Priority render queue']
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    priceMonthlyUsd: 79,
    limits: {
      projectsPerMonth: 1000,
      exportsPerMonth: 500,
      maxVideoSeconds: 300,
      watermark: false,
      resolution: '1080p'
    },
    features: ['Team workspace', 'Bulk videos', 'Client folders', 'Commercial usage']
  }
};

const SUBSCRIPTION_FILE = 'subscriptions.json';
const USAGE_FILE = 'usage.json';
const subscriptions = loadMap(SUBSCRIPTION_FILE, 'userId');
const usage = loadMap(USAGE_FILE, 'key');

function persistSubscriptions() {
  saveMap(SUBSCRIPTION_FILE, subscriptions);
}

function persistUsage() {
  saveMap(USAGE_FILE, usage);
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function getPlans() {
  return Object.values(PLANS);
}

export function getSubscription(userId) {
  const existing = subscriptions.get(userId);
  if (existing) return existing;

  const subscription = {
    userId,
    planId: 'free',
    status: 'active',
    startedAt: new Date().toISOString(),
    renewsAt: null
  };

  subscriptions.set(userId, subscription);
  persistSubscriptions();
  return subscription;
}

export function setSubscription(userId, planId) {
  if (!PLANS[planId]) {
    const error = new Error('Invalid plan selected.');
    error.statusCode = 400;
    throw error;
  }

  const subscription = {
    userId,
    planId,
    status: 'active',
    startedAt: new Date().toISOString(),
    renewsAt: planId === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  subscriptions.set(userId, subscription);
  persistSubscriptions();
  return subscription;
}

export function getUsage(userId) {
  const key = `${userId}:${currentMonthKey()}`;
  const existing = usage.get(key) || { key, userId, projects: 0, exports: 0, month: currentMonthKey() };
  usage.set(key, existing);
  persistUsage();
  return existing;
}

export function canCreateProject(userId) {
  const subscription = getSubscription(userId);
  const plan = PLANS[subscription.planId];
  const userUsage = getUsage(userId);

  return {
    allowed: userUsage.projects < plan.limits.projectsPerMonth,
    plan,
    subscription,
    usage: userUsage,
    remainingProjects: Math.max(0, plan.limits.projectsPerMonth - userUsage.projects)
  };
}

export function incrementProjectUsage(userId) {
  const userUsage = getUsage(userId);
  userUsage.projects += 1;
  persistUsage();
  return userUsage;
}

export function incrementExportUsage(userId) {
  const userUsage = getUsage(userId);
  userUsage.exports += 1;
  persistUsage();
  return userUsage;
}
