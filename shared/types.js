/**
 * Shared project types for the AI avatar video generator MVP.
 * These JSDoc types work in plain JavaScript and can later be migrated to TypeScript.
 */

/** @typedef {'draft'|'script_ready'|'rendering'|'completed'|'failed'} ProjectStatus */
/** @typedef {'youtube_shorts'|'instagram_reels'|'tiktok'|'facebook_reels'} ExportPlatform */

/**
 * @typedef {Object} VideoProject
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} prompt
 * @property {ProjectStatus} status
 * @property {string|null} script
 * @property {string|null} voiceUrl
 * @property {string|null} subtitleUrl
 * @property {string|null} outputUrl
 * @property {string} createdAt
 */

/**
 * @typedef {Object} RenderRequest
 * @property {string} projectId
 * @property {string} script
 * @property {string} avatarId
 * @property {ExportPlatform} platform
 * @property {boolean} includeSubtitles
 */

export const VIDEO_SIZES = {
  youtube_shorts: { width: 1080, height: 1920 },
  instagram_reels: { width: 1080, height: 1920 },
  tiktok: { width: 1080, height: 1920 },
  facebook_reels: { width: 1080, height: 1920 }
};
