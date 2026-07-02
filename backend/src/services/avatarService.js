export const AVATAR_PRESETS = [
  {
    id: 'studio_presenter',
    name: 'Studio Presenter',
    type: 'talking_avatar',
    languageSupport: ['English', 'Urdu', 'Hindi'],
    style: 'clean studio background',
    defaultVoice: 'calm_male',
    thumbnail: '/avatars/studio_presenter.svg'
  },
  {
    id: 'business_host',
    name: 'Business Host',
    type: 'talking_avatar',
    languageSupport: ['English', 'Arabic'],
    style: 'professional office background',
    defaultVoice: 'professional_male',
    thumbnail: '/avatars/business_host.svg'
  },
  {
    id: 'creator_female',
    name: 'Creator Female',
    type: 'talking_avatar',
    languageSupport: ['English', 'Hindi'],
    style: 'bright social media creator setup',
    defaultVoice: 'energetic_female',
    thumbnail: '/avatars/creator_female.svg'
  },
  {
    id: 'faceless_broll',
    name: 'Faceless B-roll',
    type: 'faceless_video',
    languageSupport: ['English', 'Urdu', 'Hindi', 'Arabic'],
    style: 'stock clips, motion graphics, captions',
    defaultVoice: 'urdu_narrator',
    thumbnail: '/avatars/faceless_broll.svg'
  }
];

export function listAvatars({ language, type } = {}) {
  return AVATAR_PRESETS.filter(avatar => {
    const matchesLanguage = !language || avatar.languageSupport.includes(language);
    const matchesType = !type || avatar.type === type;
    return matchesLanguage && matchesType;
  });
}

export function getAvatarById(id) {
  return AVATAR_PRESETS.find(avatar => avatar.id === id) || null;
}

export function buildAvatarJob({ avatarId, script, voice, resolution = '1080x1920' }) {
  const avatar = getAvatarById(avatarId);
  if (!avatar) {
    throw new Error('Avatar preset not found.');
  }

  return {
    jobType: avatar.type,
    avatar,
    script,
    voice: voice || avatar.defaultVoice,
    resolution,
    lipSync: avatar.type === 'talking_avatar',
    safety: {
      requiresUserOwnedAvatarConsent: true,
      allowsImpersonation: false,
      allowsPoliticalDeepfake: false
    },
    createdAt: new Date().toISOString()
  };
}
