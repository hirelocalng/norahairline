const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const { cloudinary, handleUpload, handleBannerUpload, handleGalleryUpload } = require('../middleware/upload');
const { uploadImage, uploadVideo, deleteMedia } = require('../utils/media');
const { sendStatusUpdate } = require('../services/email');
const { sendNewProductNotification, sendFlashSaleNotification } = require('../services/notifications');
const { loginLimiter, adminLimiter } = require('../middleware/security');
const { cleanLine, cleanText, isEmail, toPositiveInt, toPrice } = require('../utils/validate');

router.use(adminLimiter);

// Every :id in this router must be a positive integer; anything else is a 404
// rather than a Postgres "invalid input syntax" 500.
router.param('id', (req, res, next, value) => {
  const id = toPositiveInt(value);
  if (!id) return res.status(404).json({ error: 'Not found' });
  req.params.id = id;
  next();
});

// Shared validation for product create/update (multipart fields arrive as strings).
function parseProductFields(body) {
  const name = cleanLine(body.name, 200);
  const price = toPrice(body.price);
  const hasOriginal = body.original_price !== undefined && body.original_price !== '' && body.original_price !== 'null';
  const originalPrice = hasOriginal ? toPrice(body.original_price) : null;
  const category = cleanLine(body.category, 100);
  const description = cleanText(body.description, 5000);

  if (!name || !category) return { error: 'Name, price, and category are required' };
  if (price === null) return { error: 'Price must be a positive number' };
  if (hasOriginal && originalPrice === null) return { error: 'Original price must be a positive number' };
  return { name, price, originalPrice, category, description, available: body.available !== 'false' };
}

// product_images select shared by every route that returns a product's images —
// image_url/thumb/medium/large all fall back to the legacy Cloudinary image_url
// column so pre-migration products keep rendering.
const PRODUCT_IMAGES_SELECT = `
  SELECT id, product_id, is_primary, created_at, cloudinary_public_id,
    COALESCE(image_thumb, image_url) AS image_thumb,
    COALESCE(image_medium, image_url) AS image_medium,
    COALESCE(image_large, image_url) AS image_large,
    COALESCE(image_medium, image_url) AS image_url
  FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC
`;

