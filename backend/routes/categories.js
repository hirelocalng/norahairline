const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/categories — public, returns all categories ordered by sort_order
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY sort_order ASC, name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
