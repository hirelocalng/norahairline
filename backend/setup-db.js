/**
 * Database setup script for Nora Hair Line
 * Run: node setup-db.js
 */

require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Parse connection string to get db name, then connect to postgres first
const connectionString = process.env.DATABASE_URL;
const dbName = 'norahairline';

// Build a connection to the default 'postgres' database to create our DB
function getAdminConnection() {
  if (connectionString) {
    // Replace the database name with 'postgres' to bootstrap
    const adminUrl = connectionString.replace(/\/[^/]+(\?|$)/, '/postgres$1');
    return new Client({ connectionString: adminUrl, ssl: false });
  }
  return new Client({ database: 'postgres', ssl: false });
}

async function run() {
  console.log('\n🌿 Nora Hair Line — Database Setup\n');

  // Step 1: Create database if it doesn't exist
  const adminClient = getAdminConnection();
  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    const existing = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
    );

    if (existing.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created`);
    } else {
      console.log(`ℹ️  Database "${dbName}" already exists`);
    }
  } finally {
    await adminClient.end();
  }

  // Step 2: Connect to the norahairline database and run schema
  const appClient = connectionString
    ? new Client({ connectionString, ssl: false })
    : new Client({ database: dbName, ssl: false });

  try {
    await appClient.connect();
    console.log(`✅ Connected to "${dbName}" database`);

    // Create tables
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "products" ready');

    await appClient.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "product_images" ready');

    await appClient.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "admins" ready');

    // Indexes
    await appClient.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    await appClient.query(`CREATE INDEX IF NOT EXISTS idx_products_available ON products(available)`);
    await appClient.query(`CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)`);
    await appClient.query(`CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary)`);
    console.log('✅ Indexes created');

    // Default admin user (password: "password")
    const passwordHash = await bcrypt.hash('password', 10);
    await appClient.query(`
      INSERT INTO admins (email, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@norahairline.com', passwordHash]);
    console.log('✅ Default admin user ready');

    // Seed sample products for testing
    const sampleProducts = [
      {
        name: 'Brazilian Body Wave Wig 18"',
        price: 45000,
        category: 'Wigs',
        description: 'Lush Brazilian body wave wig with natural bounce. Full lace, 18 inches, 150% density.',
      },
      {
        name: 'HD Lace Frontal 13x4',
        price: 28000,
        category: 'Frontals',
        description: 'Invisible HD lace frontal for the most natural-looking hairline. Pre-plucked baby hairs.',
      },
      {
        name: 'Straight 5x5 Closure',
        price: 18000,
        category: 'Closures',
        description: 'Silky straight 5x5 lace closure. Bleached knots, natural parting.',
      },
      {
        name: 'Vietnam Bone Straight Bundle 3pcs',
        price: 65000,
        category: 'Vietnam Bone Straight',
        description: 'Ultra silky Vietnam bone straight hair. 3 bundles (12"+14"+16"), double weft.',
      },
      {
        name: '360 Illusion Frontal Band',
        price: 35000,
        category: '360 Illusion Frontal',
        description: 'Full 360 illusion lace frontal for a complete natural look all around.',
      },
      {
        name: 'Pixie Curls Wig 12"',
        price: 38000,
        category: 'Pixie Curls',
        description: 'Gorgeous tight pixie curls wig. Bouncy, natural-looking, long-lasting curls.',
      },
    ];

    let seeded = 0;
    for (const product of sampleProducts) {
      const existing = await appClient.query(
        'SELECT id FROM products WHERE name = $1', [product.name]
      );
      if (existing.rows.length === 0) {
        await appClient.query(
          `INSERT INTO products (name, price, category, description, available)
           VALUES ($1, $2, $3, $4, true)`,
          [product.name, product.price, product.category, product.description]
        );
        seeded++;
      }
    }
    if (seeded > 0) console.log(`✅ Seeded ${seeded} sample products`);
    else console.log('ℹ️  Sample products already exist');

    // Final verification
    const productCount = await appClient.query('SELECT COUNT(*) FROM products');
    const adminCount = await appClient.query('SELECT COUNT(*) FROM admins');

    console.log('\n📊 Database Summary:');
    console.log(`   Products : ${productCount.rows[0].count}`);
    console.log(`   Admins   : ${adminCount.rows[0].count}`);
    console.log('\n🎉 Database setup complete!\n');
    console.log('🔐 Admin Login:');
    console.log('   Email   : admin@norahairline.com');
    console.log('   Password: password\n');
    console.log('👉 Next steps:');
    console.log('   1. cd backend && npm run dev');
    console.log('   2. cd frontend && npm run dev');
    console.log('   3. Open http://localhost:5173\n');

  } finally {
    await appClient.end();
  }
}

run().catch(err => {
  console.error('\n❌ Setup failed:', err.message);
  if (err.message.includes('password') || err.message.includes('authentication')) {
    console.error('\n💡 Fix: Create a .env file in the backend folder:');
    console.error('   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/norahairline\n');
  }
  process.exit(1);
});