// POST /api/admin/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = cleanLine(req.body?.email, 254).toLowerCase();
    const password = req.body?.password;

    if (!isEmail(email) || typeof password !== 'string' || !password || password.length > 200) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE LOWER(email) = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      console.warn(`[auth] failed admin login for ${email} from ${req.ip}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Everything below requires a valid admin token. Routes also name
// authenticateAdmin individually; this guard covers any added later.
router.use(authenticateAdmin);

// POST /api/admin/change-password
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8 || newPassword.length > 200) {
      return res.status(400).json({ error: 'New password must be between 8 and 200 characters' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, req.admin.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/admin/dashboard - stats
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM products');
    const availableResult = await pool.query('SELECT COUNT(*) FROM products WHERE available = true');
    const categoryResult = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM products
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      total: parseInt(totalResult.rows[0].count),
      available: parseInt(availableResult.rows[0].count),
      byCategory: categoryResult.rows
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/products - all products (including unavailable)
router.get('/products', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(pi.image_thumb, pi.image_url) AS primary_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/admin/products/:id - single product with all images
router.get('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const imagesResult = await pool.query(PRODUCT_IMAGES_SELECT, [id]);

    res.json({ ...productResult.rows[0], images: imagesResult.rows });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/admin/products - create product
router.post('/products', authenticateAdmin, handleUpload, async (req, res) => {
  const fields = parseProductFields(req.body);
  if (fields.error) return res.status(400).json({ error: fields.error });
  const { name, price, originalPrice, category, description, available } = fields;

  const imageFiles = req.files?.images || [];
  const videoFile = req.files?.video?.[0] || null;

  // Upload media to R2 before touching the DB
  let videoUrl = null;
  const uploadedImages = [];
  try {
    if (videoFile) {
      videoUrl = await uploadVideo(videoFile.buffer, 'norahairline/products', videoFile.mimetype, videoFile.originalname);
    }
    for (const file of imageFiles) {
      uploadedImages.push(await uploadImage(file.buffer, 'norahairline/products'));
    }
  } catch (err) {
    console.error('Media upload error:', err);
    return res.status(400).json({ error: err.message || 'Failed to process uploaded media' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const productResult = await client.query(
      `INSERT INTO products (name, price, original_price, category, description, available, video_url, video_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL) RETURNING *`,
      [name, price, originalPrice, category, description, available, videoUrl]
    );

    const product = productResult.rows[0];

    for (let i = 0; i < uploadedImages.length; i++) {
      const { thumb, medium, large } = uploadedImages[i];
      await client.query(
        `INSERT INTO product_images (product_id, image_url, cloudinary_public_id, image_thumb, image_medium, image_large, is_primary)
         VALUES ($1, $2, NULL, $3, $4, $5, $6)`,
        [product.id, medium, thumb, medium, large, i === 0]
      );
    }

    await client.query('COMMIT');

    const imagesResult = await pool.query(PRODUCT_IMAGES_SELECT, [product.id]);

    res.status(201).json({ ...product, images: imagesResult.rows });

    // Send push notification (non-blocking, after response)
    console.log('[Admin] Product created, firing push notification for:', product.name);
    sendNewProductNotification(product.name).catch(err => {
      console.error('[Admin] Push notification failed for new product:', err.message);
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    client?.release();
  }
});

// PUT /api/admin/products/:id - update product
router.put('/products/:id', authenticateAdmin, handleUpload, async (req, res) => {
  const { id } = req.params;
  const { deleteImageIds, deleteVideo } = req.body;
  const fields = parseProductFields(req.body);
  if (fields.error) return res.status(400).json({ error: fields.error });
  const { name, price, originalPrice, category, description, available } = fields;

  const imageFiles = req.files?.images || [];
  const videoFile = req.files?.video?.[0] || null;
  const setVideoNull = deleteVideo === 'true';

  let idsToDelete = [];
  if (deleteImageIds) {
    try { idsToDelete = JSON.parse(deleteImageIds); }
    catch { return res.status(400).json({ error: 'Invalid deleteImageIds format' }); }
    if (!Array.isArray(idsToDelete) || !idsToDelete.every(v => toPositiveInt(v))) {
      return res.status(400).json({ error: 'Invalid deleteImageIds format' });
    }
  }

  // Upload media to R2 before touching the DB
  let newVideoUrl = null;
  const uploadedImages = [];
  try {
    if (videoFile) {
      newVideoUrl = await uploadVideo(videoFile.buffer, 'norahairline/products', videoFile.mimetype, videoFile.originalname);
    }
    for (const file of imageFiles) {
      uploadedImages.push(await uploadImage(file.buffer, 'norahairline/products'));
    }
  } catch (err) {
    console.error('Media upload error:', err);
    return res.status(400).json({ error: err.message || 'Failed to process uploaded media' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const oldProductResult = await client.query('SELECT video_public_id, video_url FROM products WHERE id=$1', [id]);
    if (oldProductResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }
    const oldVideoPublicId = oldProductResult.rows[0].video_public_id;
    const oldVideoUrl = oldProductResult.rows[0].video_url;

    // Build update query dynamically
    let updateQuery, updateParams;
    if (videoFile) {
      updateQuery = `UPDATE products SET name=$1, price=$2, original_price=$3, category=$4, description=$5, available=$6, video_url=$7, video_public_id=NULL WHERE id=$8 RETURNING *`;
      updateParams = [name, price, originalPrice, category, description, available, newVideoUrl, id];
    } else if (setVideoNull) {
      updateQuery = `UPDATE products SET name=$1, price=$2, original_price=$3, category=$4, description=$5, available=$6, video_url=NULL, video_public_id=NULL WHERE id=$7 RETURNING *`;
      updateParams = [name, price, originalPrice, category, description, available, id];
    } else {
      updateQuery = `UPDATE products SET name=$1, price=$2, original_price=$3, category=$4, description=$5, available=$6 WHERE id=$7 RETURNING *`;
      updateParams = [name, price, originalPrice, category, description, available, id];
    }

    const productResult = await client.query(updateQuery, updateParams);

    // Delete specified images (DB rows now; storage cleanup happens after commit)
    let deletedImages = [];
    if (idsToDelete.length > 0) {
      const imgResult = await client.query(
        `SELECT id, cloudinary_public_id, image_thumb, image_medium, image_large
         FROM product_images WHERE id = ANY($1::int[]) AND product_id = $2`,
        [idsToDelete, id]
      );
      deletedImages = imgResult.rows;
      await client.query('DELETE FROM product_images WHERE id = ANY($1::int[]) AND product_id = $2', [idsToDelete, id]);
    }

    // Add new images
    if (uploadedImages.length > 0) {
      const existingImages = await client.query(
        'SELECT COUNT(*) FROM product_images WHERE product_id = $1',
        [id]
      );
      const hasExisting = parseInt(existingImages.rows[0].count) > 0;

      for (let i = 0; i < uploadedImages.length; i++) {
        const { thumb, medium, large } = uploadedImages[i];
        await client.query(
          `INSERT INTO product_images (product_id, image_url, cloudinary_public_id, image_thumb, image_medium, image_large, is_primary)
           VALUES ($1, $2, NULL, $3, $4, $5, $6)`,
          [id, medium, thumb, medium, large, !hasExisting && i === 0]
        );
      }
    }

    await client.query('COMMIT');

    const imagesResult = await pool.query(PRODUCT_IMAGES_SELECT, [id]);

    res.json({ ...productResult.rows[0], images: imagesResult.rows });

    // Clean up replaced/removed storage assets (non-blocking, after commit)
    if (videoFile || setVideoNull) {
      if (oldVideoPublicId) {
        cloudinary.uploader.destroy(oldVideoPublicId, { resource_type: 'video' }).catch(console.error);
      } else if (oldVideoUrl) {
        deleteMedia(oldVideoUrl).catch(console.error);
      }
    }
    for (const img of deletedImages) {
      if (img.cloudinary_public_id) {
        cloudinary.uploader.destroy(img.cloudinary_public_id).catch(console.error);
      } else {
        deleteMedia([img.image_thumb, img.image_medium, img.image_large]).catch(console.error);
      }
    }
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  } finally {
    client?.release();
  }
});

// PATCH /api/admin/products/:id/availability - toggle availability
router.patch('/products/:id/availability', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;
    if (typeof available !== 'boolean') {
      return res.status(400).json({ error: 'available must be true or false' });
    }

    const result = await pool.query(
      'UPDATE products SET available = $1 WHERE id = $2 RETURNING *',
      [available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling availability:', err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', authenticateAdmin, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const { id } = req.params;

    // Get storage references before deleting
    const imagesResult = await client.query(
      'SELECT cloudinary_public_id, image_thumb, image_medium, image_large FROM product_images WHERE product_id = $1',
      [id]
    );
    const videoResult = await client.query(
      'SELECT video_public_id, video_url FROM products WHERE id = $1',
      [id]
    );

    // Delete product (cascade deletes images from DB)
    const result = await client.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    await client.query('COMMIT');

    // Destroy storage assets after DB commit (non-blocking)
    for (const img of imagesResult.rows) {
      if (img.cloudinary_public_id) {
        cloudinary.uploader.destroy(img.cloudinary_public_id).catch(console.error);
      } else {
        deleteMedia([img.image_thumb, img.image_medium, img.image_large]).catch(console.error);
      }
    }
    const video = videoResult.rows[0];
    if (video?.video_public_id) {
      cloudinary.uploader.destroy(video.video_public_id, { resource_type: 'video' }).catch(console.error);
    } else if (video?.video_url) {
      deleteMedia(video.video_url).catch(console.error);
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  } finally {
    client?.release();
  }
});

// GET /api/admin/orders
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = result.rows[0];

    // Send status update email (non-blocking)
    sendStatusUpdate(order, status).catch(err => console.error('Status email error:', err));

    res.json(order);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/admin/test-notification — sends a test push and returns OneSignal's raw response
router.post('/test-notification', authenticateAdmin, async (req, res) => {
  const { sendFlashSaleNotification } = require('../services/notifications');
  try {
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ONESIGNAL_REST_API_KEY is not set on the server' });

    const result = await sendFlashSaleNotification();
    res.json({ ok: true, onesignal: result });
  } catch (err) {
    console.error('[Admin] test notification failed:', err);
    res.status(502).json({ error: `Push notification failed: ${err.message}` });
  }
});

// GET /api/admin/flash-sale
router.get('/flash-sale', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, active, end_date, banner_image_public_id, updated_at,
        banner_image_thumb, banner_image_medium, banner_image_large,
        COALESCE(banner_image_large, banner_image_url) AS banner_image_url
      FROM flash_sale_settings WHERE id = 1
    `);
    res.json(result.rows[0] || { id: 1, active: false, end_date: null, banner_image_url: null, banner_image_public_id: null });
  } catch (err) {
    console.error('Error fetching flash sale:', err);
    res.status(500).json({ error: 'Failed to fetch flash sale settings' });
  }
});

