const TEMPLATES = [
  {
    id: 'motivation_reel',
    name: 'Motivation Reel',
    category: 'creator',
    platform: 'instagram_reels',
    tone: 'cinematic',
    title: 'Daily Discipline Reel',
    prompt: 'Create a short motivational avatar video about discipline, focus, and building success through consistent daily action.',
    niche: 'personal growth',
    sceneCount: 5
  },
  {
    id: 'product_ad',
    name: 'Product Ad',
    category: 'commerce',
    platform: 'tiktok',
    tone: 'friendly',
    title: 'Product Demo Ad',
    prompt: 'Create a short product ad that opens with a pain point, shows the product benefit, gives proof, and ends with a clear call to action.',
    niche: 'ecommerce',
    sceneCount: 5
  },
  {
    id: 'explainer_short',
    name: 'Explainer Short',
    category: 'education',
    platform: 'youtube_shorts',
    tone: 'educational',
    title: 'Simple Explainer Video',
    prompt: 'Create a short educational avatar video that explains one useful idea in simple steps with a practical takeaway.',
    niche: 'education',
    sceneCount: 6
  },
  {
    id: 'agency_pitch',
    name: 'Agency Pitch',
    category: 'business',
    platform: 'instagram_reels',
    tone: 'professional',
    title: 'Agency Offer Pitch',
    prompt: 'Create a concise agency pitch video that states the client problem, explains the service, shows the outcome, and invites a consultation.',
    niche: 'marketing agency',
    sceneCount: 5
  }
];

export function listTemplates() {
  return TEMPLATES;
}

export function getTemplate(templateId) {
  return TEMPLATES.find(template => template.id === templateId) || null;
}

export function applyTemplate(input = {}) {
  const template = getTemplate(input.templateId);
  if (!template) return input;

  return {
    ...input,
    title: input.title || template.title,
    prompt: input.prompt || template.prompt,
    platform: input.platform || template.platform,
    tone: input.tone || template.tone,
    niche: input.niche || template.niche,
    sceneCount: input.sceneCount || template.sceneCount,
    template
  };
}
