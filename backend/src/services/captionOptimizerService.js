const PLATFORM_RULES = {
  instagram_reels: {
    maxCaptionLength: 2200,
    hashtagLimit: 30,
    ctas: ['Save this reel', 'Follow for more', 'Share with a creator friend']
  },
  tiktok: {
    maxCaptionLength: 2200,
    hashtagLimit: 12,
    ctas: ['Watch till the end', 'Try this today', 'Follow for part 2']
  },
  youtube_shorts: {
    maxCaptionLength: 5000,
    hashtagLimit: 15,
    ctas: ['Subscribe for more', 'Comment your next topic', 'Save this idea']
  },
  facebook_reels: {
    maxCaptionLength: 63206,
    hashtagLimit: 15,
    ctas: ['Share this with someone', 'Follow the page', 'Comment YES if useful']
  }
};

const BASE_HASHTAGS = [
  'AIVideo',
  'ContentCreator',
  'CreatorTools',
  'OnlineEarning',
  'DigitalMarketing',
  'VideoEditing',
  'FacelessVideos',
  'ReelsTips',
  'SocialMediaGrowth',
  'AIAvatar'
];

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function titleCaseTag(value) {
  return clean(value)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 4)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function generateHooks(topic, tone = 'practical') {
  const subject = clean(topic) || 'AI video creation';

  return [
    `Stop scrolling if you want to improve ${subject}.`,
    `Most creators miss this simple ${subject} trick.`,
    `Here is how to start ${subject} without wasting money.`,
    `This ${tone} method can make your next video better.`,
    `Use this before you create your next reel.`
  ];
}

export function generateHashtags({ topic, niche, platform = 'instagram_reels', customTags = [] } = {}) {
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES.instagram_reels;
  const topicTag = titleCaseTag(topic);
  const nicheTag = titleCaseTag(niche);
  const tags = unique([
    topicTag,
    nicheTag,
    ...customTags.map(tag => clean(tag).replace(/^#/, '')),
    ...BASE_HASHTAGS
  ]);

  return tags.slice(0, rules.hashtagLimit).map(tag => `#${tag}`);
}

export function optimizeCaption(input = {}) {
  const platform = clean(input.platform) || 'instagram_reels';
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES.instagram_reels;
  const topic = clean(input.topic || input.title || input.prompt);
  const tone = clean(input.tone) || 'practical';
  const hook = clean(input.hook) || generateHooks(topic, tone)[0];
  const valueLine = clean(input.valueLine) || `This video gives you a clear next step for ${topic || 'content creation'}.`;
  const cta = clean(input.cta) || rules.ctas[0];
  const hashtags = generateHashtags({
    topic,
    niche: input.niche,
    platform,
    customTags: input.customTags || []
  });

  const caption = [hook, '', valueLine, '', cta, '', hashtags.join(' ')].join('\n');
  const trimmedCaption = caption.length > rules.maxCaptionLength
    ? `${caption.slice(0, rules.maxCaptionLength - 3)}...`
    : caption;

  return {
    platform,
    caption: trimmedCaption,
    hooks: generateHooks(topic, tone),
    ctas: rules.ctas,
    hashtags,
    limits: {
      maxCaptionLength: rules.maxCaptionLength,
      hashtagLimit: rules.hashtagLimit
    },
    score: scoreCaption(trimmedCaption, hashtags)
  };
}

function scoreCaption(caption, hashtags) {
  let score = 50;
  if (caption.length > 80) score += 10;
  if (caption.includes('?')) score += 5;
  if (hashtags.length >= 5) score += 10;
  if (/save|follow|share|comment|subscribe/i.test(caption)) score += 15;
  if (caption.length < 220) score += 10;
  return Math.min(score, 100);
}
