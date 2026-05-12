const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/orders - create order (public)
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, customerState, items, total, paymentMethod } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !customerState || !items?.length || !total || !paymentMethod) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await pool.query(
      `INSERT INTO orders (customer_name, customer_phone, customer_address, customer_state, items, total, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customerName, customerPhone, customerAddress, customerState, JSON.stringify(items), total, paymentMethod]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
