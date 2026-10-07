// Media upload rules — mirror the backend whitelist (backend uploadSingle): no SVG.
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(',');
export const MAX_IMAGE = 15 * 1024 * 1024;
export const MAX_VIDEO = 40 * 1024 * 1024;

const BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

export const FOLDERS = [
  { value: 'product', label: 'Product images' },
  { value: 'bead', label: 'Bead images' },
  { value: 'category', label: 'Category images' },
  { value: 'banner', label: 'Banners' },
  { value: 'blog', label: 'Blog images' },
  { value: 'studio', label: 'Studio' },
  { value: 'purpose', label: 'Purpose' },
  { value: 'logo', label: 'Logos' },
  { value: 'other', label: 'Other' },
];

export function folderLabel(value) {
  return FOLDERS.find((f) => f.value === value)?.label || value || 'Other';
}

/** Same normalisation as the server: lower-case [a-z0-9_-], max 40, empty → other. */
export function normalizeFolder(raw) {
  const v = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 40);
  return v && v !== 'all' ? v : 'other';
}

export function fileType(file) {
  if (file?.type) return file.type;
  const ext = String(file?.name || '').split('.').pop().toLowerCase();
  return BY_EXT[ext] || '';
}

export function isVideoType(type = '') {
  return String(type).startsWith('video/');
}

/** Returns an error message, or null when the file can be uploaded. */
export function validateFile(file) {
  const type = fileType(file);
  if (type === 'image/svg+xml') return 'SVG files are not allowed. Use PNG or WebP.';
  if (IMAGE_TYPES.includes(type)) return file.size > MAX_IMAGE ? `Too large (${formatBytes(file.size)}). Images can be up to 15 MB.` : null;
  if (VIDEO_TYPES.includes(type)) return file.size > MAX_VIDEO ? `Too large (${formatBytes(file.size)}). Videos can be up to 40 MB.` : null;
  return 'Unsupported file type. Use JPEG, PNG, WebP, GIF, AVIF, MP4, WebM or MOV.';
}

export function formatBytes(n) {
  const v = Number(n) || 0;
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(v < 10 * 1024 ? 1 : 0)} KB`;
  return `${(v / (1024 * 1024)).toFixed(1)} MB`;
}

export function mediaKind(item) {
  if (isVideoType(item?.mimeType)) return 'video';
  return /\.(mp4|webm|mov)(\?|$)/i.test(item?.url || '') ? 'video' : 'image';
}
