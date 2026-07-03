const DEFAULT_SCENE_COUNT = 5;

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function splitIntoScenes(script, maxScenes = DEFAULT_SCENE_COUNT) {
  const sentences = cleanText(script)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  if (!sentences.length) return [];

  const scenes = [];
  for (let index = 0; index < Math.min(maxScenes, sentences.length); index += 1) {
    const sentence = sentences[index];
    scenes.push({
      order: index + 1,
      narration: sentence,
      visualPrompt: `Vertical creator video scene: ${sentence}`,
      subtitle: sentence.length > 72 ? `${sentence.slice(0, 69)}...` : sentence,
      durationSeconds: Math.max(4, Math.min(8, Math.ceil(sentence.length / 18)))
    });
  }

  return scenes;
}

function createFallbackScript(prompt, tone = 'motivational') {
  const topic = cleanText(prompt) || 'building a better online business';
  const toneLine = {
    professional: 'Here is the clear plan.',
    educational: 'Here is the simple explanation.',
    friendly: 'Here is a helpful way to think about it.'
  }[tone] || 'Here is the truth you need today.';

  return `${toneLine} ${topic} starts with one focused decision. Stop waiting for perfect conditions. Pick one useful skill, create one valuable piece of content, and publish it today. Improve the next version using real feedback. Repeat this process daily, because consistency turns small actions into trust, audience, and income.`;
}

export async function generateVideoScript(input = {}) {
  const title = cleanText(input.title) || 'AI Generated Video';
  const prompt = cleanText(input.prompt);
  const tone = cleanText(input.tone) || 'motivational';
  const platform = cleanText(input.platform) || 'instagram_reels';
  const sceneCount = input.sceneCount || input.template?.sceneCount || DEFAULT_SCENE_COUNT;
  const script = cleanText(input.script) || createFallbackScript(prompt, tone);
  const scenes = splitIntoScenes(script, sceneCount);
  const totalDurationSeconds = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);

  return {
    title,
    platform,
    tone,
    hook: scenes[0]?.narration || title,
    script,
    scenes,
    captions: [
      `${title} - save this and start today.`,
      `Your next step: ${prompt || 'create one useful video today'}.`,
      'Follow for more AI creator tools and online earning ideas.'
    ],
    hashtags: ['#AIVideo', '#ContentCreator', '#Reels', '#OnlineEarning', '#CreatorTools'],
    totalDurationSeconds,
    generatedAt: new Date().toISOString()
  };
}
