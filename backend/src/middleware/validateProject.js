export function validateCreateProject(req, res, next) {
  const { prompt, platform = 'instagram_reels', language = 'en' } = req.body || {};

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
    prompt: prompt.trim(),
    platform,
    language,
    avatarId: req.body.avatarId || 'default_avatar',
    voiceId: req.body.voiceId || 'default_voice'
  };

  next();
}
