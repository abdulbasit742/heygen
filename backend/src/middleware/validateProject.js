export function validateCreateProject(req, res, next) {
  const {
    title = 'Untitled AI Video',
    prompt,
    platform = 'instagram_reels',
    language = 'English',
    tone = 'cinematic'
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
    return res.status(400).json({
      error: 'Prompt is required and must be at least 10 characters long.'
    });
  }

  const allowedPlatforms = ['youtube_shorts', 'instagram_reels', 'tiktok', 'facebook_reels'];
  if (!allowedPlatforms.includes(platform)) {
    return res.status(400).json({
      error: `Invalid platform. Use one of: ${allowedPlatforms.join(', ')}`
    });
  }

  req.projectInput = {
    title: String(title || 'Untitled AI Video').trim(),
    prompt: prompt.trim(),
    platform,
    language,
    tone,
    templateId: req.body.templateId || null,
    niche: req.body.niche || '',
    sceneCount: Number(req.body.sceneCount || 0) || undefined,
    avatarId: req.body.avatarId || req.body.avatar || 'default_avatar',
    voiceId: req.body.voiceId || req.body.voice || 'default_voice',
    mediaAssetId: req.body.mediaAssetId || null
  };

  next();
}
