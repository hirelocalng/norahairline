require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log('Connected to database');

  // Add columns to products that were added after initial migration
  await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)`);
  await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_public_id VARCHAR(500)`);
  console.log('products: video_url, video_public_id columns ready');

  // Add cloudinary_public_id to product_images
  await client.query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(500)`);
  console.log('product_images: cloudinary_public_id column ready');

  // Create orders table
  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255),
      customer_address TEXT NOT NULL,
      customer_state VARCHAR(100) NOT NULL,
      items JSONB NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Add email column if table already existed without it
  await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)`);
  console.log('orders table ready');

  // Create flash_sale_settings table (single-row config)
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
  await client.query(`
    INSERT INTO flash_sale_settings (id, active) VALUES (1, false) ON CONFLICT (id) DO NOTHING
  `);
  console.log('flash_sale_settings table ready');

  await client.end();
  console.log('Migration complete');
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
