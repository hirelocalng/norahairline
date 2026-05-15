const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Ensure flash_sale_settings table exists with full schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS flash_sale_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        active BOOLEAN DEFAULT false,
        end_date TIMESTAMPTZ,
        banner_image_url VARCHAR(500),
        banner_image_public_id VARCHAR(500),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT flash_sale_single_row CHECK (id = 1)
      )
    `);
    // Add each column individually in case the table predates a column
    await client.query(`ALTER TABLE flash_sale_settings ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false`);
    await client.query(`ALTER TABLE flash_sale_settings ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ`);
    await client.query(`ALTER TABLE flash_sale_settings ADD COLUMN IF NOT EXISTS banner_image_url VARCHAR(500)`);
    await client.query(`ALTER TABLE flash_sale_settings ADD COLUMN IF NOT EXISTS banner_image_public_id VARCHAR(500)`);
    await client.query(`ALTER TABLE flash_sale_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    // Seed the single config row
    await client.query(`INSERT INTO flash_sale_settings (id, active) VALUES (1, false) ON CONFLICT (id) DO NOTHING`);

    // Products: columns added after initial schema
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_public_id VARCHAR(500)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT NULL`);

    // product_images: cloudinary support
    await client.query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(500)`);

    console.log('Migrations complete');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Nora Hair Line API is running' });
});

// Public flash sale status
app.get('/api/flash-sale', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT active, end_date, banner_image_url FROM flash_sale_settings WHERE id = 1'
    );
    res.json(result.rows[0] || { active: false, end_date: null, banner_image_url: null });
  } catch (err) {
    res.json({ active: false, end_date: null, banner_image_url: null });
  }
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Nora Hair Line server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Server failed to start due to migration error:', err.message);
    process.exit(1);
  });
