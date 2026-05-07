const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const config = require('../config');
const { collections } = require('../database');

async function requireAuth(req, res, next) {
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

  let _id;
  try {
    _id = new ObjectId(String(payload.sub));
  } catch {
    return res.status(401).json({ detail: 'Invalid token subject' });
  }

  let user;
  try {
    user = await collections.users().findOne({ _id });
  } catch (err) {
    return next(err);
  }
  if (!user) {
    return res.status(401).json({ detail: 'User not found' });
  }
  if (user.is_active === false) {
    return res.status(403).json({ detail: 'Account is inactive' });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };
