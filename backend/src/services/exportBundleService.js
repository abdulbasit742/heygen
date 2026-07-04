import fs from 'fs';
import path from 'path';

const CRC_TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i += 1) {
  let value = i;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[i] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function normalizeEntryName(value) {
  return String(value || 'file')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .filter(part => part && part !== '.' && part !== '..')
    .join('/') || 'file';
}

function safeFilePart(value, fallback = 'file') {
  return String(value || fallback)
    .replace(/[^a-z0-9_.-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 96) || fallback;
}

function slug(value, fallback = 'project') {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64) || fallback;
}

function storageRoot() {
  return path.resolve(process.env.STORAGE_DIR || path.join(process.cwd(), 'storage'));
}

function generatedAssetsRoot() {
  return path.resolve(process.cwd(), 'generated-assets');
}

function pathnameFromUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    if (/^https?:\/\//i.test(raw)) return new URL(raw).pathname;
  } catch {
    return '';
  }

  return raw.split(/[?#]/)[0];
}

function decodePathPart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolvePublicFile(url) {
  const pathname = decodePathPart(pathnameFromUrl(url));
  const roots = [
    { prefix: '/media/', root: storageRoot() },
    { prefix: '/generated-assets/', root: generatedAssetsRoot() }
  ];
  const match = roots.find(item => pathname.startsWith(item.prefix));
  if (!match) return null;

  const relativeName = pathname.slice(match.prefix.length).replace(/\0/g, '');
  const filePath = path.resolve(match.root, relativeName);
  const relative = path.relative(match.root, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return fs.existsSync(filePath) ? filePath : null;
}

function uniqueEntryName(name, usedNames) {
  const normalized = normalizeEntryName(name);
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized);
    return normalized;
  }

  const directory = path.posix.dirname(normalized);
  const extension = path.posix.extname(normalized);
  const base = path.posix.basename(normalized, extension);
  let index = 2;
  let nextName = normalized;

  while (usedNames.has(nextName)) {
    const fileName = `${base}-${index}${extension}`;
    nextName = directory === '.' ? fileName : `${directory}/${fileName}`;
    index += 1;
  }

  usedNames.add(nextName);
  return nextName;
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { time, date } = dosDateTime();

  for (const entry of entries) {
    const nameBuffer = Buffer.from(normalizeEntryName(entry.name));
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data || ''), 'utf8');
    const checksum = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function captionsText(project) {
  const caption = project.captionResult;
  if (!caption) return '';

  return [
    caption.caption,
    '',
    caption.hashtags?.join(' '),
    '',
    caption.ctas?.length ? `CTAs: ${caption.ctas.join(', ')}` : '',
    caption.score ? `Score: ${caption.score}` : ''
  ].filter(Boolean).join('\n');
}

function scriptText(project) {
  return project.script || project.scriptResult?.script || '';
}

export function createProjectBundle(project, packagePayload) {
  const usedNames = new Set();
  const skippedFiles = [];
  const entries = [];

  function addText(name, value) {
    if (!value) return;
    entries.push({
      name: uniqueEntryName(name, usedNames),
      data: Buffer.from(String(value), 'utf8')
    });
  }

  function addJson(name, value) {
    addText(name, JSON.stringify(value, null, 2));
  }

  function addFromUrl(url, entryName) {
    if (!url) return;
    const filePath = resolvePublicFile(url);
    if (!filePath) {
      skippedFiles.push(url);
      return;
    }

    entries.push({
      name: uniqueEntryName(entryName, usedNames),
      data: fs.readFileSync(filePath)
    });
  }

  addJson('project-package.json', packagePayload);
  addText('script.txt', scriptText(project));
  addText('captions.txt', captionsText(project));

  addFromUrl(project.outputUrl, `export/${safeFilePart(path.posix.basename(pathnameFromUrl(project.outputUrl)), 'video.mp4')}`);
  addFromUrl(project.subtitlesUrl, `export/${safeFilePart(path.posix.basename(pathnameFromUrl(project.subtitlesUrl)), 'subtitles.srt')}`);

  const voiceover = project.voiceover || {};
  addFromUrl(voiceover.audioUrl || project.exportMetadata?.voiceoverUrl, `voiceover/${safeFilePart(path.posix.basename(pathnameFromUrl(voiceover.audioUrl || project.exportMetadata?.voiceoverUrl)), 'voiceover.wav')}`);
  addFromUrl(voiceover.manifestUrl || project.exportMetadata?.voiceoverManifestUrl, `voiceover/${safeFilePart(path.posix.basename(pathnameFromUrl(voiceover.manifestUrl || project.exportMetadata?.voiceoverManifestUrl)), 'voiceover.json')}`);

  const visualAssets = project.visualAssets || project.productionPack?.visualAssets || [];
  visualAssets.forEach((asset, index) => {
    const order = String(asset.sceneOrder || index + 1).padStart(2, '0');
    addFromUrl(asset.imageUrl, `scenes/${order}_${safeFilePart(asset.fileName || path.posix.basename(pathnameFromUrl(asset.imageUrl)), 'scene.svg')}`);
    addFromUrl(asset.assetUrl, `scenes/${order}_${safeFilePart(asset.manifestFileName || path.posix.basename(pathnameFromUrl(asset.assetUrl)), 'scene.json')}`);
  });

  addJson('bundle-manifest.json', {
    projectId: project.id,
    title: project.title,
    generatedAt: new Date().toISOString(),
    files: entries.map(entry => entry.name),
    skippedFiles
  });

  const fileName = `${slug(project.title)}_${String(project.id).slice(0, 8)}_export_bundle.zip`;
  return {
    fileName: safeFilePart(fileName, `project_${project.id}_export_bundle.zip`),
    fileCount: entries.length,
    buffer: createZip(entries)
  };
}
