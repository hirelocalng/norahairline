const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

// An idle client erroring (e.g. Postgres restarting) is recoverable — the
// pool discards that client. Previously this exited the whole server.
pool.on('error', (err) => {
  console.error('[db] idle client error:', err.message);
});

module.exports = pool;
