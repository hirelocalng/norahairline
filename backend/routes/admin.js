const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/upload');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/admin/change-password
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
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
        pi.image_url AS primary_image
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

    const imagesResult = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC',
      [id]
    );

    res.json({ ...productResult.rows[0], images: imagesResult.rows });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

const uploadFields = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]);

// POST /api/admin/products - create product
router.post('/products', authenticateAdmin, uploadFields, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, price, category, description, available } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const imageFiles = req.files?.images || [];
    const videoFile = req.files?.video?.[0] || null;
    const videoUrl = videoFile ? videoFile.path : null;
    const videoPublicId = videoFile ? videoFile.filename : null;

    const productResult = await client.query(
      `INSERT INTO products (name, price, category, description, available, video_url, video_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, parseFloat(price), category, description || '', available !== 'false', videoUrl, videoPublicId]
    );

    const product = productResult.rows[0];

    for (let i = 0; i < imageFiles.length; i++) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, cloudinary_public_id, is_primary) VALUES ($1, $2, $3, $4)`,
        [product.id, imageFiles[i].path, imageFiles[i].filename, i === 0]
      );
    }

    await client.query('COMMIT');

    const imagesResult = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1',
      [product.id]
    );

    res.status(201).json({ ...product, images: imagesResult.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    client.release();
  }
});

// PUT /api/admin/products/:id - update product
router.put('/products/:id', authenticateAdmin, uploadFields, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { name, price, category, description, available, deleteImageIds, deleteVideo } = req.body;

    const imageFiles = req.files?.images || [];
    const videoFile = req.files?.video?.[0] || null;
    const setVideoNull = deleteVideo === 'true';

    // Build update query dynamically
    let updateQuery, updateParams;
    if (videoFile) {
      updateQuery = `UPDATE products SET name=$1, price=$2, category=$3, description=$4, available=$5, video_url=$6, video_public_id=$7 WHERE id=$8 RETURNING *`;
      updateParams = [name, parseFloat(price), category, description || '', available !== 'false', videoFile.path, videoFile.filename, id];
    } else if (setVideoNull) {
      updateQuery = `UPDATE products SET name=$1, price=$2, category=$3, description=$4, available=$5, video_url=NULL, video_public_id=NULL WHERE id=$6 RETURNING *`;
      updateParams = [name, parseFloat(price), category, description || '', available !== 'false', id];
    } else {
      updateQuery = `UPDATE products SET name=$1, price=$2, category=$3, description=$4, available=$5 WHERE id=$6 RETURNING *`;
      updateParams = [name, parseFloat(price), category, description || '', available !== 'false', id];
    }

    // Fetch old video public_id before updating
    const oldProductResult = await pool.query('SELECT video_public_id FROM products WHERE id=$1', [id]);
    const oldVideoPublicId = oldProductResult.rows[0]?.video_public_id;

    const productResult = await client.query(updateQuery, updateParams);

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    // Destroy old Cloudinary video if replaced or removed
    if ((videoFile || setVideoNull) && oldVideoPublicId) {
      cloudinary.uploader.destroy(oldVideoPublicId, { resource_type: 'video' }).catch(console.error);
    }

    // Delete specified images
    if (deleteImageIds) {
      const idsToDelete = JSON.parse(deleteImageIds);
      for (const imgId of idsToDelete) {
        const imgResult = await client.query(
          'SELECT cloudinary_public_id FROM product_images WHERE id = $1 AND product_id = $2',
          [imgId, id]
        );
        if (imgResult.rows.length > 0) {
          const publicId = imgResult.rows[0].cloudinary_public_id;
          if (publicId) cloudinary.uploader.destroy(publicId).catch(console.error);
          await client.query('DELETE FROM product_images WHERE id = $1', [imgId]);
        }
      }
    }

    // Add new images
    if (imageFiles.length > 0) {
      const existingImages = await client.query(
        'SELECT COUNT(*) FROM product_images WHERE product_id = $1',
        [id]
      );
      const hasExisting = parseInt(existingImages.rows[0].count) > 0;

      for (let i = 0; i < imageFiles.length; i++) {
        await client.query(
          `INSERT INTO product_images (product_id, image_url, cloudinary_public_id, is_primary) VALUES ($1, $2, $3, $4)`,
          [id, imageFiles[i].path, imageFiles[i].filename, !hasExisting && i === 0]
        );
      }
    }

    await client.query('COMMIT');

    const imagesResult = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC',
      [id]
    );

    res.json({ ...productResult.rows[0], images: imagesResult.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/products/:id/availability - toggle availability
router.patch('/products/:id/availability', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;

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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get Cloudinary public IDs before deleting
    const imagesResult = await client.query(
      'SELECT cloudinary_public_id FROM product_images WHERE product_id = $1',
      [id]
    );
    const videoResult = await client.query(
      'SELECT video_public_id FROM products WHERE id = $1',
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

    // Destroy Cloudinary assets after DB commit (non-blocking)
    for (const img of imagesResult.rows) {
      if (img.cloudinary_public_id) cloudinary.uploader.destroy(img.cloudinary_public_id).catch(console.error);
    }
    const videoPublicId = videoResult.rows[0]?.video_public_id;
    if (videoPublicId) cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' }).catch(console.error);

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  } finally {
    client.release();
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
