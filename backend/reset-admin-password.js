require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function run() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  const hash = await bcrypt.hash(password, 10);
  const result = await client.query(
    'UPDATE admins SET password_hash = $1 WHERE email = $2 RETURNING email',
    [hash, 'admin@norahairline.com']
  );

  if (result.rows.length === 0) {
    // Admin doesn't exist yet — insert it
    await client.query(
      'INSERT INTO admins (email, password_hash) VALUES ($1, $2)',
      ['admin@norahairline.com', hash]
    );
    console.log('Admin user created with ADMIN_PASSWORD');
  } else {
    console.log('Admin password updated for:', result.rows[0].email);
  }

  await client.end();
}

run().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
