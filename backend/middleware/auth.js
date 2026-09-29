const jwt = require('jsonwebtoken');

// Placeholder phrases from templates/tutorials, matched anywhere in the value
const PLACEHOLDER = /change[-_ ]?(in[-_ ]?production|me|this)|your[-_ ]?(strong[-_ ]?)?(jwt[-_ ]?)?secret|secret[-_ ]?here|^secret$/i;

// Logged once at startup so a placeholder secret shows up in Railway logs.
function checkJwtSecret() {
  const secret = process.env.JWT_SECRET || '';
  if (!secret) {
    console.error('[auth] JWT_SECRET is not set — admin login will not work.');
  } else if (secret.length < 32 || PLACEHOLDER.test(secret)) {
    console.error('[auth] JWT_SECRET is weak or a placeholder. Set a random 64+ character value on Railway.');
  }
}

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Access denied. Please log in.' });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
};

module.exports = { authenticateAdmin, checkJwtSecret };
