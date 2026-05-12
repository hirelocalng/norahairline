require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function run() {
  const newEmail = 'norahairline@gmail.com';
  const newPassword = 'Kaima@2026';

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  const hash = await bcrypt.hash(newPassword, 10);

  const result = await client.query(
    'UPDATE admins SET email = $1, password_hash = $2 WHERE id = (SELECT id FROM admins ORDER BY id LIMIT 1) RETURNING email',
    [newEmail, hash]
  );

  if (result.rows.length === 0) {
    await client.query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [newEmail, hash]);
    console.log('Admin created:', newEmail);
  } else {
    console.log('Admin updated:', result.rows[0].email);
  }

  await client.end();
}

run().catch(err => { console.error('Failed:', err.message); process.exit(1); });
