// One-time migration: finds product images, gallery images, and the flash
// sale banner that still point at Cloudinary (image_url/file_url set, but
// no R2 variants yet), downloads each one, runs it through uploadImage() to
// produce R2 webp variants, and saves the new URLs. The original Cloudinary
// URL column is left untouched — nothing is deleted from Cloudinary.
//
// Gallery videos are re-hosted on R2 as-is and their file_url is replaced.
// Public Cloudinary delivery has since started returning 401 for every
// asset, so when a plain download fails we retry through a signed Admin API
// download URL (needs CLOUDINARY_* credentials in backend/.env).
//
// This script is NOT run automatically. Run it manually after deploying the
// R2 changes:
//   node scripts/migrateCloudinaryToR2.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = require('../backend/db');
const { uploadImage, uploadVideo } = require('../backend/utils/media');
const { cloudinary } = require('../backend/middleware/upload');

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`);
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type'),
  };
}

// Recovers the public_id/format/resource type from a delivery URL such as
// https://res.cloudinary.com/<cloud>/video/upload/v123/folder/name.mp4
function parseCloudinaryUrl(url) {
  const m = /res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)\.(\w+)$/.exec(url);
  return m ? { resourceType: m[1], publicId: m[2], format: m[3] } : null;
}

async function downloadBuffer(url) {
  try {
    return (await fetchBuffer(url)).buffer;
  } catch (err) {
    const parsed = parseCloudinaryUrl(url);
    if (!parsed) throw err;
    const signed = cloudinary.utils.private_download_url(parsed.publicId, parsed.format, {
      resource_type: parsed.resourceType,
      type: 'upload',
    });
    try {
      return (await fetchBuffer(signed)).buffer;
    } catch (signedErr) {
      throw new Error(`${err.message}; signed download also failed: ${signedErr.message}`);
    }
  }
}

async function migrateProductImages() {
  const { rows } = await pool.query(
    `SELECT id, image_url FROM product_images WHERE image_url IS NOT NULL AND image_thumb IS NULL`
  );
  console.log(`[products] ${rows.length} image(s) to migrate`);

  for (const row of rows) {
    try {
      const buffer = await downloadBuffer(row.image_url);
      const { thumb, medium, large } = await uploadImage(buffer, 'norahairline/products');
      await pool.query(
        `UPDATE product_images SET image_thumb = $1, image_medium = $2, image_large = $3 WHERE id = $4`,
        [thumb, medium, large, row.id]
      );
      console.log(`[products] migrated image ${row.id}`);
    } catch (err) {
      console.error(`[products] FAILED image ${row.id}: ${err.message}`);
    }
  }
}

async function migrateGalleryImages() {
  const { rows } = await pool.query(
    `SELECT id, file_url FROM gallery_items WHERE media_type = 'image' AND file_url IS NOT NULL AND file_thumb IS NULL`
  );
  console.log(`[gallery] ${rows.length} image(s) to migrate`);

  for (const row of rows) {
    try {
      const buffer = await downloadBuffer(row.file_url);
      const { thumb, medium, large } = await uploadImage(buffer, 'norahairline/gallery');
      await pool.query(
        `UPDATE gallery_items SET file_thumb = $1, file_medium = $2, file_large = $3 WHERE id = $4`,
        [thumb, medium, large, row.id]
      );
      console.log(`[gallery] migrated item ${row.id}`);
    } catch (err) {
      console.error(`[gallery] FAILED item ${row.id}: ${err.message}`);
    }
  }
}

const VIDEO_MIMETYPES = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };

async function migrateGalleryVideos() {
  const { rows } = await pool.query(
    `SELECT id, file_url FROM gallery_items WHERE media_type = 'video' AND file_url LIKE '%res.cloudinary.com%'`
  );
  console.log(`[gallery] ${rows.length} video(s) to migrate`);

  for (const row of rows) {
    try {
      const buffer = await downloadBuffer(row.file_url);
      const ext = (row.file_url.split('.').pop() || 'mp4').toLowerCase();
      const url = await uploadVideo(buffer, 'norahairline/gallery', VIDEO_MIMETYPES[ext] || 'video/mp4', `video.${ext}`);
      // cloudinary_public_id is kept so deleting the item still cleans up Cloudinary
      await pool.query(`UPDATE gallery_items SET file_url = $1 WHERE id = $2`, [url, row.id]);
      console.log(`[gallery] migrated video ${row.id}`);
    } catch (err) {
      console.error(`[gallery] FAILED video ${row.id}: ${err.message}`);
    }
  }
}

async function migrateFlashSaleBanner() {
  const { rows } = await pool.query(
    `SELECT id, banner_image_url FROM flash_sale_settings
     WHERE banner_image_url IS NOT NULL AND banner_image_thumb IS NULL`
  );
  console.log(`[banner] ${rows.length} banner(s) to migrate`);

  for (const row of rows) {
    try {
      const buffer = await downloadBuffer(row.banner_image_url);
      const { thumb, medium, large } = await uploadImage(buffer, 'norahairline/banners');
      await pool.query(
        `UPDATE flash_sale_settings SET banner_image_thumb = $1, banner_image_medium = $2, banner_image_large = $3 WHERE id = $4`,
        [thumb, medium, large, row.id]
      );
      console.log(`[banner] migrated banner ${row.id}`);
    } catch (err) {
      console.error(`[banner] FAILED banner ${row.id}: ${err.message}`);
    }
  }
}

async function run() {
  await migrateProductImages();
  await migrateGalleryImages();
  await migrateGalleryVideos();
  await migrateFlashSaleBanner();
  await pool.end();
  console.log('Migration complete');
}

run().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
