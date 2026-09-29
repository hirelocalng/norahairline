const express = require('express');
const router = express.Router();
const pool = require('../db');
const { cleanLine, toPositiveInt } = require('../utils/validate');

router.param('id', (req, res, next, value) => {
  const id = toPositiveInt(value);
  if (!id) return res.status(404).json({ error: 'Product not found' });
  req.params.id = id;
  next();
});

// product_images select shared with the single-product route below —
// image_url/thumb/medium/large all fall back to the legacy Cloudinary
// image_url column so pre-migration products keep rendering.
const PRODUCT_IMAGES_SELECT = `
  SELECT id, product_id, is_primary, created_at,
    COALESCE(image_thumb, image_url) AS image_thumb,
    COALESCE(image_medium, image_url) AS image_medium,
    COALESCE(image_large, image_url) AS image_large,
    COALESCE(image_medium, image_url) AS image_url
  FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC
`;

// GET all available products (with primary image)
router.get('/', async (req, res) => {
  try {
    const category = cleanLine(req.query.category, 100);
    let query = `
      SELECT p.*,
        COALESCE(pi.image_thumb, pi.image_url) AS primary_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.available = true
    `;
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET featured products (latest 8 available)
router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(pi.image_thumb, pi.image_url) AS primary_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.available = true
      ORDER BY p.created_at DESC
      LIMIT 8
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching featured products:', err);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// GET categories with product counts
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM products
      WHERE available = true
      GROUP BY category
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET single product with all images
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND available = true',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const imagesResult = await pool.query(PRODUCT_IMAGES_SELECT, [id]);

    const product = {
      ...productResult.rows[0],
      images: imagesResult.rows
    };

    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
