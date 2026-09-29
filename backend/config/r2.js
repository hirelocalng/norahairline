const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
  console.error('[R2] ERROR: R2 credentials are missing from .env!');
  console.error('[R2] Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_URL to your .env file.');
}

const r2Client = new S3Client({
  region: 'auto',
  // Fail fast instead of hanging an admin upload when R2 is unreachable
  requestHandler: { connectionTimeout: 5000, requestTimeout: 60000 },
  maxAttempts: 3,
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = r2Client;
