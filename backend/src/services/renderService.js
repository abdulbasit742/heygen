import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import ffmpegPath from 'ffmpeg-static';
import { createSrt } from './subtitleService.js';
const exec = promisify(execFile);

function ffmpegFilterPath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

function normalizeHex(value, fallback = '#050509') {
  const hex = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback;
}

function ffmpegColor(value, fallback = '#050509') {
  return `0x${normalizeHex(value, fallback).slice(1)}`;
}

function assColor(value, fallback = '#ffffff') {
  const hex = normalizeHex(value, fallback).slice(1);
  const red = hex.slice(0, 2);
  const green = hex.slice(2, 4);
  const blue = hex.slice(4, 6);
  return `&H00${blue}${green}${red}`;
}

function escapeDrawText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function subtitleAlignment(position) {
  return {
    top: 8,
    middle: 5,
    center: 5,
    bottom: 2
  }[String(position || '').toLowerCase()] || 2;
}

function buildSubtitleFilter(srtPath, brandKit = {}) {
  const subtitleStyle = brandKit.subtitleStyle || {};
  const fontSize = Number(subtitleStyle.fontSize || 54);
  const style = [
    `FontSize=${Math.max(24, Math.min(82, fontSize))}`,
    `Alignment=${subtitleAlignment(subtitleStyle.position)}`,
    `PrimaryColour=${assColor(subtitleStyle.textColor)}`,
    'OutlineColour=&H90000000',
    'BackColour=&H90000000',
    'BorderStyle=3',
    'MarginV=92'
  ].join(',');

  return `subtitles='${ffmpegFilterPath(srtPath)}':force_style='${style}'`;
}

function buildWatermarkFilter(brandKit = {}) {
  const watermark = brandKit.watermark || {};
  if (!watermark.enabled || !watermark.text) return null;

  const position = {
    'top-left': 'x=48:y=48',
    'top-right': 'x=w-tw-48:y=48',
    'bottom-left': 'x=48:y=h-th-48',
    'bottom-right': 'x=w-tw-48:y=h-th-48'
  }[watermark.position] || 'x=w-tw-48:y=48';

  return [
    `drawtext=text='${escapeDrawText(watermark.text)}'`,
    'fontcolor=white@0.78',
    'fontsize=42',
    position,
    'box=1',
    'boxcolor=black@0.35',
    'boxborderw=16'
  ].join(':');
}

function buildVideoFilter(srtPath, brandKit = {}, includeWatermark = true) {
  const filters = [buildSubtitleFilter(srtPath, brandKit)];
  const watermarkFilter = includeWatermark ? buildWatermarkFilter(brandKit) : null;
  if (watermarkFilter) filters.push(watermarkFilter);
  return filters.join(',');
}

function brandSnapshot(brandKit = {}) {
  if (!brandKit.id && !brandKit.name) return null;
  return {
    id: brandKit.id,
    name: brandKit.name,
    colors: {
      primary: brandKit.primaryColor,
      secondary: brandKit.secondaryColor,
      accent: brandKit.accentColor
    },
    subtitleStyle: brandKit.subtitleStyle,
    watermark: brandKit.watermark
  };
}

function audioPathFromVoiceover(storageDir, voiceover = {}) {
  if (!voiceover.audioUrl || !voiceover.audioUrl.startsWith('/media/')) return null;
  const fileName = path.basename(voiceover.audioUrl);
  const filePath = path.join(storageDir, fileName);
  return fs.existsSync(filePath) ? filePath : null;
}

function renderDurationSeconds(voiceover = {}) {
  const duration = Number(voiceover.durationSeconds);
  if (!Number.isFinite(duration)) return 12;
  return Math.max(6, Math.min(60, Math.ceil(duration)));
}

function buildRenderArgs({ backgroundColor, duration, srtPath, brandKit, outPath, audioPath, includeWatermark }) {
  return [
    '-y',
    '-f', 'lavfi', '-i', `color=c=${backgroundColor}:s=1080x1920:d=${duration}`,
    ...(audioPath ? ['-i', audioPath] : []),
    '-vf', buildVideoFilter(srtPath, brandKit, includeWatermark),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    ...(audioPath ? ['-c:a', 'aac', '-b:a', '128k', '-shortest'] : []),
    outPath
  ];
}

export async function renderVideo({ script, title, brandKit, voiceover }) {
  const storageDir = process.env.STORAGE_DIR || './storage';
  fs.mkdirSync(storageDir, { recursive: true });
  const id = randomUUID();
  const srtPath = path.join(storageDir, `${id}.srt`);
  const outPath = path.join(storageDir, `${id}.mp4`);
  fs.writeFileSync(srtPath, createSrt(script));
  const backgroundColor = ffmpegColor(brandKit?.primaryColor);
  const audioPath = audioPathFromVoiceover(storageDir, voiceover);
  const duration = renderDurationSeconds(voiceover);
  const renderWarnings = [];

  // MVP render: creates a 9:16 video with subtitles. Replace the lavfi input
  // with avatar footage or generated scene clips for production-grade output.
  try {
    await exec(ffmpegPath || 'ffmpeg', buildRenderArgs({
      backgroundColor,
      duration,
      srtPath,
      brandKit,
      outPath,
      audioPath,
      includeWatermark: true
    }));
  } catch (error) {
    renderWarnings.push(`Watermark filter fallback used: ${error.message}`);
    try {
      await exec(ffmpegPath || 'ffmpeg', buildRenderArgs({
        backgroundColor,
        duration,
        srtPath,
        brandKit,
        outPath,
        audioPath,
        includeWatermark: false
      }));
    } catch (audioError) {
      if (!audioPath) throw audioError;
      renderWarnings.push(`Audio mux fallback used: ${audioError.message}`);
      await exec(ffmpegPath || 'ffmpeg', buildRenderArgs({
        backgroundColor,
        duration,
        srtPath,
        brandKit,
        outPath,
        audioPath: null,
        includeWatermark: false
      }));
    }
  }

  return {
    id,
    title,
    url: `/media/${id}.mp4`,
    subtitles: `/media/${id}.srt`,
    audio: voiceover ? {
      url: voiceover.audioUrl || null,
      muxed: Boolean(audioPath && !renderWarnings.some(warning => warning.startsWith('Audio mux fallback'))),
      codec: audioPath ? 'aac' : null
    } : null,
    durationSeconds: duration,
    brand: brandSnapshot(brandKit),
    renderWarning: renderWarnings.length ? renderWarnings.join(' | ') : null
  };
}
