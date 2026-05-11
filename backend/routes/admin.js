const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// POST /api/admin/products - create product
router.post('/products', authenticateAdmin, upload.array('images', 10), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, price, category, description, available } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const productResult = await client.query(
      `INSERT INTO products (name, price, category, description, available)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, parseFloat(price), category, description || '', available !== 'false']
    );

    const product = productResult.rows[0];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/${file.filename}`;
        const isPrimary = i === 0;

        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary)
           VALUES ($1, $2, $3)`,
          [product.id, imageUrl, isPrimary]
        );
      }
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
router.put('/products/:id', authenticateAdmin, upload.array('images', 10), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { name, price, category, description, available, deleteImageIds } = req.body;

    const productResult = await client.query(
      `UPDATE products
       SET name = $1, price = $2, category = $3, description = $4, available = $5
       WHERE id = $6 RETURNING *`,
      [name, parseFloat(price), category, description || '', available !== 'false', id]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete specified images
    if (deleteImageIds) {
      const idsToDelete = JSON.parse(deleteImageIds);
      for (const imgId of idsToDelete) {
        const imgResult = await client.query(
          'SELECT image_url FROM product_images WHERE id = $1 AND product_id = $2',
          [imgId, id]
        );
        if (imgResult.rows.length > 0) {
          const filePath = path.join(__dirname, '..', imgResult.rows[0].image_url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          await client.query('DELETE FROM product_images WHERE id = $1', [imgId]);
        }
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      // Check if there are existing images
      const existingImages = await client.query(
        'SELECT COUNT(*) FROM product_images WHERE product_id = $1',
        [id]
      );
      const hasExisting = parseInt(existingImages.rows[0].count) > 0;

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/${file.filename}`;
        const isPrimary = !hasExisting && i === 0;

        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary)
           VALUES ($1, $2, $3)`,
          [id, imageUrl, isPrimary]
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

    // Get all images to delete files
    const imagesResult = await client.query(
      'SELECT image_url FROM product_images WHERE product_id = $1',
      [id]
    );

    // Delete image files
    for (const img of imagesResult.rows) {
      const filePath = path.join(__dirname, '..', img.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

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
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  } finally {
    client.release();
  }
});

module.exports = router;
