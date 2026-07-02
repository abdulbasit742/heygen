import crypto from 'crypto';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'audio/mpeg',
  'audio/wav'
]);

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

const mediaItems = [
  {
    id: 'stock_gradient_bg',
    ownerId: 'system',
    name: 'Gradient Creator Background',
    type: 'image/png',
    category: 'background',
    url: '/generated-assets/stock_gradient_bg.png',
    sizeBytes: 420000,
    source: 'stock',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stock_cinematic_broll',
    ownerId: 'system',
    name: 'Cinematic Business B-roll',
    type: 'video/mp4',
    category: 'broll',
    url: '/generated-assets/stock_cinematic_broll.mp4',
    sizeBytes: 9600000,
    source: 'stock',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stock_soft_music',
    ownerId: 'system',
    name: 'Soft Motivation Music',
    type: 'audio/mpeg',
    category: 'music',
    url: '/generated-assets/stock_soft_music.mp3',
    sizeBytes: 2800000,
    source: 'stock',
    createdAt: new Date().toISOString()
  }
];

export function validateMediaInput(input = {}) {
  const name = String(input.name || '').trim();
  const type = String(input.type || '').trim();
  const sizeBytes = Number(input.sizeBytes || 0);

  if (!name) throw new Error('Media name is required.');
  if (!ALLOWED_TYPES.has(type)) throw new Error(`Unsupported media type: ${type}`);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) throw new Error('Valid file size is required.');
  if (sizeBytes > MAX_FILE_SIZE_BYTES) throw new Error('File is too large. Max allowed size is 100MB.');

  return {
    name,
    type,
    sizeBytes,
    category: String(input.category || detectCategory(type)).trim(),
    url: String(input.url || `/generated-assets/${Date.now()}_${name.replace(/[^a-z0-9_.-]/gi, '_')}`).trim()
  };
}

export function detectCategory(type = '') {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'other';
}

export function listMedia({ ownerId, category, type } = {}) {
  return mediaItems.filter(item => {
    const ownerMatch = !ownerId || item.ownerId === ownerId || item.ownerId === 'system';
    const categoryMatch = !category || item.category === category;
    const typeMatch = !type || item.type === type;
    return ownerMatch && categoryMatch && typeMatch;
  });
}

export function addMedia(ownerId, input) {
  const clean = validateMediaInput(input);
  const media = {
    id: crypto.randomUUID(),
    ownerId: ownerId || 'guest',
    ...clean,
    source: input.source || 'user_upload_metadata',
    createdAt: new Date().toISOString()
  };

  mediaItems.unshift(media);
  return media;
}

export function getMediaById(id) {
  return mediaItems.find(item => item.id === id) || null;
}

export function deleteMedia(ownerId, id) {
  const index = mediaItems.findIndex(item => item.id === id && item.ownerId === ownerId);
  if (index === -1) return false;
  mediaItems.splice(index, 1);
  return true;
}