// PUT /api/admin/flash-sale
router.put('/flash-sale', authenticateAdmin, handleBannerUpload, async (req, res) => {
  try {
    const { active, end_date, clearBanner } = req.body;
    const bannerFile = req.file;
    if (end_date && Number.isNaN(Date.parse(end_date))) {
      return res.status(400).json({ error: 'Invalid end date' });
    }

    // Ensure the settings row always exists before updating
    await pool.query(`INSERT INTO flash_sale_settings (id, active) VALUES (1, false) ON CONFLICT (id) DO NOTHING`);

    const current = await pool.query(
      `SELECT active, banner_image_public_id, banner_image_thumb, banner_image_medium, banner_image_large
       FROM flash_sale_settings WHERE id = 1`
    );
    const currentPublicId = current.rows[0]?.banner_image_public_id;
    const currentThumb = current.rows[0]?.banner_image_thumb;
    const currentMedium = current.rows[0]?.banner_image_medium;
    const currentLarge = current.rows[0]?.banner_image_large;
    const wasActive = current.rows[0]?.active ?? false;

    let bannerVariants = null;
    if (bannerFile) {
      try {
        bannerVariants = await uploadImage(bannerFile.buffer, 'norahairline/banners');
      } catch (err) {
        console.error('Banner upload error:', err);
        return res.status(400).json({ error: err.message || 'Failed to process banner image' });
      }
    }
    const shouldClear = !bannerFile && clearBanner === 'true';

    const setClauses = [`active = $1`, `end_date = $2`, `updated_at = NOW()`];
    const values = [active === 'true' || active === true, end_date || null];

    if (bannerVariants) {
      const nextIdx = values.length + 1;
      setClauses.push(
        `banner_image_url = NULL`,
        `banner_image_public_id = NULL`,
        `banner_image_thumb = $${nextIdx}`,
        `banner_image_medium = $${nextIdx + 1}`,
        `banner_image_large = $${nextIdx + 2}`
      );
      values.push(bannerVariants.thumb, bannerVariants.medium, bannerVariants.large);
    } else if (shouldClear) {
      setClauses.push(
        `banner_image_url = NULL`,
        `banner_image_public_id = NULL`,
        `banner_image_thumb = NULL`,
        `banner_image_medium = NULL`,
        `banner_image_large = NULL`
      );
    }

    const result = await pool.query(
      `UPDATE flash_sale_settings SET ${setClauses.join(', ')} WHERE id = 1 RETURNING *`,
      values
    );

    res.json(result.rows[0]);

    // Clean up the replaced/removed banner (non-blocking, after response)
    if (bannerVariants || shouldClear) {
      if (currentPublicId) {
        cloudinary.uploader.destroy(currentPublicId).catch(console.error);
      } else {
        deleteMedia([currentThumb, currentMedium, currentLarge]).catch(console.error);
      }
    }

    // Notify subscribers when sale is switched on (not on every save)
    const nowActive = active === 'true' || active === true;
    if (nowActive && !wasActive) {
      console.log('[Admin] Flash sale activated, firing push notification');
      sendFlashSaleNotification().catch(err => {
        console.error('[Admin] Push notification failed for flash sale:', err.message);
      });
    } else {
      console.log('[Admin] Flash sale update saved (no notification — was already active or being deactivated)');
    }
  } catch (err) {
    console.error('Error updating flash sale:', err);
    res.status(500).json({ error: 'Failed to update flash sale settings' });
  }
});

