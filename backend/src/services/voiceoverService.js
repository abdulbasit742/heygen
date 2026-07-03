import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import ffmpegPath from 'ffmpeg-static';

const exec = promisify(execFile);

export const VOICE_PRESETS = [
  {
    id: 'calm_male',
    name: 'Calm Male',
    provider: 'mock-tts',
    languageSupport: ['English', 'Urdu', 'Hindi'],
    pitchHz: 190,
    style: 'warm narration'
  },
  {
    id: 'energetic_female',
    name: 'Energetic Female',
    provider: 'mock-tts',
    languageSupport: ['English', 'Hindi'],
    pitchHz: 260,
    style: 'bright creator delivery'
  },
  {
    id: 'urdu_narrator',
    name: 'Urdu Narrator',
    provider: 'mock-tts',
    languageSupport: ['Urdu', 'Hindi', 'English'],
    pitchHz: 220,
    style: 'clear South Asian narration'
  },
  {
    id: 'professional_male',
    name: 'Professional Male',
    provider: 'mock-tts',
    languageSupport: ['English', 'Arabic'],
    pitchHz: 175,
    style: 'business presentation'
  }
];

function ensureStorageDir() {
  const storageDir = process.env.STORAGE_DIR || './storage';
  fs.mkdirSync(storageDir, { recursive: true });
  return storageDir;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function clampDuration(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return 8;
  return Math.max(3, Math.min(45, Math.ceil(value)));
}

export function listVoices({ language } = {}) {
  return VOICE_PRESETS.filter(voice => !language || voice.languageSupport.includes(language));
}

export function getVoiceById(id) {
  return VOICE_PRESETS.find(voice => voice.id === id) || VOICE_PRESETS[0];
}

export async function generateVoiceover({
  script,
  voiceId = 'calm_male',
  language = 'English',
  durationSeconds,
  title
} = {}) {
  const voice = getVoiceById(voiceId);
  const storageDir = ensureStorageDir();
  const id = randomUUID();
  const audioFileName = `${id}.wav`;
  const manifestFileName = `${id}.voice.json`;
  const audioPath = path.join(storageDir, audioFileName);
  const manifestPath = path.join(storageDir, manifestFileName);
  const duration = clampDuration(durationSeconds || cleanText(script).length / 18);

  await exec(ffmpegPath || 'ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `sine=frequency=${voice.pitchHz}:duration=${duration}:sample_rate=44100`,
    '-filter:a', 'volume=0.12,afade=t=in:st=0:d=0.2,afade=t=out:st=' + Math.max(0, duration - 0.4) + ':d=0.4',
    audioPath
  ]);

  const manifest = {
    id,
    provider: 'mock-tts',
    providerStatus: process.env.ELEVENLABS_API_KEY ? 'external-key-detected' : 'mock-mode',
    title: cleanText(title) || 'Voiceover',
    voice,
    language,
    durationSeconds: duration,
    audioUrl: `/media/${audioFileName}`,
    manifestUrl: `/media/${manifestFileName}`,
    scriptPreview: cleanText(script).slice(0, 280),
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifest;
}
