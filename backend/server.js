const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const pool = require('./db');
const { securityHeaders } = require('./middleware/security');
const { checkJwtSecret } = require('./middleware/auth');
const { withTimeout } = require('./utils/timeout');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Last-resort logging so nothing fails silently in Railway logs
process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[process] uncaught exception — exiting so Railway restarts the service:', err);
  process.exit(1);
});

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

    // product_images: R2 variants (image_url kept for legacy Cloudinary rows)
    await client.query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS image_thumb VARCHAR(500)`);
    await client.query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS image_medium VARCHAR(500)`);
    await client.query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS image_large VARCHAR(500)`);

    // Gallery items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery_items (
        id SERIAL PRIMARY KEY,
        file_url VARCHAR(500) NOT NULL,
        cloudinary_public_id VARCHAR(500),
        media_type VARCHAR(10) NOT NULL DEFAULT 'image',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON gallery_items(created_at DESC)`);

    // gallery_items: R2 variants (file_url kept for legacy Cloudinary rows)
    await client.query(`ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS file_thumb VARCHAR(500)`);
    await client.query(`ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS file_medium VARCHAR(500)`);
    await client.query(`ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS file_large VARCHAR(500)`);

    // flash_sale_settings: R2 banner variants (banner_image_url kept for legacy Cloudinary rows)
    await client.query(`ALTER TABLE flash_sale_settings ADD COLUMN IF NOT EXISTS banner_image_thumb VARCHAR(500)`);
    await client.query(`ALTER TABLE flash_sale_settings ADD COLUMN IF NOT EXISTS banner_image_medium VARCHAR(500)`);
    await client.query(`ALTER TABLE flash_sale_settings ADD COLUMN IF NOT EXISTS banner_image_large VARCHAR(500)`);

    console.log('Migrations complete');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Railway terminates TLS in front of the app; trust its X-Forwarded-For so
// req.ip (used by the rate limiters) is the real client address.
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(securityHeaders);

// In production the API and frontend share an origin, so cross-origin calls
// are refused unless FRONTEND_URL explicitly allows one. Previously `true`
// reflected any origin.
app.use(cors({
  origin: isProduction
    ? (process.env.FRONTEND_URL || false)
    : (process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173']),
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Log server errors and slow requests (visible in Railway logs)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (res.statusCode >= 500 || ms > 5000) {
      console.error(`[http] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${ms}ms`);
    }
  });
  next();
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// Health check (Railway's healthcheckPath is /api/health). Includes a quick
// DB ping so a deploy that can't reach Postgres is reported unhealthy.
async function health(req, res) {
  try {
    await withTimeout(pool.query('SELECT 1'), 3000, 'DB ping');
    res.set('Cache-Control', 'no-store').json({ status: 'ok', db: 'ok', uptime: Math.round(process.uptime()) });
  } catch (err) {
    console.error('[health] database check failed:', err.message);
    res.status(503).set('Cache-Control', 'no-store').json({ status: 'error', db: 'unreachable' });
  }
}
app.get('/health', health);
app.get('/api/health', health);

// Public flash sale status
app.get('/api/flash-sale', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT active, end_date, COALESCE(banner_image_large, banner_image_url) AS banner_image_url
       FROM flash_sale_settings WHERE id = 1`
    );
    res.json(result.rows[0] || { active: false, end_date: null, banner_image_url: null });
  } catch (err) {
    res.json({ active: false, end_date: null, banner_image_url: null });
  }
});

// Public gallery endpoint
app.get('/api/gallery', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, media_type, created_at, COALESCE(file_medium, file_url) AS file_url
       FROM gallery_items ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[gallery] failed to load gallery:', err.message);
    res.json([]);
  }
});

// Unknown API routes get JSON, never the SPA shell
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Client-side routes that exist in frontend/src/App.jsx. Anything else still
// gets the SPA (which renders the 404 page) but with a real 404 status.
const SPA_ROUTES = [
  /^\/$/,
  /^\/(shop|about|cart|checkout)\/?$/,
  /^\/product\/\d+\/?$/,
  /^\/admin(\/.*)?$/,
];

const frontendDist = path.join(__dirname, '../frontend/dist');

// Serve React frontend in production
if (isProduction) {
  // Vite's hashed bundles never change, so they can be cached for a year
  app.use('/assets', express.static(path.join(frontendDist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(frontendDist, { index: false }));
  app.get('*', (req, res) => {
    const known = SPA_ROUTES.some(re => re.test(req.path));
    res.status(known ? 200 : 404).set('Cache-Control', 'no-cache').sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Final error handler: log the details, never send a stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  }
  if (res.headersSent) return;

  const message = err.type === 'entity.parse.failed' ? 'Invalid request body'
    : err.type === 'entity.too.large' ? 'Request is too large'
    : status < 500 ? (err.expose && err.message) || 'Bad request'
    : 'Something went wrong. Please try again.';

  if (req.path.startsWith('/api') || req.path === '/health' || !isProduction) {
    return res.status(status).json({ error: message });
  }
  res.status(status).sendFile(path.join(frontendDist, '500.html'), (sendErr) => {
    if (sendErr) res.status(status).type('text').send(message);
  });
});

checkJwtSecret();

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
