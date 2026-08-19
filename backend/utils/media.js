const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');
const { PutObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const r2Client = require('../config/r2');

const BUCKET = process.env.R2_BUCKET;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const IMAGE_VARIANTS = [
  { name: 'thumb', width: 300 },
  { name: 'medium', width: 800 },
  { name: 'large', width: 1600 },
];

const VIDEO_EXTENSIONS = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
};

function keyToUrl(key) {
  return `${PUBLIC_URL}/${key}`;
}

// Only strips keys that live under our own public base URL — a bare key
// (no scheme) is assumed to already be one of ours.
function urlToKey(urlOrKey) {
  if (!urlOrKey) return null;
  if (PUBLIC_URL && urlOrKey.startsWith(PUBLIC_URL)) {
    return urlOrKey.slice(PUBLIC_URL.length).replace(/^\//, '');
  }
  if (/^https?:\/\//i.test(urlOrKey)) return null;
  return urlOrKey;
}

async function uploadImage(buffer, folder) {
  if (!buffer || buffer.length === 0) throw new Error('No image data provided');
  if (buffer.length > MAX_IMAGE_SIZE) throw new Error('Image exceeds 10MB limit');

  let metadata;
  try {
    metadata = await sharp(buffer, { failOn: 'none' }).rotate().metadata();
  } catch {
    throw new Error('File is not a valid image');
  }
  if (!metadata.width || !metadata.height) throw new Error('File is not a valid image');

  const id = crypto.randomUUID();
  const urls = {};

  for (const variant of IMAGE_VARIANTS) {
    const variantBuffer = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({ width: variant.width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const key = `${folder}/${id}-${variant.name}.webp`;
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: variantBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    urls[variant.name] = keyToUrl(key);
  }

  return urls;
}

async function uploadVideo(buffer, folder, mimetype, originalname) {
  if (!buffer || buffer.length === 0) throw new Error('No video data provided');
  if (buffer.length > MAX_VIDEO_SIZE) throw new Error('Video exceeds 50MB limit');

  const ext = VIDEO_EXTENSIONS[mimetype] || path.extname(originalname || '').replace('.', '') || 'mp4';
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;

  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype || 'application/octet-stream',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return keyToUrl(key);
}

async function deleteMedia(urls) {
  const keys = (Array.isArray(urls) ? urls : [urls])
    .filter(Boolean)
    .map(urlToKey)
    .filter(Boolean);
  if (keys.length === 0) return;

  await r2Client.send(new DeleteObjectsCommand({
    Bucket: BUCKET,
    Delete: { Objects: keys.map(Key => ({ Key })) },
  }));
}

module.exports = { uploadImage, uploadVideo, deleteMedia, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE };
