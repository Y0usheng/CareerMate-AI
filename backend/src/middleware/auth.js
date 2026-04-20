const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, config.secretKey);
  } catch {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }

  const userId = parseInt(payload.sub, 10);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({ detail: 'User not found' });
  }
  if (!user.is_active) {
    return res.status(403).json({ detail: 'Account is inactive' });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };
