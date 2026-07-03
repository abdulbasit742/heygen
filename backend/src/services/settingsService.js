import { loadMap, saveMap } from './jsonFileStore.js';

const DEFAULT_SETTINGS = {
  appName: 'AI Avatar Video Studio',
  defaultLanguage: 'English',
  defaultPlatform: 'instagram_reels',
  watermarkEnabled: true,
  safetyMode: true,
  maxVideoSeconds: 60,
  maxDailyRendersFree: 5,
  providers: {
    script: 'mock-gpt',
    voice: 'mock-tts',
    avatar: 'mock-avatar-renderer',
    storage: 'local'
  },
  blockedFeatures: [
    'fake-account-automation',
    'spam-engagement-bots',
    'platform-limit-bypass'
  ],
  updatedAt: new Date().toISOString()
};

const STORE_FILE = 'settings.json';
const settingsByUser = loadMap(STORE_FILE, 'userId');

function persistSettings() {
  saveMap(STORE_FILE, settingsByUser);
}

function normalizeBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function normalizeNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

export function getSettings(userId = 'global') {
  if (!settingsByUser.has(userId)) {
    settingsByUser.set(userId, { ...DEFAULT_SETTINGS, userId });
    persistSettings();
  }

  return settingsByUser.get(userId);
}

export function updateSettings(userId = 'global', input = {}) {
  const current = getSettings(userId);
  const next = {
    ...current,
    appName: input.appName || current.appName,
    defaultLanguage: input.defaultLanguage || current.defaultLanguage,
    defaultPlatform: input.defaultPlatform || current.defaultPlatform,
    watermarkEnabled: normalizeBoolean(input.watermarkEnabled, current.watermarkEnabled),
    safetyMode: normalizeBoolean(input.safetyMode, current.safetyMode),
    maxVideoSeconds: normalizeNumber(input.maxVideoSeconds, current.maxVideoSeconds, 10, 180),
    maxDailyRendersFree: normalizeNumber(input.maxDailyRendersFree, current.maxDailyRendersFree, 1, 100),
    providers: {
      ...current.providers,
      ...(input.providers || {})
    },
    updatedAt: new Date().toISOString()
  };

  settingsByUser.set(userId, next);
  persistSettings();
  return next;
}

export function getProviderStatus() {
  return {
    script: {
      name: 'Script Generator',
      status: process.env.OPENAI_API_KEY ? 'configured' : 'mock-mode',
      envKey: 'OPENAI_API_KEY'
    },
    voice: {
      name: 'Voice Generator',
      status: process.env.ELEVENLABS_API_KEY ? 'configured' : 'mock-mode',
      envKey: 'ELEVENLABS_API_KEY'
    },
    storage: {
      name: 'Storage',
      status: process.env.S3_BUCKET ? 'cloud-configured' : 'local-mode',
      envKey: 'S3_BUCKET'
    }
  };
}

export function resetSettings(userId = 'global') {
  const reset = { ...DEFAULT_SETTINGS, userId, updatedAt: new Date().toISOString() };
  settingsByUser.set(userId, reset);
  persistSettings();
  return reset;
}