// GET /api/admin/gallery
router.get('/gallery', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, media_type, created_at, cloudinary_public_id,
        file_thumb, file_medium, file_large,
        COALESCE(file_medium, file_url) AS file_url
      FROM gallery_items ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching gallery:', err);
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
});

// POST /api/admin/gallery
router.post('/gallery', authenticateAdmin, handleGalleryUpload, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

    let fileUrl = null, thumb = null, medium = null, large = null;
    if (mediaType === 'video') {
      fileUrl = await uploadVideo(file.buffer, 'norahairline/gallery', file.mimetype, file.originalname);
    } else {
      ({ thumb, medium, large } = await uploadImage(file.buffer, 'norahairline/gallery'));
      fileUrl = medium; // gallery_items.file_url is NOT NULL — legacy column mirrors the medium variant
    }

    const result = await pool.query(
      `INSERT INTO gallery_items (file_url, cloudinary_public_id, media_type, file_thumb, file_medium, file_large)
       VALUES ($1, NULL, $2, $3, $4, $5)
       RETURNING id, media_type, created_at, file_thumb, file_medium, file_large,
         COALESCE(file_medium, file_url) AS file_url`,
      [fileUrl, mediaType, thumb, medium, large]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error uploading gallery item:', err);
    res.status(400).json({ error: err.message || 'Failed to upload gallery item' });
  }
});

// DELETE /api/admin/gallery/:id
router.delete('/gallery/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM gallery_items WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gallery item not found' });

    const item = result.rows[0];
    await pool.query('DELETE FROM gallery_items WHERE id = $1', [id]);

    // Migrated items have both a Cloudinary original and R2 copies, so clean
    // up both. deleteMedia ignores URLs that aren't on R2.
    if (item.cloudinary_public_id) {
      const resourceType = item.media_type === 'video' ? 'video' : 'image';
      cloudinary.uploader.destroy(item.cloudinary_public_id, { resource_type: resourceType }).catch(console.error);
    }
    deleteMedia([item.file_url, item.file_thumb, item.file_medium, item.file_large]).catch(console.error);

    res.json({ message: 'Gallery item deleted successfully' });
  } catch (err) {
    console.error('Error deleting gallery item:', err);
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

module.exports = router;
