const express = require('express');
const router = express.Router();
const pool = require('../db');
const { sendOrderConfirmation } = require('../services/email');
const { orderLimiter } = require('../middleware/security');
const { NIGERIA_STATES, getDeliveryFee } = require('../config/delivery');
const { cleanLine, isPhone, toPositiveInt } = require('../utils/validate');

const MAX_LINE_ITEMS = 30;
const MAX_QUANTITY = 20;

// POST /api/orders - create order (public)
//
// Prices, names and the total are looked up / computed here from the
// products table; the client only chooses product ids and quantities.
router.post('/', orderLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const customerName = cleanLine(body.customerName, 100);
    const customerPhone = cleanLine(body.customerPhone, 20);
    const customerState = cleanLine(body.customerState, 50);

    const errors = {};
    if (customerName.length < 2) errors.name = 'Full name is required';
    if (!isPhone(customerPhone)) errors.phone = 'Enter a valid phone number';
    if (!NIGERIA_STATES.includes(customerState)) errors.state = 'Please select a valid state';
    if (body.paymentMethod !== undefined && body.paymentMethod !== 'whatsapp') {
      errors.paymentMethod = 'Invalid payment method';
    }

    // Merge duplicate lines and validate ids/quantities
    const requested = new Map();
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_LINE_ITEMS) {
      errors.items = 'Your cart is empty or invalid';
    } else {
      for (const item of body.items) {
        const id = toPositiveInt(item?.id);
        const quantity = toPositiveInt(item?.quantity);
        if (!id || !quantity || quantity > MAX_QUANTITY) {
          errors.items = 'Your cart contains an invalid item';
          break;
        }
        requested.set(id, Math.min(MAX_QUANTITY, (requested.get(id) || 0) + quantity));
      }
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ error: Object.values(errors)[0], fields: errors });
    }

    const { rows: products } = await pool.query(
      `SELECT id, name, price FROM products WHERE id = ANY($1::int[]) AND available = true`,
      [[...requested.keys()]]
    );
    const byId = new Map(products.map(p => [p.id, p]));
    const missing = [...requested.keys()].filter(id => !byId.has(id));
    if (missing.length) {
      return res.status(409).json({
        error: 'Some items in your cart are no longer available. Please review your cart.',
        unavailable: missing,
      });
    }

    const items = [...requested].map(([id, quantity]) => {
      const p = byId.get(id);
      return { id, name: p.name, price: Number(p.price), quantity };
    });
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = getDeliveryFee(customerState);
    const total = subtotal + deliveryFee;

    const result = await pool.query(
      `INSERT INTO orders (customer_name, customer_phone, customer_state, items, total, payment_method)
       VALUES ($1, $2, $3, $4, $5, 'whatsapp') RETURNING *`,
      [customerName, customerPhone, customerState, JSON.stringify(items), total]
    );
    const order = result.rows[0];

    // Email is best-effort: it has its own timeout and must never block or fail the order.
    sendOrderConfirmation(order).catch(err =>
      console.error(`[orders] confirmation email failed for order #${order.id}:`, err.message)
    );

    console.log(`[orders] created order #${order.id} (${items.length} line(s), ₦${total})`);
    res.status(201).json({
      id: order.id,
      items,
      subtotal,
      deliveryFee,
      total,
      customer: {
        name: customerName,
        phone: customerPhone,
        state: customerState,
      },
    });
  } catch (err) {
    console.error('[orders] failed to create order:', err);
    res.status(500).json({ error: 'We could not save your order. Please try again or chat us on WhatsApp.' });
  }
});

module.exports = router;
