// One-time migration: finds product images, gallery images, and the flash
// sale banner that still point at Cloudinary (image_url/file_url set, but
// no R2 variants yet), downloads each one, runs it through uploadImage() to
// produce R2 webp variants, and saves the new URLs. The original Cloudinary
// URL column is left untouched — nothing is deleted from Cloudinary.
//
// Videos are NOT migrated: uploadVideo() does no transcoding, so re-hosting
// an existing video on R2 gains nothing worth the bandwidth.
//
// This script is NOT run automatically. Run it manually after deploying the
// R2 changes:
//   node scripts/migrateCloudinaryToR2.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = require('../backend/db');
const { uploadImage } = require('../backend/utils/media');

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
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
  await migrateFlashSaleBanner();
  await pool.end();
  console.log('Migration complete');
}

run().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
