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

export async function renderVideo({ script, title }) {
  const storageDir = process.env.STORAGE_DIR || './storage';
  fs.mkdirSync(storageDir, { recursive: true });
  const id = randomUUID();
  const srtPath = path.join(storageDir, `${id}.srt`);
  const outPath = path.join(storageDir, `${id}.mp4`);
  fs.writeFileSync(srtPath, createSrt(script));

  // MVP render: creates a 9:16 video with subtitles. Replace the lavfi input
  // with avatar footage or generated scene clips for production-grade output.
  await exec(ffmpegPath || 'ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', 'color=c=black:s=1080x1920:d=12',
    '-vf', `subtitles='${ffmpegFilterPath(srtPath)}':force_style='FontSize=48,Alignment=10'`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', outPath
  ]);
  return { id, title, url: `/media/${id}.mp4`, subtitles: `/media/${id}.srt` };
}
