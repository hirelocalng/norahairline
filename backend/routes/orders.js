const express = require('express');
const router = express.Router();
const pool = require('../db');
const { sendOrderConfirmation } = require('../services/email');

// POST /api/orders - create order (public)
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, customerAddress, customerState, items, total, paymentMethod } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !customerState || !items?.length || !total || !paymentMethod) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const validMethods = ['whatsapp', 'korapay'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const result = await pool.query(
      `INSERT INTO orders (customer_name, customer_phone, customer_email, customer_address, customer_state, items, total, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [customerName, customerPhone, customerEmail || null, customerAddress, customerState, JSON.stringify(items), total, paymentMethod]
    );

    const order = result.rows[0];

    // Send confirmation email (non-blocking)
    sendOrderConfirmation(order).catch(err => console.error('Confirmation email error:', err));

    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
