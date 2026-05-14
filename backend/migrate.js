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

  // Create categories table
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      image_url VARCHAR(500),
      cloudinary_public_id VARCHAR(500),
      description VARCHAR(255),
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('categories table ready');

  // Seed existing + new categories (skip if already present)
  await client.query(`
    INSERT INTO categories (name, image_url, description, sort_order) VALUES
      ('Wigs',                '/categories/wigs.jpg',                  'Full wigs for every occasion',  1),
      ('Frontals',            '/categories/frontals.jpg',              'Natural hairline frontals',      2),
      ('Closures',            '/categories/closures.jpg',              'Seamless closures',              3),
      ('360 Illusion Frontal','/categories/360-frontal.jpg',           'Full 360 coverage',              4),
      ('Bundles',             '/categories/bundles.jpg',               'Premium hair bundles',           5),
      ('Vietnam Bone Straight','/categories/vietnam-bone-straight.jpg','Ultra silky straight',           6),
      ('Pixie Curls',         '/categories/pixie-curls.jpg',           'Beautiful curly pixie',          7),
      ('Curly Hair',          '/categories/curly-hair.jpg',            'Natural curly textures',         8),
      ('Hair Products',       NULL,                                    'Premium hair care products',     9)
    ON CONFLICT (name) DO NOTHING
  `);
  console.log('categories seeded');

  await client.end();
  console.log('Migration complete');
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
