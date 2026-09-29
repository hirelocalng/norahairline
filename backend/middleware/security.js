// Security headers and a small in-memory rate limiter. Railway runs a single
// instance, so per-process counters are enough; no extra dependencies.

function originOf(url) {
  try { return new URL(url).origin; } catch { return null; }
}

// Only the third-party origins the site actually loads from:
//  - R2 public bucket (cdn.norahairline.com) for product/gallery media
//  - res.cloudinary.com for legacy media not yet migrated to R2
//  - OneSignal for web push (SDK script, styles, API, subscription iframe)
const MEDIA_ORIGINS = [
  originOf(process.env.R2_PUBLIC_URL) || 'https://cdn.norahairline.com',
  'https://res.cloudinary.com',
];
const ONESIGNAL = ['https://cdn.onesignal.com', 'https://onesignal.com', 'https://*.onesignal.com'];

const CSP = [
  `default-src 'self'`,
  `script-src 'self' ${ONESIGNAL.join(' ')}`,
  // 'unsafe-inline' for styles only: React style={{}} props and OneSignal's
  // injected widget styles both need it. Scripts stay strict.
  `style-src 'self' 'unsafe-inline' ${ONESIGNAL.join(' ')}`,
  `img-src 'self' data: blob: ${MEDIA_ORIGINS.join(' ')} ${ONESIGNAL.join(' ')}`,
  `media-src 'self' blob: ${MEDIA_ORIGINS.join(' ')}`,
  `font-src 'self' data:`,
  `connect-src 'self' ${ONESIGNAL.join(' ')}`,
  `frame-src ${ONESIGNAL.join(' ')}`,
  `worker-src 'self'`,
  `manifest-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join('; ');

function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY'); // legacy browsers; CSP frame-ancestors covers the rest
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // WhatsApp opens in a popup
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

// Fixed-window limiter keyed by client IP (req.ip honours `trust proxy`).
function rateLimit({ windowMs, max, message = 'Too many requests. Please try again later.' }) {
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs);
  sweep.unref();

  return function limiter(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      console.warn(`[rate-limit] ${req.method} ${req.originalUrl} blocked for ${key}`);
      return res.status(429).json({ error: message });
    }
    next();
  };
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please wait 15 minutes and try again.',
});
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many orders from this device. Please wait a few minutes or chat us on WhatsApp.',
});

module.exports = { securityHeaders, rateLimit, loginLimiter, adminLimiter, orderLimiter };
